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
  firstName: string | null;
  lastName: string | null;
  points: number;
  tutorId: string | null;
  createdAt: Date;
  isActive: boolean;
  statusChangedAt: Date | null;
  statusChangedBy: string | null;
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

    let users: any[] = [];

    // If admin or board member, return all users
    if (session.user.role === UserRole.ADMIN || session.user.role === UserRole.BOARD_MEMBER) {
      users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          role: true,
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
    // If tutor, return only their students
    else if (session.user.role === UserRole.TUTOR) {
      users = await prisma.user.findMany({
        where: {
          tutorId: session.user.id,
          role: UserRole.STUDENT
        },
        select: {
          id: true,
          username: true,
          role: true,
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
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 