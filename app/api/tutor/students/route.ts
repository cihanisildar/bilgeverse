import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcrypt';
import logger from '@/lib/logger';
import { authOptions } from '../../auth/[...nextauth]/auth.config';
import { calculateMultipleUserPoints, calculateUserExperience } from '@/lib/points';
import { requireActivePeriod } from '@/lib/periods';

export const dynamic = 'force-dynamic';

// Get tutor's students from their classroom
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

    let tutorClassroom;

    if (isTutor) {
      // If user is a tutor, get their own classroom
      tutorClassroom = await prisma.classroom.findUnique({
        where: {
          tutorId: session.user.id
        },
        include: {
          students: {
            where: {
              isActive: true
            },
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              createdAt: true,
            },
            orderBy: {
              firstName: 'asc'
            }
          }
        }
      });
    } else {
      // If user is an asistan, get the classroom of the tutor they assist
      const asistan = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { assistedTutorId: true }
      });

      if (!asistan?.assistedTutorId) {
        return NextResponse.json(
          { error: 'Asistan has not been assigned to assist any tutor' },
          { status: 404 }
        );
      }

      tutorClassroom = await prisma.classroom.findUnique({
        where: {
          tutorId: asistan.assistedTutorId
        },
        include: {
          students: {
            where: {
              isActive: true
            },
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              createdAt: true,
            },
            orderBy: {
              firstName: 'asc'
            }
          }
        }
      });
    }

    if (!tutorClassroom) {
      return NextResponse.json(
        { error: 'Classroom not found for this tutor/asistan' },
        { status: 404 }
      );
    }

    // Calculate period-aware points and experience for all students
    const userIds = tutorClassroom.students.map(s => s.id);
    const pointsMap = await calculateMultipleUserPoints(userIds, activePeriod.id);

    const studentsWithCalculatedStats = await Promise.all(
      tutorClassroom.students.map(async (student) => {
        const calculatedPoints = pointsMap.get(student.id) || 0;
        const calculatedExperience = await calculateUserExperience(student.id, activePeriod.id);

        return {
          ...student,
          points: calculatedPoints,
          experience: calculatedExperience,
        };
      })
    );

    return NextResponse.json({
      classroom: {
        id: tutorClassroom.id,
        name: tutorClassroom.name,
        description: tutorClassroom.description,
      },
      students: studentsWithCalculatedStats,
      totalStudents: studentsWithCalculatedStats.length
    });
  } catch (error: unknown) {
    console.error('Error fetching tutor students:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Create new student and assign to tutor's classroom
export async function POST(request: NextRequest) {
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
        { error: 'Unauthorized: Only tutors and asistans can create students' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, password, firstName, lastName } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username.toLowerCase(),
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    let tutorClassroom;
    let tutorIdForStudent;

    if (isTutor) {
      // If user is a tutor, use their own classroom
      tutorClassroom = await prisma.classroom.findUnique({
        where: {
          tutorId: session.user.id
        }
      });
      tutorIdForStudent = session.user.id;
    } else {
      // If user is an asistan, use the classroom of the tutor they assist
      const asistan = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { assistedTutorId: true }
      });

      if (!asistan?.assistedTutorId) {
        return NextResponse.json(
          { error: 'Asistan has not been assigned to assist any tutor' },
          { status: 404 }
        );
      }

      tutorClassroom = await prisma.classroom.findUnique({
        where: {
          tutorId: asistan.assistedTutorId
        }
      });
      tutorIdForStudent = asistan.assistedTutorId; // Students belong to the main tutor, not the asistan
    }

    if (!tutorClassroom) {
      return NextResponse.json(
        { error: 'Classroom not found for this tutor/asistan' },
        { status: 404 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate placeholder email from username
    const email = `${username.toLowerCase()}@ogrtakip.com`;

    // Create the student and assign to tutor/asistan's classroom
    const newStudent = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email,
        password: hashedPassword,
        role: UserRole.STUDENT,
        roles: [UserRole.STUDENT],
        firstName,
        lastName,
        tutorId: tutorIdForStudent,
        studentClassroomId: tutorClassroom.id,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      }
    });

    // Calculate period-aware stats for the new student (will be 0 since they're new)
    const activePeriod = await requireActivePeriod();
    const calculatedPoints = await calculateMultipleUserPoints([newStudent.id], activePeriod.id);
    const calculatedExperience = await calculateUserExperience(newStudent.id, activePeriod.id);

    const studentWithStats = {
      ...newStudent,
      points: calculatedPoints.get(newStudent.id) || 0,
      experience: calculatedExperience,
    };

    return NextResponse.json({
      message: 'Student created and assigned to classroom successfully',
      student: studentWithStats,
      classroom: {
        id: tutorClassroom.id,
        name: tutorClassroom.name
      }
    });
  } catch (error: unknown) {
    console.error('Error creating student:', error);

    if (error instanceof Error && (error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}