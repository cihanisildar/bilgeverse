import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { RequestStatus, UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth.config';
import { requireActivePeriod } from '@/lib/periods';
import { calculateUserPoints } from '@/lib/points';

export const dynamic = 'force-dynamic';

// Get requests based on user role
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    let where: any = {};

    // Add status filter if provided
    if (status && Object.values(RequestStatus).includes(status as RequestStatus)) {
      where.status = status;
    }

    // Filter based on user role
    if (session.user.role === UserRole.ADMIN) {
      // Admin can see all requests
    } else if (session.user.role === UserRole.TUTOR) {
      // Tutor can only see requests from their students
      where.tutorId = session.user.id;
    } else if (session.user.role === UserRole.ASISTAN) {
      // Assistant can only see requests from their assisted tutor's students
      where.tutorId = (session.user as any).assistedTutorId;
    } else if (session.user.role === UserRole.STUDENT) {
      // Student can only see their own requests
      where.studentId = session.user.id;
    }

    const requests = await prisma.itemRequest.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        student: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
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

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error) {
    console.error('Get requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new request (student only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.STUDENT) {
      return NextResponse.json(
        { error: 'Unauthorized: Only students can request items' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { itemId, note } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Get active period before starting transaction
    const activePeriod = await requireActivePeriod();

    // Calculate student's current points from transactions
    const currentPoints = await calculateUserPoints(session.user.id, activePeriod.id);

    // Use Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get the student with their tutor information
      const student = await tx.user.findUnique({
        where: { id: session.user.id }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      if (!student.tutorId) {
        throw new Error('Student does not have an assigned tutor');
      }

      // Get the store item
      const item = await tx.storeItem.findUnique({
        where: { id: itemId }
      });

      if (!item) {
        throw new Error('Item not found');
      }

      // Since availableQuantity field was removed, we'll skip stock checking
      // Store items are now considered always available

      // Check if student has enough points (using calculated points from transactions)
      if (currentPoints < item.pointsRequired) {
        throw new Error('Not enough points to request this item');
      }

      // Create the request (points will be deducted when tutor approves)
      const newRequest = await tx.itemRequest.create({
        data: {
          studentId: student.id,
          tutorId: student.tutorId,
          itemId: item.id,
          status: RequestStatus.PENDING,
          pointsSpent: item.pointsRequired,
          note: note || '',
          periodId: activePeriod.id,
        },
        include: {
          student: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
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

      return newRequest;
    });

    return NextResponse.json(
      {
        message: 'Item request submitted successfully',
        request: result
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create request error:', error);

    if (error.message === 'Student not found') {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    if (error.message === 'Student does not have an assigned tutor') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error.message === 'Item not found') {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    if (error.message === 'Item is out of stock') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error.message === 'Not enough points to request this item') {
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