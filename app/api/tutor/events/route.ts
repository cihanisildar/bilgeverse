import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { EventScope, EventType, EventStatus, UserRole } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.TUTOR) {
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

    // Validate event scope
    if (!data.eventScope || !Object.values(EventScope).includes(data.eventScope)) {
      return NextResponse.json(
        { error: `Invalid event scope. Must be one of: ${Object.values(EventScope).join(', ')}` },
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
        experience: parseInt(String(data.experience)) || 0,
        tags: data.tags || [],
        createdById: session.user.id,
        status: EventStatus.YAKINDA,
        eventScope: data.eventScope as EventScope
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
    
    const session = await getServerSession(authOptions);
    console.log('Current user:', session?.user);
    
    if (!session?.user || session.user.role !== UserRole.TUTOR) {
      console.log('Unauthorized access attempt:', { 
        isAuthenticated: !!session?.user, 
        role: session?.user?.role 
      });
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can view events' },
        { status: 403 }
      );
    }

    // Get all events created by this tutor AND global events created by admins
    console.log('Fetching events for tutor:', session.user.id);
    const events = await prisma.event.findMany({
      where: {
        OR: [
          // Events created by this tutor
          { createdById: session.user.id },
          // Global events (created by admins, visible to all tutors)
          { eventScope: EventScope.GLOBAL },
          // Group events specifically created for this tutor
          { createdForTutorId: session.user.id }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        participants: {
          where: {
            status: 'REGISTERED'
          }
        }
      }
    });
    console.log('Found events:', events.length);

    // Add enrolledStudents count to each event
    const eventsWithCount = events.map(event => ({
      ...event,
      enrolledStudents: event.participants.length,
      // Remove participants array from response to avoid sending unnecessary data
      participants: undefined
    }));

    return NextResponse.json({ events: eventsWithCount }, { status: 200 });
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