import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getUserFromRequest, checkIsAdmin } from '@/lib/server-auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Only admin can create users
    const isUserAdmin = await checkIsAdmin(request);
    if (!isUserAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can create users' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, email, password, role, tutorId, firstName, lastName } = body;

    // Log the received data for debugging (excluding password)
    console.log('Registration attempt:', {
      username,
      email,
      role,
      tutorId,
      firstName,
      lastName
    });

    if (!username || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Username, email, password, and role are required' },
        { status: 400 }
      );
    }

    // Validate role is one of the allowed values
    if (!Object.values(UserRole).includes(role as UserRole)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // If student, validate tutorId
    if (role === UserRole.STUDENT && !tutorId) {
      return NextResponse.json(
        { error: 'Tutor ID is required for students' },
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

    try {
      // Create new user with normalized data
      const newUser = await prisma.user.create({
        data: {
          username: username.trim(),
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          role,
          ...(role === UserRole.STUDENT && { tutorId }),
          ...(firstName && { firstName: firstName.trim() }),
          ...(lastName && { lastName: lastName.trim() }),
        },
      });

      return NextResponse.json(
        {
          message: 'User created successfully',
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
          },
        },
        { status: 201 }
      );
    } catch (saveError: any) {
      console.error('User creation error:', saveError);
      if (saveError.code === 'P2002') { // Prisma unique constraint violation
        return NextResponse.json(
          { error: 'Username or email already exists' },
          { status: 409 }
        );
      }
      throw saveError;
    }
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 