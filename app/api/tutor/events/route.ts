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

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { hasRole } = await import('@/app/lib/auth-utils');
    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isTutor = userRoles.includes(UserRole.TUTOR);
    const isAsistan = userRoles.includes(UserRole.ASISTAN);

    if (!isTutor && !isAsistan) {
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
  } catch (error: unknown) {
    console.error('Error creating event:', error);

    if (error instanceof Error && (error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'An event with this title already exists' },
        { status: 409 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { hasRole } = await import('@/app/lib/auth-utils');
    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isTutor = userRoles.includes(UserRole.TUTOR);
    const isAsistan = userRoles.includes(UserRole.ASISTAN);

    if (!isTutor && !isAsistan) {
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

    // Get the ID of the tutor to fetch events for (if asistan)
    const assistedTutorId = isAsistan
      ? session.user.assistedTutorId
      : null;

    // Get all events created by this tutor/asistan AND global events created by admins
    const events = await prisma.event.findMany({
      where: {
        periodId: activePeriod.id,
        OR: [
          // Events created by this user
          { createdById: session.user.id },
          // Global events (created by admins, visible to all tutors)
          { eventScope: EventScope.GLOBAL },
          // If asistan, also show events created by/for their assisted tutor
          ...(assistedTutorId ? [
            { createdById: assistedTutorId },
            { createdForTutorId: assistedTutorId }
          ] : [
            // Group events specifically created for this tutor
            { createdForTutorId: session.user.id }
          ])
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

    // Add enrolledStudents count to each event
    const eventsWithCount = events.map(event => ({
      ...event,
      enrolledStudents: event.participants.length,
      // Remove participants array from response to avoid sending unnecessary data
      participants: undefined
    }));

    return NextResponse.json({ events: eventsWithCount }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching events:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}