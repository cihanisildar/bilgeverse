import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole, User } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth.config';

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

    let users: UserWithTutor[] = [];
    
    // If admin, return all users
    if (session.user.role === UserRole.ADMIN) {
      users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          role: true,
          firstName: true,
          lastName: true,
          points: true,
          tutorId: true,
          createdAt: true,
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
          points: true,
          tutorId: true,
          createdAt: true,
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

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 