import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        points: true,
        tutorId: true,
        createdAt: true,
        tutor: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only allow access if:
    // 1. User is looking at their own profile
    // 2. User is an admin
    // 3. User is a tutor looking at their own student
    const isSelf = session.user.id === userId;
    const isAdminUser = session.user.role === UserRole.ADMIN;
    const isTutorViewingStudent = 
      session.user.role === UserRole.TUTOR && 
      user.role === UserRole.STUDENT && 
      user.tutorId && 
      user.tutorId === session.user.id;
    
    if (!isSelf && !isAdminUser && !isTutorViewingStudent) {
      return NextResponse.json(
        { error: 'Unauthorized: Cannot access this user' },
        { status: 403 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }
    
    const userId = params.id;
    const body = await request.json();
    const { username, email, role, tutorId, firstName, lastName, points } = body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check for duplicate username if changing
    if (username && username !== user.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          id: { not: userId },
          username: username,
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 409 }
        );
      }
    }

    // If changing to student role or user is already a student, validate tutorId
    if (role === UserRole.STUDENT || user.role === UserRole.STUDENT) {
      if (tutorId) {
        // Verify tutor exists and is a tutor
        const tutor = await prisma.user.findFirst({
          where: {
            id: tutorId,
            role: UserRole.TUTOR
          }
        });

        if (!tutor) {
          return NextResponse.json(
            { error: 'Invalid tutor ID provided' },
            { status: 400 }
          );
        }
      } else if (role === UserRole.STUDENT && !tutorId && !user.tutorId) {
        return NextResponse.json(
          { error: 'Tutor ID is required for students' },
          { status: 400 }
        );
      }
    }

    // Update user with transaction to handle classroom assignment
    const updatedUser = await prisma.$transaction(async (tx) => {
      let classroomId = undefined;
      
      // If assigning to a tutor, also assign to tutor's classroom
      if (tutorId) {
        const tutorClassroom = await tx.classroom.findUnique({
          where: { tutorId: tutorId }
        });
        
        if (tutorClassroom) {
          classroomId = tutorClassroom.id;
        } else {
          // Create classroom for tutor if it doesn't exist
          const tutor = await tx.user.findUnique({
            where: { id: tutorId },
            select: { firstName: true, lastName: true, username: true }
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
      
              return await tx.user.update({
          where: { id: userId },
          data: {
            ...(username && { username }),
            ...(role && { role: role as UserRole }),
            ...(firstName !== undefined && { firstName }),
            ...(lastName !== undefined && { lastName }),
            ...(points !== undefined && { points: parseInt(points) || 0 }),
            ...(tutorId && { tutorId, studentClassroomId: classroomId })
          },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          points: true,
          tutorId: true
        }
      });
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    }, { status: 200 });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error instanceof Error && (error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }
    
    const userId = params.id;
    
    // Prevent deleting yourself
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user exists before trying to delete
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!userExists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete all related records in a transaction with increased timeout
    await prisma.$transaction(async (tx) => {
      // Delete all points transactions where user is either student or tutor
      await tx.pointsTransaction.deleteMany({
        where: {
          OR: [
            { studentId: userId },
            { tutorId: userId }
          ]
        }
      });

      // Delete all experience transactions where user is either student or tutor
      await tx.experienceTransaction.deleteMany({
        where: {
          OR: [
            { studentId: userId },
            { tutorId: userId }
          ]
        }
      });

      // Delete all item requests where user is either student or tutor
      await tx.itemRequest.deleteMany({
        where: {
          OR: [
            { studentId: userId },
            { tutorId: userId }
          ]
        }
      });

      // Store items are now global, so we don't delete them when deleting a tutor
      // The following line was causing the error because tutorId field was removed from StoreItem
      // await tx.storeItem.deleteMany({
      //   where: { tutorId: userId }
      // });

      // Delete all event participants records
      await tx.eventParticipant.deleteMany({
        where: { userId: userId }
      });

      // Delete all events created by this user
      await tx.event.deleteMany({
        where: { createdById: userId }
      });

      // Delete all events created for this tutor
      await tx.event.deleteMany({
        where: { createdForTutorId: userId }
      });

      // Delete all registration requests processed by this user
      await tx.registrationRequest.updateMany({
        where: { processedById: userId },
        data: { processedById: null }
      });

      // Delete all student notes where user is either student or tutor
      await tx.studentNote.deleteMany({
        where: {
          OR: [
            { studentId: userId },
            { tutorId: userId }
          ]
        }
      });

      // Delete all student reports where user is either student or tutor
      await tx.studentReport.deleteMany({
        where: {
          OR: [
            { studentId: userId },
            { tutorId: userId }
          ]
        }
      });

      // Delete all wishes created by this student
      await tx.wish.deleteMany({
        where: { studentId: userId }
      });

      // Delete all point earning cards created by this admin
      await tx.pointEarningCard.deleteMany({
        where: { createdById: userId }
      });

      // Remove tutor reference from any students and clear their studentClassroomId
      await tx.user.updateMany({
        where: { tutorId: userId },
        data: { tutorId: null, studentClassroomId: null }
      });

      // Remove studentClassroomId from any students in this user's classroom
      await tx.user.updateMany({
        where: { 
          classroomStudents: {
            tutorId: userId
          }
        },
        data: { studentClassroomId: null }
      });

      // Delete the classroom if user is a tutor
      await tx.classroom.deleteMany({
        where: { tutorId: userId }
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id: userId }
      });
    }, {
      maxWait: 20000, // 20 seconds max wait time
      timeout: 30000, // 30 seconds timeout
    });

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete user error:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    if (error.code === 'P2028') {
      return NextResponse.json(
        { error: 'Database transaction failed. Please try again.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 