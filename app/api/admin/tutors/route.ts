import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';
import { requireActivePeriod } from '@/lib/periods';
import { calculateUserPoints } from '@/lib/points';

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
    // Fetch all tutors with their students and classroom
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
          select: {
            id: true,
            name: true,
            description: true,
          }
        },
      },
      orderBy: {
        username: 'asc',
      }
    });
    console.log('Admin tutors endpoint - Found tutors:', tutors.length);
    console.log('Admin tutors endpoint - Tutors with students:', tutors.map(t => ({ 
      name: t.username, 
      studentCount: t.students.length 
    })));

    // Calculate period-aware points for each student
    const tutorsWithCalculatedStudentPoints = await Promise.all(
      tutors.map(async (tutor) => {
        const studentsWithCalculatedPoints = await Promise.all(
          tutor.students.map(async (student) => {
            // Calculate points for the active period only
            const calculatedPoints = await calculateUserPoints(student.id, activePeriod.id);

            return {
              ...student,
              points: calculatedPoints,
            };
          })
        );

        return {
          ...tutor,
          students: studentsWithCalculatedPoints,
        };
      })
    );

    // Ensure clean response format
    const response = {
      tutors: tutorsWithCalculatedStudentPoints.map(tutor => ({
        id: tutor.id,
        username: tutor.username,
        firstName: tutor.firstName,
        lastName: tutor.lastName,
        classroom: tutor.classroom,
        students: tutor.students.map(student => ({
          id: student.id,
          username: student.username,
          firstName: student.firstName,
          lastName: student.lastName,
          points: student.points
        }))
      }))
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