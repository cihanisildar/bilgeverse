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
    const userNode = session?.user as any;
    const userRoles = userNode?.roles || [userNode?.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);
    const isTutor = userRoles.includes(UserRole.TUTOR);
    const isAsistan = userRoles.includes(UserRole.ASISTAN);

    if (!session?.user || (!isAdmin && !isTutor && !isAsistan)) {
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

    // If tutor, verify student is assigned to them
    if (isTutor && !isAdmin && user.tutorId !== userNode.id) {
      return NextResponse.json(
        { error: 'You can only modify experience for your own students' },
        { status: 403 }
      );
    }

    // If asistan, verify student is assigned to assisted tutor
    if (isAsistan && !isAdmin && !isTutor) {
      const asistan = await prisma.user.findUnique({
        where: { id: userNode.id },
        select: { assistedTutorId: true }
      });

      if (!asistan?.assistedTutorId || user.tutorId !== asistan.assistedTutorId) {
        return NextResponse.json(
          { error: 'You can only modify experience for students of the tutor you assist' },
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
        tutorId: userNode.id,
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