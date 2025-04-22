import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TransactionType, UserRole } from '@prisma/client';
import { getUserFromRequest, isAuthenticated } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    // Find current user's rank if they are a student
    const userRank = currentUser.role === UserRole.STUDENT
      ? leaderboard.find(entry => entry.id === currentUser.id)
      : null;

    return NextResponse.json({
      leaderboard: leaderboard.slice(0, 25), // Return top 25 students
      userRank: userRank ? {
        rank: userRank.rank,
        points: userRank.points,
        experience: userRank.experience
      } : null,
      total: students.length
    }, { status: 200 });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 