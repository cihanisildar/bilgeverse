import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth.config';
import { calculateMultipleUserPoints, calculateMultipleUserExperience } from '@/lib/points';
import { requireActivePeriod } from '@/lib/periods';

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

    // Parse limit from query params
    const { searchParams } = new URL(request.url);
    let limitParam = searchParams.get('limit');
    let limit: number | 'all' = 25;
    if (limitParam) {
      if (limitParam === 'all') {
        limit = 'all';
      } else {
        const parsed = parseInt(limitParam, 10);
        if (!isNaN(parsed) && parsed > 0) {
          limit = parsed;
        }
      }
    }

    // Get active period
    const activePeriod = await requireActivePeriod();

    // Get all active students with their basic information
    const studentsRaw = await prisma.user.findMany({
      where: {
        role: UserRole.STUDENT,
        isActive: true
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
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

    // Calculate experience for all students efficiently using batch query
    const studentIds = studentsRaw.map(s => s.id);
    const experienceMap = await calculateMultipleUserExperience(studentIds, activePeriod.id);
    
    // Map students with their experience
    const students = studentsRaw.map((student) => ({
      ...student,
      experience: experienceMap.get(student.id) || 0,
    }));

    // Sort by calculated experience
    students.sort((a, b) => b.experience - a.experience);

    // Map students to leaderboard entries with ranks
    const leaderboard = students.map((student, index) => ({
      id: student.id,
      username: student.username,
      firstName: student.firstName,
      lastName: student.lastName,
      experience: student.experience || 0,
      tutor: student.tutor,
      rank: index + 1
    }));

    // Find current user's rank if they are a student
    const userRank = session.user.role === UserRole.STUDENT
      ? leaderboard.find(entry => entry.id === session.user.id)
      : null;

    // Determine how many students to return
    let leaderboardToReturn = leaderboard;
    if (limit !== 'all') {
      leaderboardToReturn = leaderboard.slice(0, limit);
    }

    return NextResponse.json({
      leaderboard: leaderboardToReturn,
      userRank: userRank ? {
        rank: userRank.rank,
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