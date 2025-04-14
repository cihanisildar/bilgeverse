import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getUserFromRequest, isAuthenticated, isStudent } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isStudent(currentUser)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all students with their points
    const students = await prisma.user.findMany({
      where: { 
        role: UserRole.STUDENT 
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        points: true
      },
      orderBy: {
        points: 'desc'
      }
    });

    // Add ranks to students
    const leaderboard = students.map((student, index) => ({
      ...student,
      points: student.points || 0,
      rank: index + 1
    }));

    // Find current user's rank
    const userRank = leaderboard.find(student => 
      student.id === currentUser.id
    );

    return NextResponse.json({
      leaderboard: leaderboard.slice(0, 25), // Return top 25 students
      userRank: userRank ? {
        rank: userRank.rank,
        points: userRank.points
      } : null
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
} 