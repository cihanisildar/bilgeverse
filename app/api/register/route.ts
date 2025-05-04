import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, firstName, lastName, requestedRole } = body;

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName || !requestedRole) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if username or email already exists in users or registration requests
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { email: email.toLowerCase() }
        ],
      },
    });

    const existingRequest = await prisma.registrationRequest.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { email: email.toLowerCase() }
        ],
        status: 'PENDING',
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      );
    }

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A pending registration request already exists for this username or email' },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create registration request
    const registrationRequest = await prisma.registrationRequest.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        requestedRole,
        status: 'PENDING',
      },
    });

    return NextResponse.json(
      { 
        message: 'Registration request submitted successfully. Please wait for admin approval.',
        requestId: registrationRequest.id 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 