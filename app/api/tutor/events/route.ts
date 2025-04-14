import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, isAuthenticated, isTutor } from '@/lib/server-auth';
import { EventScope, EventType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isTutor(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can create events' },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.description || !data.startDateTime) {
      return NextResponse.json(
        { error: 'Title, description, and start date are required' },
        { status: 400 }
      );
    }

    // Validate event type
    if (!Object.values(EventType).includes(data.type)) {
      return NextResponse.json(
        { error: `Invalid event type. Must be one of: ${Object.values(EventType).join(', ')}` },
        { status: 400 }
      );
    }

    // Create new event
    const newEvent = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        startDateTime: new Date(data.startDateTime),
        endDateTime: new Date(data.endDateTime),
        location: data.location || 'Online',
        type: data.type as EventType,
        capacity: parseInt(String(data.capacity)) || 20,
        points: parseInt(String(data.points)) || 0,
        tags: data.tags || [],
        createdById: currentUser.id,
        status: 'UPCOMING',
        eventScope: EventScope.GROUP
      }
    });

    return NextResponse.json({ 
      message: 'Event created successfully',
      event: newEvent
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating event:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An event with this title already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error', details: error.code },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/tutor/events - Starting request');
    
    const currentUser = await getUserFromRequest(request);
    console.log('Current user:', currentUser);
    
    if (!isAuthenticated(currentUser) || !isTutor(currentUser)) {
      console.log('Unauthorized access attempt:', { isAuthenticated: isAuthenticated(currentUser), isTutor: isTutor(currentUser) });
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can view events' },
        { status: 403 }
      );
    }

    // Get all events created by this tutor
    console.log('Fetching events for tutor:', currentUser.id);
    const events = await prisma.event.findMany({
      where: {
        createdById: currentUser.id
      },
      orderBy: {
        startDateTime: 'desc'
      }
    });
    console.log('Found events:', events.length);

    return NextResponse.json({ events }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    console.error('Detailed error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 