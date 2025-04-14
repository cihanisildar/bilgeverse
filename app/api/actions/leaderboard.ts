'use server';

import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function getLeaderboard(tutorId?: string, limit: number = 100) {
  try {
    const students = await prisma.user.findMany({
      where: {
        role: UserRole.STUDENT,
        ...(tutorId && { tutorId })
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        points: true,
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
        points: 'desc'
      },
      take: limit
    });

    return students.map((student, index) => ({
      rank: index + 1,
      ...student
    }));
  } catch (error) {
    console.error('Get leaderboard error:', error);
    throw new Error('Failed to fetch leaderboard data');
  }
}

export async function getUserRank(userId: string) {
  try {
    // Get all students ordered by points
    const [user, allStudents] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          points: true,
          tutor: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.user.findMany({
        where: {
          role: UserRole.STUDENT
        },
        orderBy: {
          points: 'desc'
        },
        select: {
          id: true
        }
      })
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    const rank = allStudents.findIndex(student => student.id === userId) + 1;
    const totalStudents = allStudents.length;

    return {
      rank,
      totalStudents,
      user
    };
  } catch (error) {
    console.error('Get user rank error:', error);
    throw new Error('Failed to fetch user rank data');
  }
} 