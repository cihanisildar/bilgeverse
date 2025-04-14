import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, isAuthenticated, isAdmin, isTutor } from '@/lib/server-auth';
import { EventType, EventStatus, EventScope } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Students can see both global and group events
    const events = await prisma.event.findMany({
      orderBy: {
        startDateTime: 'asc'
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting event creation...');
    
    const currentUser = await getUserFromRequest(request);
    console.log('Current user:', { id: currentUser?.id, role: currentUser?.role });
    
    if (!isAuthenticated(currentUser)) {
      console.log('User not authenticated');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body);
    
    const { title, description, startDateTime, location, type, capacity, points, tags } = body;

    if (!title || !description || !startDateTime) {
      console.log('Missing required fields:', { title, description, startDateTime });
      return NextResponse.json(
        { error: 'Title, description, and start date are required' },
        { status: 400 }
      );
    }

    // Determine event scope based on user role
    const eventScope = isAdmin(currentUser) ? EventScope.GLOBAL : EventScope.GROUP;
    console.log('Event scope determined:', { eventScope, isAdmin: isAdmin(currentUser) });

    // Only admin can create global events, and tutors can only create group events
    if (eventScope === EventScope.GLOBAL && !isAdmin(currentUser)) {
      console.log('Unauthorized: Non-admin trying to create global event');
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can create global events' },
        { status: 403 }
      );
    }

    if (eventScope === EventScope.GROUP && !isTutor(currentUser)) {
      console.log('Unauthorized: Non-tutor trying to create group event');
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can create group events' },
        { status: 403 }
      );
    }

    console.log('Creating new event...');
    const startDateTimeObj = new Date(startDateTime);
    
    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        startDateTime: startDateTimeObj,
        endDateTime: startDateTimeObj,
        location: location || 'Online',
        type: (type?.toUpperCase() as EventType) || EventType.IN_PERSON,
        capacity: capacity || 20,
        points: points || 0,
        tags: tags || [],
        createdById: currentUser.id,
        status: EventStatus.UPCOMING,
        eventScope
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    console.log('Event created successfully');

    return NextResponse.json(
      {
        message: 'Event created successfully',
        event: newEvent
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create event error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Unique constraint violation', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 