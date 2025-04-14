import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getUserFromRequest, isAuthenticated, isTutor } from '@/lib/server-auth';
import bcrypt from 'bcrypt';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isTutor(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can access this endpoint' },
        { status: 403 }
      );
    }

    // Get all students assigned to this tutor
    const students = await prisma.user.findMany({ 
      where: {
        role: UserRole.STUDENT,
        tutorId: currentUser.id
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        points: true
      }
    });

    return NextResponse.json({ students }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching tutor students:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isTutor(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can create students' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, email, password, firstName, lastName } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { email: email.toLowerCase() }
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new student
    const newStudent = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: UserRole.STUDENT,
        tutorId: currentUser.id,
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        points: 0
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        points: true
      }
    });

    return NextResponse.json(
      {
        message: 'Student created successfully',
        student: newStudent
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create student error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 