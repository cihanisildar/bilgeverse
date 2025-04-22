import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getUserFromRequest, isAuthenticated, isTutor } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isTutor(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can access this endpoint' },
        { status: 403 }
      );
    }

    // Get all students with their experience
    const students = await prisma.user.findMany({
      where: { 
        role: UserRole.STUDENT 
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        points: true,
        experience: true
      },
      orderBy: {
        experience: 'desc'
      }
    });

    // Map students to leaderboard entries with ranks
    const leaderboard = students.map((student, index) => ({
      id: student.id,
      username: student.username,
      firstName: student.firstName,
      lastName: student.lastName,
      points: student.points || 0,
      experience: student.experience || 0,
      rank: index + 1
    }));

    return NextResponse.json({ leaderboard }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 