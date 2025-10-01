import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/auth.config';
import { calculateUserPoints } from '@/lib/points';
import { getActivePeriod } from '@/lib/periods';
import { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        role: true,
        firstName: true,
        lastName: true,
        points: true,
        tutorId: true,
        tutor: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // For students, calculate points from transactions in the active period
    if (user.role === UserRole.STUDENT) {
      const activePeriod = await getActivePeriod();
      const calculatedPoints = activePeriod
        ? await calculateUserPoints(user.id, activePeriod.id)
        : 0;

      return NextResponse.json(
        { user: { ...user, points: calculatedPoints } },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { user },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 