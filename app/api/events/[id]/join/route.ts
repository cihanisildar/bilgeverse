import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ParticipantStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/auth.config';
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const eventId = params.id;

    // Verify event exists and is upcoming
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
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

    // Check if event is upcoming
    if (event.status !== 'YAKINDA' && event.status !== 'DEVAM_EDIYOR') {
      return NextResponse.json(
        { error: 'You can only join upcoming events' },
        { status: 400 }
      );
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.eventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: session.user.id
        }
      }
    });

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'You have already joined this event' },
        { status: 409 }
      );
    }

    // Check event capacity
    if (event.participants.length >= event.capacity) {
      return NextResponse.json(
        { error: 'Event has reached maximum capacity' },
        { status: 400 }
      );
    }

    // Add participant
    const participant = await prisma.eventParticipant.create({
      data: {
        eventId: eventId,
        userId: session.user.id,
        status: ParticipantStatus.REGISTERED,
        registeredAt: new Date()
      }
    });

    // Get updated participant count
    const updatedParticipantCount = await prisma.eventParticipant.count({
      where: {
        eventId: eventId,
        status: 'REGISTERED'
      }
    });

    return NextResponse.json({
      message: 'Successfully joined the event',
      participant: {
        id: participant.id,
        status: participant.status,
        registeredAt: participant.registeredAt
      },
      enrolledStudents: updatedParticipantCount
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error joining event:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 