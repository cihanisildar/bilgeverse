import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole, TransactionType } from '@prisma/client';
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

    // Get all students with their points and transactions
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

    // Calculate total earned points and add ranks
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

    // Sort by total earned points and recalculate ranks
    const sortedLeaderboard = [...leaderboard]
      .sort((a, b) => b.totalEarnedPoints - a.totalEarnedPoints)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

    return NextResponse.json({ leaderboard: sortedLeaderboard }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 