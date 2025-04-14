import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, isAdmin } from '@/lib/server-auth';
import { EventScope, EventStatus, EventType } from '@prisma/client';

// Get a specific event by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id },
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
        }
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Add enrolledStudents count to the response
    const eventWithCount = {
      ...event,
      enrolledStudents: event.participants.length,
      // Remove participants array from response to avoid sending unnecessary data
      participants: undefined
    };

    return NextResponse.json({ event: eventWithCount }, { status: 200 });
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update an event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('PUT /api/events/[id] - Starting request');
    const currentUser = await getUserFromRequest(request);
    console.log('Current user:', { id: currentUser?.id, role: currentUser?.role });
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    console.log('Event ID:', id);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const existingEvent = await prisma.event.findUnique({
      where: { id }
    });
    console.log('Existing event:', existingEvent);

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check permissions based on event scope
    if (existingEvent.eventScope === EventScope.GLOBAL && !isAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can update global events' },
        { status: 403 }
      );
    }

    // For group events, only allow the creator or an admin
    if (existingEvent.eventScope === EventScope.GROUP && !isAdmin(currentUser) && existingEvent.createdById !== currentUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only update your own group events' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body);
    
    const { title, description, startDateTime, location, type, capacity, points, tags, status, eventScope } = body;

    // Validate required fields
    if (!title || !description || !startDateTime) {
      return NextResponse.json(
        { error: 'Title, description, and start date are required' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !Object.values(EventStatus).includes(status as EventStatus)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Prepare update data with proper type casting
    const updateData = {
      title: title.trim(),
      description: description.trim(),
      startDateTime: new Date(startDateTime),
      location: location?.trim() || 'Online',
      type: (type as EventType) || EventType.IN_PERSON,
      capacity: Number(capacity) || 20,
      points: Number(points) || 0,
      tags: Array.isArray(tags) ? tags : [],
      ...(status && { status: status as EventStatus }),
      ...(eventScope && { eventScope: eventScope as EventScope })
    };
    
    console.log('Update data:', updateData);

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
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
    console.log('Updated event:', updatedEvent);

    return NextResponse.json(
      {
        message: 'Event updated successfully',
        event: updatedEvent
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update event error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
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

// Delete an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if the user is the creator of the event or an admin
    if (!isAdmin(currentUser) && event.createdById !== currentUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only delete your own events' },
        { status: 403 }
      );
    }

    await prisma.event.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Event deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 