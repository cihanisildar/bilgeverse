import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole, User } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth.config';
import { calculateMultipleUserPoints } from '@/lib/points';
import { requireActivePeriod } from '@/lib/periods';

export const dynamic = 'force-dynamic';

type UserWithTutor = {
  id: string;
  username: string;
  role: UserRole;
  roles: UserRole[];
  firstName: string | null;
  lastName: string | null;
  points?: number;
  tutorId: string | null;
  createdAt: Date;
  isActive: boolean;
  statusChangedAt: Date | null;
  statusChangedBy: string | null;
  email?: string;
  updatedAt?: Date;
  avatarUrl?: string | null;
  tutor?: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get active period for period-aware points calculation
    const activePeriod = await requireActivePeriod();

    let users: UserWithTutor[] = [];
    const user = session.user;
    const userRoles = user.roles || [user.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);
    const isBoardMember = userRoles.includes(UserRole.BOARD_MEMBER);
    const isTutor = userRoles.includes(UserRole.TUTOR);
    const isAsistan = userRoles.includes(UserRole.ASISTAN);

    // If admin or board member, return all users
    if (isAdmin || isBoardMember) {
      users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          role: true,
          roles: true,
          firstName: true,
          lastName: true,
          tutorId: true,
          createdAt: true,
          isActive: true,
          statusChangedAt: true,
          statusChangedBy: true,
          tutor: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }
    // If tutor or asistan, return only their students
    else if (isTutor || isAsistan) {
      const targetTutorId = isAsistan ? (user.assistedTutorId || user.id) : user.id;

      users = await prisma.user.findMany({
        where: {
          tutorId: targetTutorId,
          roles: { has: UserRole.STUDENT }
        },
        select: {
          id: true,
          username: true,
          role: true,
          roles: true,
          firstName: true,
          lastName: true,
          tutorId: true,
          createdAt: true,
          isActive: true,
          statusChangedAt: true,
          statusChangedBy: true,
          tutor: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }
    // If student, return empty array
    else {
      users = [];
    }

    // Calculate period-aware points for all users
    const userIds = users.map(u => u.id);
    const pointsMap = await calculateMultipleUserPoints(userIds, activePeriod.id);

    // Map calculated points to users
    const usersWithCalculatedPoints = users.map(user => ({
      ...user,
      points: pointsMap.get(user.id) || 0
    }));

    return NextResponse.json({ users: usersWithCalculatedPoints }, { status: 200 });
  } catch (error: unknown) {
    console.error('Get users error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 