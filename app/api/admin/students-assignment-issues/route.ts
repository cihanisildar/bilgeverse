import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can access this endpoint' },
        { status: 403 }
      );
    }

    // Find students who have a tutor but no classroom
    const studentsWithIssues = await prisma.user.findMany({
      where: {
        role: UserRole.STUDENT,
        tutorId: { not: null }, // Has a tutor
        studentClassroomId: null, // But no classroom
      },
      include: {
        tutor: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        username: 'asc',
      }
    });

    const formattedStudents = studentsWithIssues.map(student => ({
      id: student.id,
      username: student.username,
      firstName: student.firstName,
      lastName: student.lastName,
      tutor: student.tutor,
      hasClassroom: false,
    }));

    return NextResponse.json({
      studentsWithIssues: formattedStudents,
      count: formattedStudents.length
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching students with assignment issues:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 