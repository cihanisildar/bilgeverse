import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';
import { requireActivePeriod } from '@/lib/periods';
import { calculateUserPoints, calculateMultipleUserPoints } from '@/lib/points';

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

    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get active period
    const activePeriod = await requireActivePeriod();

    // Fetch all tutors with their students and classroom (including classroom students)
    const tutors = await prisma.user.findMany({
      where: {
        roles: { has: UserRole.TUTOR },
      },
      include: {
        students: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        },
        classroom: {
          include: {
            students: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        },
      },
      orderBy: {
        username: 'asc',
      }
    });

    // Collect all student IDs to calculate points in batch
    const allStudentIds = new Set<string>();
    tutors.forEach(tutor => {
      tutor.students.forEach(s => allStudentIds.add(s.id));
      tutor.classroom?.students.forEach(s => allStudentIds.add(s.id));
    });

    // Calculate points for all students in one go
    const pointsMap = await calculateMultipleUserPoints(Array.from(allStudentIds), activePeriod.id);

    // Process tutors and their merged students
    const tutorsWithCalculatedData = tutors.map(tutor => {
      // Merge students from both sources (direct relation and classroom)
      const mergedStudentsMap = new Map<string, { id: string; username: string; firstName: string | null; lastName: string | null; points: number }>();

      // Add direct students
      tutor.students.forEach(s => {
        mergedStudentsMap.set(s.id, { ...s, points: pointsMap.get(s.id) || 0 });
      });

      // Add classroom students (if any)
      tutor.classroom?.students.forEach(s => {
        if (!mergedStudentsMap.has(s.id)) {
          mergedStudentsMap.set(s.id, { ...s, points: pointsMap.get(s.id) || 0 });
        }
      });

      const mergedStudents = Array.from(mergedStudentsMap.values());

      return {
        id: tutor.id,
        username: tutor.username,
        firstName: tutor.firstName,
        lastName: tutor.lastName,
        classroom: tutor.classroom ? {
          id: tutor.classroom.id,
          name: tutor.classroom.name,
          description: tutor.classroom.description,
        } : null,
        students: mergedStudents,
      };
    });

    return NextResponse.json({ tutors: tutorsWithCalculatedData }, { status: 200 });
  } catch (error: unknown) {
    console.error('Admin fetch tutors error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}