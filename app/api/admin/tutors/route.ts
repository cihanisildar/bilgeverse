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
    console.log('Admin tutors endpoint - Starting request');
    const session = await getServerSession(authOptions);
    console.log('Admin tutors endpoint - Current user:', { id: session?.user?.id, role: session?.user?.role });

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      console.log('Admin tutors endpoint - Unauthorized access:', {
        isAuthenticated: !!session?.user,
        isAdmin: session?.user?.role === UserRole.ADMIN
      });
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can access this endpoint' },
        { status: 403 }
      );
    }

    // Get active period
    const activePeriod = await requireActivePeriod();

    console.log('Admin tutors endpoint - Fetching tutors');
    // Fetch all tutors with their students and classroom (including classroom students)
    const tutors = await prisma.user.findMany({
      where: {
        role: UserRole.TUTOR,
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

    console.log('Admin tutors endpoint - Found tutors:', tutors.length);

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
      const mergedStudentsMap = new Map<string, any>();

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

    const response = {
      tutors: tutorsWithCalculatedData
    };

    console.log('Admin tutors endpoint - Response format:', JSON.stringify(response, null, 2));
    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Admin fetch tutors error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 