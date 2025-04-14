import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole, TransactionType } from '@prisma/client';
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

    // Get all students with their current points and transactions
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
        pointsReceived: {
          where: {
            type: TransactionType.AWARD
          },
          select: {
            points: true
          }
        }
      },
      orderBy: {
        points: 'desc'
      }
    });

    // Calculate total earned points and map students to leaderboard entries with ranks
    const leaderboard = students.map((student, index) => {
      const totalEarnedPoints = student.pointsReceived.reduce((sum, tx) => sum + tx.points, 0);
      return {
        id: student.id,
        username: student.username,
        firstName: student.firstName,
        lastName: student.lastName,
        currentPoints: student.points || 0,
        totalEarnedPoints,
        rank: index + 1
      };
    });

    // Sort by total earned points for the leaderboard
    const sortedLeaderboard = [...leaderboard].sort((a, b) => b.totalEarnedPoints - a.totalEarnedPoints)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    // Find current user's rank if they are a student
    const userRank = currentUser.role === UserRole.STUDENT
      ? sortedLeaderboard.find(entry => entry.id === currentUser.id)
      : null;

    return NextResponse.json({
      leaderboard: sortedLeaderboard.slice(0, 25), // Return top 25 students
      userRank: userRank ? {
        rank: userRank.rank,
        currentPoints: userRank.currentPoints,
        totalEarnedPoints: userRank.totalEarnedPoints
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