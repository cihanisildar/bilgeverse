import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { RequestStatus, TransactionType, UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';
import { requireActivePeriod } from '@/lib/periods';

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
    
    // Check permissions: admin can see all, tutor only their students, student only their own
    if (
      session.user.role !== UserRole.ADMIN && 
      !(session.user.role === UserRole.TUTOR && itemRequest.tutorId === session.user.id) &&
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
    
    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TUTOR)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin or tutor can update requests' },
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

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get the request with its related data
      const itemRequest = await tx.itemRequest.findUnique({
        where: { id: requestId },
        include: {
          student: true,
          item: true
        }
      });

      if (!itemRequest) {
        throw new Error('Request not found');
      }

      // Validate all required relationships exist
      if (!itemRequest.student || !itemRequest.item) {
        throw new Error('Invalid request: missing required relationships');
      }

      if (!itemRequest.tutorId) {
        throw new Error('Invalid request: missing tutor assignment');
      }

      // Check if request is already processed
      if (itemRequest.status !== RequestStatus.PENDING) {
        throw new Error('Request has already been processed');
      }

      // Tutor can only process their own students' requests
      if (session.user.role === UserRole.TUTOR && itemRequest.tutorId !== session.user.id) {
        throw new Error('Unauthorized: This request belongs to another tutor');
      }

      if (status === RequestStatus.APPROVED) {
        // Check if student still has enough points
        if (itemRequest.student.points < itemRequest.pointsSpent) {
          throw new Error('Student no longer has enough points');
        }

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
    
    if (error.message === 'Request not found') {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }
    
    if (error.message === 'Invalid request: missing required relationships') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    if (error.message === 'Invalid request: missing tutor assignment') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    if (error.message === 'Request has already been processed') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    if (error.message === 'Unauthorized: This request belongs to another tutor') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    

    
    if (error.message === 'Student no longer has enough points') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 