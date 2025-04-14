import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, isAuthenticated, isTutor } from '@/lib/server-auth';
import { ParticipantStatus } from '@prisma/client';

// Get all participants for an event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify event exists and user has access
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        createdBy: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Only allow tutor who created the event or participants of the event
    if (
      !isTutor(currentUser) && 
      event.createdBy.id !== currentUser.id &&
      !(await prisma.eventParticipant.findFirst({
        where: {
          eventId: params.id,
          userId: currentUser.id,
        },
      }))
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to view this event\'s participants' },
        { status: 403 }
      );
    }

    // Get participants
    const participants = await prisma.eventParticipant.findMany({
      where: {
        eventId: params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        registeredAt: 'desc',
      },
    });

    // Format response
    const formattedParticipants = participants.map(participant => ({
      id: participant.userId,
      username: participant.user.username,
      firstName: participant.user.firstName,
      lastName: participant.user.lastName,
      status: participant.status,
      registeredAt: participant.registeredAt.toISOString(),
    }));

    return NextResponse.json({ participants: formattedParticipants });
  } catch (error: any) {
    console.error('Error fetching event participants:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add a participant to an event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isTutor(currentUser)) {
      return NextResponse.json(
        { error: 'Only tutors can add participants' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify event exists and user has access
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        createdBy: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.createdBy.id !== currentUser.id) {
      return NextResponse.json(
        { error: 'You do not have permission to add participants to this event' },
        { status: 403 }
      );
    }

    // Check if participant already exists
    const existingParticipant = await prisma.eventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId: params.id,
          userId: userId,
        },
      },
    });

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'User is already a participant' },
        { status: 409 }
      );
    }

    // Check event capacity
    const currentParticipants = await prisma.eventParticipant.count({
      where: { eventId: params.id },
    });

    if (currentParticipants >= event.capacity) {
      return NextResponse.json(
        { error: 'Event has reached maximum capacity' },
        { status: 400 }
      );
    }

    // Add participant
    const participant = await prisma.eventParticipant.create({
      data: {
        eventId: params.id,
        userId: userId,
        status: ParticipantStatus.REGISTERED,
        registeredAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      participant: {
        id: participant.userId,
        username: participant.user.username,
        firstName: participant.user.firstName,
        lastName: participant.user.lastName,
        status: participant.status,
        registeredAt: participant.registeredAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding event participant:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update participant status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isTutor(currentUser)) {
      return NextResponse.json(
        { error: 'Only tutors can update participant status' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, status } = body;

    if (!userId || !status || !Object.values(ParticipantStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Valid user ID and status are required' },
        { status: 400 }
      );
    }

    // Verify event exists and user has access
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        createdBy: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.createdBy.id !== currentUser.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update participants in this event' },
        { status: 403 }
      );
    }

    // Update participant status
    const participant = await prisma.eventParticipant.update({
      where: {
        eventId_userId: {
          eventId: params.id,
          userId: userId,
        },
      },
      data: {
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      participant: {
        id: participant.userId,
        username: participant.user.username,
        firstName: participant.user.firstName,
        lastName: participant.user.lastName,
        status: participant.status,
        registeredAt: participant.registeredAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error updating event participant:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Remove a participant from an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isTutor(currentUser)) {
      return NextResponse.json(
        { error: 'Only tutors can remove participants' },
        { status: 403 }
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify event exists and user has access
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        createdBy: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.createdBy.id !== currentUser.id) {
      return NextResponse.json(
        { error: 'You do not have permission to remove participants from this event' },
        { status: 403 }
      );
    }

    // Remove participant
    await prisma.eventParticipant.delete({
      where: {
        eventId_userId: {
          eventId: params.id,
          userId: userId,
        },
      },
    });

    return NextResponse.json({
      message: 'Participant removed successfully',
    });
  } catch (error: any) {
    console.error('Error removing event participant:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 