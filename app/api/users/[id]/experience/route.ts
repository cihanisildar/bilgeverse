import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.TUTOR];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
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
      if (session.user.role === UserRole.TUTOR) {
        if (user.tutorId !== session.user.id) {
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
          tutorId: session.user.id
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