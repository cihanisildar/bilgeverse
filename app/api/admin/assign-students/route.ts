import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can assign students to tutors' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentId, tutorId } = body;

    if (!studentId || !tutorId) {
      return NextResponse.json(
        { error: 'Student ID and Tutor ID are required' },
        { status: 400 }
      );
    }

    // Verify that the tutor exists and is actually a tutor
    const tutor = await prisma.user.findFirst({
      where: {
        id: tutorId,
        role: { in: [UserRole.TUTOR, UserRole.ASISTAN, UserRole.BOARD_MEMBER] }
      }
    });

    if (!tutor) {
      return NextResponse.json(
        { error: 'Tutor not found' },
        { status: 404 }
      );
    }

    // Verify that the student exists and is actually a student
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        role: UserRole.STUDENT
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Update the student's tutorId and assign to classroom in a transaction
    await prisma.$transaction(async (prisma) => {
      // Update the student's tutorId
      await prisma.user.update({
        where: { id: studentId },
        data: { tutorId: tutorId }
      });

      // Find the tutor's classroom and add the student to it
      const tutorClassroom = await prisma.classroom.findUnique({
        where: { tutorId: tutorId }
      });

      if (tutorClassroom) {
        // Add student to the classroom
        await prisma.user.update({
          where: { id: studentId },
          data: { studentClassroomId: tutorClassroom.id }
        });
      } else {
        // If no classroom exists, create one for the tutor
        const classroomName = tutor.firstName && tutor.lastName
          ? `${tutor.firstName} ${tutor.lastName} Sınıfı`
          : `${tutor.username} Sınıfı`;

        const classroomDescription = tutor.firstName && tutor.lastName
          ? `${tutor.firstName} ${tutor.lastName} öğretmeninin sınıfı`
          : `${tutor.username} öğretmeninin sınıfı`;

        const newClassroom = await prisma.classroom.create({
          data: {
            name: classroomName,
            description: classroomDescription,
            tutorId: tutorId,
          }
        });

        // Add student to the newly created classroom
        await prisma.user.update({
          where: { id: studentId },
          data: { studentClassroomId: newClassroom.id }
        });
      }
    });

    return NextResponse.json(
      {
        message: 'Student assigned to tutor successfully',
        student: {
          id: student.id,
          username: student.username,
          name: student.firstName && student.lastName ? `${student.firstName} ${student.lastName}` : student.username
        },
        tutor: {
          id: tutor.id,
          username: tutor.username,
          name: tutor.firstName && tutor.lastName ? `${tutor.firstName} ${tutor.lastName}` : tutor.username
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error assigning student to tutor:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Endpoint to get unassigned students and available tutors
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can view assignment data' },
        { status: 403 }
      );
    }

    // Get unassigned students
    const unassignedStudents = await prisma.user.findMany({
      where: {
        role: UserRole.STUDENT,
        tutorId: null
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true
      }
    });

    // Get all tutors
    const tutors = await prisma.user.findMany({
      where: {
        role: { in: [UserRole.TUTOR, UserRole.ASISTAN, UserRole.BOARD_MEMBER] }
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        _count: {
          select: {
            students: true
          }
        }
      }
    });

    return NextResponse.json({
      unassignedStudents: unassignedStudents.map(s => ({
        id: s.id,
        username: s.username,
        name: s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : s.username
      })),
      tutors: tutors.map(t => ({
        id: t.id,
        username: t.username,
        name: t.firstName && t.lastName ? `${t.firstName} ${t.lastName}` : t.username,
        studentCount: t._count.students
      }))
    });
  } catch (error: any) {
    console.error('Error fetching assignment data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 