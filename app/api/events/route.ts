import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { EventStatus, EventScope, UserRole, PeriodStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth.config';
import { getActivePeriod } from '@/lib/periods';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get active period
    const activePeriod = await getActivePeriod();
    if (!activePeriod) {
      return NextResponse.json(
        { error: 'No active period found' },
        { status: 400 }
      );
    }

    // Students can see both global and group events
    const events = await prisma.event.findMany({
      where: {
        periodId: activePeriod.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        participants: {
          where: {
            status: 'REGISTERED'
          }
        },
        eventType: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        period: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });

    // Add enrolledStudents count to each event
    const eventsWithCount = events.map(event => ({
      ...event,
      enrolledStudents: event.participants.length,
      // Remove participants array from response to avoid sending unnecessary data
      participants: undefined
    }));

    return NextResponse.json({ events: eventsWithCount }, { status: 200 });
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
    
    const session = await getServerSession(authOptions);
    console.log('Current user:', { id: session?.user?.id, role: session?.user?.role });
    
    if (!session?.user) {
      console.log('User not authenticated');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body);
    
    const { title, description, startDateTime, location, capacity, points, experience, tags, eventScope, createdForTutorId, periodId, eventTypeId } = body;

    if (!title || !description || !startDateTime) {
      console.log('Missing required fields:', { title, description, startDateTime });
      return NextResponse.json(
        { error: 'Title, description, and start date are required' },
        { status: 400 }
      );
    }

    // Validate eventScope
    if (!eventScope || !Object.values(EventScope).includes(eventScope)) {
      console.log('Invalid event scope:', eventScope);
      return NextResponse.json(
        { error: 'Invalid event scope' },
        { status: 400 }
      );
    }

    // Only admin can create events
    if (session.user.role !== UserRole.ADMIN) {
      console.log('Unauthorized: Non-admin trying to create event');
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can create events' },
        { status: 403 }
      );
    }

    // For GROUP events, createdForTutorId is required
    if (eventScope === EventScope.GROUP && !createdForTutorId) {
      console.log('Missing tutor ID for group event');
      return NextResponse.json(
        { error: 'Tutor ID is required for group events' },
        { status: 400 }
      );
    }

    // If createdForTutorId is provided, verify the user exists and is a tutor
    if (createdForTutorId) {
      const tutor = await prisma.user.findUnique({
        where: { id: createdForTutorId }
      });
      
      if (!tutor) {
        return NextResponse.json(
          { error: 'Tutor not found' },
          { status: 404 }
        );
      }
      
      if (tutor.role !== UserRole.TUTOR) {
        return NextResponse.json(
          { error: 'Selected user is not a tutor' },
          { status: 400 }
        );
      }
    }

    // Validate periodId
    if (!periodId) {
      console.log('No periodId provided');
      return NextResponse.json(
        { error: 'Period selection is required' },
        { status: 400 }
      );
    }

    // Validate eventTypeId
    if (!eventTypeId) {
      console.log('No eventTypeId provided');
      return NextResponse.json(
        { error: 'Event type selection is required' },
        { status: 400 }
      );
    }

    // Verify the period exists
    const selectedPeriod = await prisma.period.findUnique({
      where: { id: periodId }
    });

    if (!selectedPeriod) {
      console.log('Selected period not found:', periodId);
      return NextResponse.json(
        { error: 'Selected period not found' },
        { status: 400 }
      );
    }

    // Verify the event type exists
    const selectedEventType = await prisma.eventType.findUnique({
      where: { id: eventTypeId }
    });

    if (!selectedEventType) {
      console.log('Selected event type not found:', eventTypeId);
      return NextResponse.json(
        { error: 'Selected event type not found' },
        { status: 400 }
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
        capacity: capacity || 20,
        points: points || 0,
        experience: experience || 0,
        tags: tags || [],
        createdById: session.user.id,
        status: EventStatus.YAKINDA,
        eventScope,
        createdForTutorId: eventScope === EventScope.GROUP ? createdForTutorId : null,
        periodId: selectedPeriod.id,
        eventTypeId: selectedEventType.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        createdForTutor: eventScope === EventScope.GROUP ? {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        } : false,
        eventType: {
          select: {
            id: true,
            name: true,
            description: true
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