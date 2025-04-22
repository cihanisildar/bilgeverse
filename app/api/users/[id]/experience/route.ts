import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, isAuthenticated, isAdmin, isTutor } from '@/lib/server-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !(isAdmin(currentUser) || isTutor(currentUser))) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin or tutor can modify experience' },
        { status: 403 }
      );
    }

    const userId = params.id;
    const body = await request.json();
    const { amount } = body;

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'Amount is required' },
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

      // If tutor, can only modify experience of their students
      if (isTutor(currentUser) && !isAdmin(currentUser)) {
        if (user.tutorId !== currentUser.id) {
          throw new Error('You can only modify experience for your own students');
        }
      }

      // Calculate new experience
      const newExperience = Math.max(0, user.experience + amount);

      // Update user experience
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { experience: newExperience }
      });

      // Create experience transaction record
      const transaction = await tx.experienceTransaction.create({
        data: {
          amount,
          studentId: user.id,
          tutorId: currentUser.id
        }
      });

      return {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          experience: updatedUser.experience
        },
        transaction
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Modify experience error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 