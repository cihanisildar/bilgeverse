import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole, TransactionType } from '@prisma/client';
import { getUserFromRequest, isAuthenticated, isAdmin, isTutor } from '@/lib/server-auth';

// Update user points
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !(isAdmin(currentUser) || isTutor(currentUser))) {
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

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get user
      const user = await tx.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // If tutor, can only modify points of their students
      if (isTutor(currentUser) && !isAdmin(currentUser)) {
        if (user.role !== UserRole.STUDENT || user.tutorId !== currentUser.id) {
          throw new Error('You can only modify points for your own students');
        }
      }

      // Calculate new points based on action
      let newPoints = user.points || 0;
      let transactionPoints = pointsValue;
      let transactionType: TransactionType = TransactionType.AWARD;

      switch (action) {
        case 'add':
          newPoints += pointsValue;
          break;
        case 'subtract':
          newPoints = Math.max(0, newPoints - pointsValue);
          transactionType = TransactionType.REDEEM;
          break;
        case 'set':
          transactionType = newPoints > pointsValue ? TransactionType.REDEEM : TransactionType.AWARD;
          transactionPoints = Math.abs(newPoints - pointsValue);
          newPoints = pointsValue;
          break;
      }

      // Create points transaction record
      if (transactionPoints > 0) {
        await tx.pointsTransaction.create({
          data: {
            studentId: user.id,
            tutorId: currentUser.id,
            points: transactionPoints,
            type: transactionType,
            reason: `Points ${action}ed by ${currentUser.username}`
          }
        });
      }

      // Update user points
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { points: newPoints },
        select: {
          id: true,
          username: true,
          points: true
        }
      });

      return updatedUser;
    });

    return NextResponse.json({
      message: 'Points updated successfully',
      user: result
    }, { status: 200 });
  } catch (error: any) {
    console.error('Update points error:', error);

    if (error.message === 'User not found') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (error.message === 'You can only modify points for your own students') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 