import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole, TransactionType } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { requireActivePeriod } from '@/lib/periods';
import { calculateUserPoints } from '@/lib/points';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN];

// Update user points
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin, tutor or asistan can modify points' },
        { status: 403 }
      );
    }
    
    const userId = params.id;
    const body = await request.json();
    const { points, action } = body;
    
    // Validate points
    const pointsValue = parseInt(points);
    if (isNaN(pointsValue) || pointsValue < 0) {
      return NextResponse.json(
        { error: 'Points must be a valid non-negative number' },
        { status: 400 }
      );
    }
    
    // Validate action
    if (!action || !['add', 'subtract', 'set'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be one of: add, subtract, set' },
        { status: 400 }
      );
    }

    // Get active period
    const activePeriod = await requireActivePeriod();

    // Get user and verify they exist
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        tutorId: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If tutor or asistan, verify the user is their student
    if ((session.user.role === UserRole.TUTOR || session.user.role === UserRole.ASISTAN) && user.tutorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Can only modify points for your own students' },
        { status: 403 }
      );
    }

    // Get current points from period-aware calculation
    const currentPoints = await calculateUserPoints(userId, activePeriod.id);

    let transactionPoints;
    let transactionType;

    switch (action) {
      case 'add':
        transactionPoints = pointsValue;
        transactionType = TransactionType.AWARD;
        break;
      case 'subtract':
        if (pointsValue > currentPoints) {
          return NextResponse.json(
            { error: 'Cannot subtract more points than user has' },
            { status: 400 }
          );
        }
        transactionPoints = pointsValue;
        transactionType = TransactionType.REDEEM;
        break;
      case 'set':
        // For 'set', we need to calculate the difference
        const difference = pointsValue - currentPoints;
        if (difference > 0) {
          transactionPoints = difference;
          transactionType = TransactionType.AWARD;
        } else if (difference < 0) {
          transactionPoints = Math.abs(difference);
          transactionType = TransactionType.REDEEM;
        } else {
          // No change needed
          return NextResponse.json({
            user: {
              id: user.id,
              username: user.username,
              points: currentPoints
            },
            transaction: null,
            message: 'No change needed - points already at target value'
          }, { status: 200 });
        }
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Create transaction record
    const transaction = await prisma.pointsTransaction.create({
      data: {
        studentId: userId,
        tutorId: session.user.id,
        points: transactionPoints,
        type: transactionType,
        reason: `${action === 'add' ? 'Puan eklendi' : action === 'subtract' ? 'Puan azaltıldı' : 'Puan ayarlandı'} - ${session.user.username}`,
        periodId: activePeriod.id
      }
    });

    // Calculate new balance
    const newBalance = await calculateUserPoints(userId, activePeriod.id);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        points: newBalance
      },
      transaction
    }, { status: 200 });
  } catch (error) {
    console.error('Update points error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 