import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';
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

    const { hasRole } = await import('@/app/lib/auth-utils');
    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isTutor = userRoles.includes(UserRole.TUTOR);
    const isAsistan = userRoles.includes(UserRole.ASISTAN);

    if (!isTutor && !isAsistan) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors and asistans can access this endpoint' },
        { status: 403 }
      );
    }

    // Get active period
    const activePeriod = await requireActivePeriod();

    // Get all active students with their basic information
    const studentsRaw = await prisma.user.findMany({
      where: {
        roles: { has: UserRole.STUDENT },
        isActive: true
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        points: true
      }
    });

    // Calculate actual experience from non-rolled-back transactions in current period
    const students = await Promise.all(
      studentsRaw.map(async (student) => {
        const studentExperienceTransactions = await prisma.experienceTransaction.findMany({
          where: {
            studentId: student.id,
            rolledBack: false,
            periodId: activePeriod.id
          },
          select: {
            amount: true,
          },
        });

        // Also get experience from points transactions (when points were awarded, experience was also added)
        const studentPointsTransactions = await prisma.pointsTransaction.findMany({
          where: {
            studentId: student.id,
            type: 'AWARD',
            rolledBack: false,
            periodId: activePeriod.id
          },
          select: {
            points: true,
          },
        });

        const experienceFromTransactions = studentExperienceTransactions.reduce(
          (sum, transaction) => sum + transaction.amount,
          0
        );

        const experienceFromPoints = studentPointsTransactions.reduce(
          (sum, transaction) => sum + transaction.points,
          0
        );

        const calculatedExperience = experienceFromTransactions + experienceFromPoints;

        return {
          ...student,
          experience: calculatedExperience,
        };
      })
    );

    // Sort by calculated experience
    students.sort((a, b) => b.experience - a.experience);

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
  } catch (error: unknown) {
    console.error('Error fetching leaderboard:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}