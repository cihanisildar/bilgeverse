import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { requireActivePeriod } from '@/lib/periods';
import { calculateUserExperience } from '@/lib/points';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin, tutor or asistan can modify experience' },
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

    // If tutor or asistan, can only modify experience of their students
    if (session.user.role === UserRole.TUTOR || session.user.role === UserRole.ASISTAN) {
      if (user.tutorId !== session.user.id) {
        return NextResponse.json(
          { error: 'You can only modify experience for your own students' },
          { status: 403 }
        );
      }
    }

    // Get current experience from period-aware calculation
    const currentExperience = await calculateUserExperience(userId, activePeriod.id);

    // Validate that we don't go negative
    if (amount < 0 && Math.abs(amount) > currentExperience) {
      return NextResponse.json(
        { error: 'Cannot subtract more experience than user has' },
        { status: 400 }
      );
    }

    // Create experience transaction record
    const transaction = await prisma.experienceTransaction.create({
      data: {
        amount,
        studentId: userId,
        tutorId: session.user.id,
        periodId: activePeriod.id
      }
    });

    // Calculate new experience balance
    const newExperienceBalance = await calculateUserExperience(userId, activePeriod.id);

    const result = {
      user: {
        id: user.id,
        username: user.username,
        experience: newExperienceBalance
      },
      transaction
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Modify experience error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 