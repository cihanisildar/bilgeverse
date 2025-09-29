import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

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

    // Calculate the start of this week (Monday)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    // Calculate the end of this week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Get all active students with their weekly points and experience earned
    const students = await prisma.user.findMany({
      where: {
        role: UserRole.STUDENT,
        isActive: true
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        experience: true,
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

    // Get weekly points transactions for all students
    const weeklyPointsTransactions = await prisma.pointsTransaction.findMany({
      where: {
        studentId: { in: students.map(s => s.id) },
        type: 'AWARD',
        createdAt: {
          gte: startOfWeek,
          lte: endOfWeek
        },
        rolledBack: false
      },
      select: {
        studentId: true,
        points: true
      }
    });

    // Get weekly experience transactions for all students
    const weeklyExperienceTransactions = await prisma.experienceTransaction.findMany({
      where: {
        studentId: { in: students.map(s => s.id) },
        createdAt: {
          gte: startOfWeek,
          lte: endOfWeek
        },
        rolledBack: false
      },
      select: {
        studentId: true,
        amount: true
      }
    });

    // Calculate weekly totals for each student
    const weeklyTotals = new Map<string, { points: number; experience: number }>();

    // Initialize all students with 0 totals
    students.forEach(student => {
      weeklyTotals.set(student.id, { points: 0, experience: 0 });
    });

    // Add points from transactions
    weeklyPointsTransactions.forEach(transaction => {
      const current = weeklyTotals.get(transaction.studentId);
      if (current) {
        current.points += transaction.points;
        current.experience += transaction.points; // Points also count as experience
      }
    });

    // Add experience from experience transactions
    weeklyExperienceTransactions.forEach(transaction => {
      const current = weeklyTotals.get(transaction.studentId);
      if (current) {
        current.experience += transaction.amount;
      }
    });

    // Create leaderboard entries with weekly data
    const weeklyLeaderboard = students
      .map(student => {
        const weeklyData = weeklyTotals.get(student.id) || { points: 0, experience: 0 };
        return {
          id: student.id,
          username: student.username,
          firstName: student.firstName,
          lastName: student.lastName,
          weeklyPoints: weeklyData.points,
          weeklyExperience: weeklyData.experience,
          totalExperience: student.experience || 0,
          tutor: student.tutor
        };
      })
      .filter(entry => entry.weeklyPoints > 0 || entry.weeklyExperience > 0) // Only include students who earned something this week
      .sort((a, b) => b.weeklyExperience - a.weeklyExperience) // Sort by weekly experience earned
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

    return NextResponse.json({
      weeklyLeaderboard,
      weekRange: {
        start: startOfWeek.toISOString(),
        end: endOfWeek.toISOString()
      },
      total: weeklyLeaderboard.length
    }, { status: 200 });
  } catch (error) {
    console.error('Get weekly top earners error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
