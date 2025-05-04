import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole, TransactionType } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

const ALLOWED_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.TUTOR];

// Update user points
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin or tutor can modify points' },
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

    // Get current user points
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If tutor, verify the user is their student
    if (session.user.role === UserRole.TUTOR && user.tutorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Can only modify points for your own students' },
        { status: 403 }
      );
    }

    let newPoints;
    let transactionType;

    switch (action) {
      case 'add':
        newPoints = (user.points || 0) + pointsValue;
        transactionType = TransactionType.AWARD;
        break;
      case 'subtract':
        newPoints = Math.max(0, (user.points || 0) - pointsValue);
        transactionType = TransactionType.REDEEM;
        break;
      case 'set':
        newPoints = pointsValue;
        transactionType = TransactionType.AWARD;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update user points and create transaction record
    const [updatedUser, transaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          points: newPoints,
          // Also update experience if points are being increased
          ...(action === 'add' && { experience: { increment: pointsValue } }),
          ...(action === 'set' && newPoints > (user.points || 0) && { 
            experience: { increment: newPoints - (user.points || 0) } 
          })
        },
        select: {
          id: true,
          username: true,
          points: true,
          experience: true
        }
      }),
      prisma.pointsTransaction.create({
        data: {
          studentId: userId,
          tutorId: session.user.id,
          points: pointsValue,
          type: transactionType,
          reason: `Points ${action}ed by ${session.user.username}`
        }
      })
    ]);

    return NextResponse.json({
      user: updatedUser,
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