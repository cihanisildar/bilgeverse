import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcrypt';
import logger from '@/lib/logger';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

// Get tutor's students from their classroom
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.TUTOR) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can access this endpoint' },
        { status: 403 }
      );
    }

    // Get tutor's classroom and students
    const tutorClassroom = await prisma.classroom.findUnique({
      where: {
        tutorId: session.user.id
      },
      include: {
        students: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            points: true,
            experience: true,
            createdAt: true,
          },
          orderBy: {
            firstName: 'asc'
          }
        }
      }
    });

    if (!tutorClassroom) {
      return NextResponse.json(
        { error: 'Classroom not found for this tutor' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      classroom: {
        id: tutorClassroom.id,
        name: tutorClassroom.name,
        description: tutorClassroom.description,
      },
      students: tutorClassroom.students,
      totalStudents: tutorClassroom.students.length
    });
  } catch (error: any) {
    console.error('Error fetching tutor students:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new student and assign to tutor's classroom
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.TUTOR) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can create students' },
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

    // Get tutor's classroom
    const tutorClassroom = await prisma.classroom.findUnique({
      where: {
        tutorId: session.user.id
      }
    });

    if (!tutorClassroom) {
      return NextResponse.json(
        { error: 'Classroom not found for this tutor' },
        { status: 404 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate placeholder email from username
    const email = `${username.toLowerCase()}@ogrtakip.com`;

    // Create the student and assign to tutor's classroom
    const newStudent = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email,
        password: hashedPassword,
        role: UserRole.STUDENT,
        firstName,
        lastName,
        tutorId: session.user.id,
        studentClassroomId: tutorClassroom.id,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        points: true,
        experience: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      message: 'Student created and assigned to classroom successfully',
      student: newStudent,
      classroom: {
        id: tutorClassroom.id,
        name: tutorClassroom.name
      }
    });
  } catch (error: any) {
    console.error('Error creating student:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 