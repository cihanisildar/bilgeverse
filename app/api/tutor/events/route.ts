import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { EventScope, EventStatus, UserRole } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/auth.config';
import { getActivePeriod } from '@/lib/periods';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== UserRole.TUTOR && session.user.role !== UserRole.ASISTAN)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors and asistans can create events' },
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

    // Validate periodId
    if (!data.periodId) {
      return NextResponse.json(
        { error: 'Period selection is required' },
        { status: 400 }
      );
    }

    // Validate eventTypeId
    if (!data.eventTypeId) {
      return NextResponse.json(
        { error: 'Event type selection is required' },
        { status: 400 }
      );
    }

    // Verify the period exists
    const selectedPeriod = await prisma.period.findUnique({
      where: { id: data.periodId }
    });

    if (!selectedPeriod) {
      return NextResponse.json(
        { error: 'Selected period not found' },
        { status: 400 }
      );
    }

    // Verify the event type exists and is active
    const selectedEventType = await prisma.eventType.findUnique({
      where: { id: data.eventTypeId }
    });

    if (!selectedEventType) {
      return NextResponse.json(
        { error: 'Selected event type not found' },
        { status: 400 }
      );
    }

    if (!selectedEventType.isActive) {
      return NextResponse.json(
        { error: 'Selected event type is not active' },
        { status: 400 }
      );
    }

    // All event types are now specific catalog activities - no custom name validation needed

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
        customName: null, // No custom names for catalog activities
        capacity: parseInt(String(data.capacity)) || 20,
        points: parseInt(String(data.points)) || 0,
        experience: parseInt(String(data.experience)) || 0,
        tags: data.tags || [],
        createdById: session.user.id,
        status: EventStatus.YAKINDA,
        eventScope: data.eventScope as EventScope,
        periodId: selectedPeriod.id,
        eventTypeId: selectedEventType.id
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

    if (!session?.user || (session.user.role !== UserRole.TUTOR && session.user.role !== UserRole.ASISTAN)) {
      console.log('Unauthorized access attempt:', {
        isAuthenticated: !!session?.user,
        role: session?.user?.role
      });
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors and asistans can view events' },
        { status: 403 }
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

    // Get all events created by this tutor AND global events created by admins
    console.log('Fetching events for tutor:', session.user.id);
    const events = await prisma.event.findMany({
      where: {
        periodId: activePeriod.id,
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
        },
        eventType: {
          select: {
            id: true,
            name: true,
            description: true
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