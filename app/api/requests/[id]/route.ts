import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { RequestStatus, TransactionType, UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';
import { requireActivePeriod } from '@/lib/periods';
import { calculateUserPoints } from '@/lib/points';

// Get a specific request by ID
export async function GET(
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

    const requestId = params.id;

    const itemRequest = await prisma.itemRequest.findUnique({
      where: { id: requestId },
      include: {
        student: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            points: true
          }
        },
        tutor: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        item: true
      }
    });

    if (!itemRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Check permissions: admin can see all, tutor only their students, assistant only their assisted tutor's students, student only their own
    if (
      session.user.role !== UserRole.ADMIN &&
      !(session.user.role === UserRole.TUTOR && itemRequest.tutorId === session.user.id) &&
      !(session.user.role === UserRole.ASISTAN && itemRequest.tutorId === (session.user as any).assistedTutorId) &&
      !(itemRequest.studentId === session.user.id)
    ) {
      return NextResponse.json(
        { error: 'Unauthorized to view this request' },
        { status: 403 }
      );
    }

    return NextResponse.json({ request: itemRequest }, { status: 200 });
  } catch (error) {
    console.error('Get request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a request (approve or reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TUTOR && session.user.role !== UserRole.ASISTAN)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin, tutor or assistant can update requests' },
        { status: 403 }
      );
    }

    const requestId = params.id;
    const body = await request.json();
    const { status, note } = body;

    // Validate that status is one of the enum values
    const validStatuses = Object.values(RequestStatus);
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Valid status is required. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Only allow APPROVED or REJECTED status
    if (status === RequestStatus.PENDING) {
      return NextResponse.json(
        { error: 'Cannot set status back to pending' },
        { status: 400 }
      );
    }

    // Get active period before starting transaction
    const activePeriod = await requireActivePeriod();

    // Get the request first to validate and calculate points BEFORE starting transaction
    const itemRequest = await prisma.itemRequest.findUnique({
      where: { id: requestId },
      include: {
        student: true,
        item: true
      }
    });

    if (!itemRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Validate all required relationships exist
    if (!itemRequest.student || !itemRequest.item) {
      return NextResponse.json(
        { error: 'Invalid request: missing required relationships' },
        { status: 400 }
      );
    }

    if (!itemRequest.tutorId) {
      return NextResponse.json(
        { error: 'Invalid request: missing tutor assignment' },
        { status: 400 }
      );
    }

    // Check if request is already processed
    if (itemRequest.status !== RequestStatus.PENDING) {
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      );
    }

    // Tutor can only process their own students' requests
    if (session.user.role === UserRole.TUTOR && itemRequest.tutorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: This request belongs to another tutor' },
        { status: 403 }
      );
    }

    // Assistant can only process their assisted tutor's students' requests
    if (session.user.role === UserRole.ASISTAN && itemRequest.tutorId !== (session.user as any).assistedTutorId) {
      return NextResponse.json(
        { error: 'Unauthorized: This request belongs to a tutor you do not assist' },
        { status: 403 }
      );
    }

    // Calculate student's current points BEFORE starting transaction
    let currentPoints = 0;
    if (status === RequestStatus.APPROVED) {
      currentPoints = await calculateUserPoints(itemRequest.studentId, activePeriod.id);

      // Check if student still has enough points
      if (currentPoints < itemRequest.pointsSpent) {
        return NextResponse.json(
          { error: 'Student no longer has enough points' },
          { status: 400 }
        );
      }
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      if (status === RequestStatus.APPROVED) {

        // Create points transaction
        await tx.pointsTransaction.create({
          data: {
            studentId: itemRequest.studentId,
            tutorId: itemRequest.tutorId,
            points: itemRequest.pointsSpent,
            type: TransactionType.REDEEM,
            reason: `Ürün satın alındı: ${itemRequest.item.name}`,
            periodId: activePeriod.id,
          }
        });

        // Update student points
        await tx.user.update({
          where: { id: itemRequest.studentId },
          data: {
            points: {
              decrement: itemRequest.pointsSpent
            }
          }
        });
      }

      // Update request status
      const updatedRequest = await tx.itemRequest.update({
        where: { id: requestId },
        data: {
          status: status as RequestStatus,
          ...(note && { note })
        },
        include: {
          student: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              points: true
            }
          },
          tutor: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          },
          item: true
        }
      });

      return updatedRequest;
    });

    return NextResponse.json(
      {
        message: `Request ${status.toLowerCase()} successfully`,
        request: result
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update request error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 