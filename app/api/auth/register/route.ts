import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '../[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Only admin can create users
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can create users' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, password, role, tutorId, assistedTutorId, firstName, lastName } = body;

    // Generate a placeholder email from username
    const email = `${username.toLowerCase()}@ogrtakip.com`;

    // Log the received data for debugging (excluding password)
    console.log('Registration attempt:', {
      username,
      email,
      role,
      tutorId,
      assistedTutorId,
      firstName,
      lastName
    });

    if (!username || !password || !role) {
      return NextResponse.json(
        { error: 'Username, password, and role are required' },
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
    if (role === UserRole.STUDENT) {
      if (!tutorId) {
        return NextResponse.json(
          { error: 'Tutor ID is required for students' },
          { status: 400 }
        );
      }

      // Verify tutor exists and is actually a tutor (not asistan)
      const tutor = await prisma.user.findFirst({
        where: {
          id: tutorId,
          role: UserRole.TUTOR
        }
      });

      if (!tutor) {
        return NextResponse.json(
          { error: 'Invalid tutor ID provided - only tutors can have students assigned' },
          { status: 400 }
        );
      }
    }

    // If asistan, validate assistedTutorId
    if (role === UserRole.ASISTAN) {
      if (!assistedTutorId) {
        return NextResponse.json(
          { error: 'Assisted tutor ID is required for asistans' },
          { status: 400 }
        );
      }

      // Verify assisted tutor exists and is actually a tutor (not asistan)
      const assistedTutor = await prisma.user.findFirst({
        where: {
          id: assistedTutorId,
          role: UserRole.TUTOR
        }
      });

      if (!assistedTutor) {
        return NextResponse.json(
          { error: 'Invalid assisted tutor ID provided - only tutors can have asistans assigned' },
          { status: 400 }
        );
      }
    }

    // Check if username already exists (removed email check)
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

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      let classroomId = undefined;
      
      // If student, find or create tutor's classroom
      if (role === UserRole.STUDENT && tutorId) {
        const tutorClassroom = await tx.classroom.findUnique({
          where: { tutorId: tutorId }
        });
        
        if (tutorClassroom) {
          classroomId = tutorClassroom.id;
        } else {
          // Create classroom for tutor if it doesn't exist
          const tutor = await tx.user.findUnique({
            where: { id: tutorId },
            select: { firstName: true, lastName: true, username: true, role: true }
          });

          if (tutor) {
            const classroomName = tutor.firstName && tutor.lastName
              ? `${tutor.firstName} ${tutor.lastName} Sınıfı`
              : `${tutor.username} Sınıfı`;

            const classroomDescription = tutor.firstName && tutor.lastName
              ? `${tutor.firstName} ${tutor.lastName} öğretmeninin sınıfı`
              : `${tutor.username} öğretmeninin sınıfı`;

            const newClassroom = await tx.classroom.create({
              data: {
                name: classroomName,
                description: classroomDescription,
                tutorId: tutorId,
              }
            });
            
            classroomId = newClassroom.id;
          }
        }
      }

      // Create the user
      const newUser = await tx.user.create({
        data: {
          username: username.toLowerCase(),
          email: email,
          password: hashedPassword,
          role: role as UserRole,
          tutorId,
          assistedTutorId,
          studentClassroomId: classroomId, // Assign to classroom if student
          firstName,
          lastName,
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          tutorId: true,
        }
      });

      // If the user is a tutor or asistan, create a classroom for them within the same transaction
      if (role === UserRole.TUTOR || role === UserRole.ASISTAN) {
        const classroomName = firstName && lastName 
          ? `${firstName} ${lastName} Sınıfı`
          : `${username} Sınıfı`;
          
        const classroomDescription = firstName && lastName
          ? `${firstName} ${lastName} ${role === UserRole.TUTOR ? 'öğretmeninin' : 'asistanının'} sınıfı`
          : `${username} ${role === UserRole.TUTOR ? 'öğretmeninin' : 'asistanının'} sınıfı`;

        await tx.classroom.create({
          data: {
            name: classroomName,
            description: classroomDescription,
            tutorId: newUser.id,
          }
        });
      }

      return newUser;
    });

    return NextResponse.json(
      { user: result },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 