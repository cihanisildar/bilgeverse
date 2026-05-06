import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/auth.config';
import { calculateUserPoints } from '@/lib/points';
import { getActivePeriod } from '@/lib/periods';
import { UserRole } from '@prisma/client';
import { USER_AUTH_SELECT, normalizeUserRoles, isUserInAcademy } from '@/app/lib/auth-helpers';

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
      select: USER_AUTH_SELECT
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userRoles = user.roles || [user.role].filter(Boolean) as UserRole[];
    const isStudent = userRoles.includes(UserRole.STUDENT);

    // For students, calculate points from transactions in the active period
    if (isStudent) {
      const activePeriod = await getActivePeriod();
      const calculatedPoints = activePeriod
        ? await calculateUserPoints(user.id, activePeriod.id)
        : 0;

      const userWithNormalizedRoles = {
        ...user,
        roles: normalizeUserRoles(user),
        isInAcademy: isUserInAcademy(user)
      };

      return NextResponse.json(
        { user: { ...userWithNormalizedRoles, points: calculatedPoints } },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { user: { ...user, roles: normalizeUserRoles(user), isInAcademy: isUserInAcademy(user) } },
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