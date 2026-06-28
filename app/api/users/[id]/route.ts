import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';
import { getUserWithCalculatedStats } from '@/lib/points';

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

    // Get user with calculated points and experience for current period
    const user = await getUserWithCalculatedStats(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get additional user data not included in calculated stats
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        tutorId: true,
        createdAt: true
      }
    });

    const enrichedUser = {
      ...user,
      email: userData?.email,
      tutorId: userData?.tutorId,
      createdAt: userData?.createdAt
    };

    // Only allow access if:
    // 1. User is looking at their own profile
    // 2. User is an admin
    // 3. User is a tutor or asistan looking at their own student
    const isSelf = session.user.id === userId;

    const userRoles = session.user.roles || [session.user.role];
    const isAdminUser = userRoles.includes(UserRole.ADMIN);

    const isTutorViewingStudent = (userRoles.includes(UserRole.TUTOR) || userRoles.includes(UserRole.ASISTAN)) &&
      ((user.roles && user.roles.includes(UserRole.STUDENT)) || user.role === UserRole.STUDENT) &&
      enrichedUser.tutorId &&
      enrichedUser.tutorId === session.user.id;

    if (!isSelf && !isAdminUser && !isTutorViewingStudent) {
      return NextResponse.json(
        { error: 'Unauthorized: Cannot access this user' },
        { status: 403 }
      );
    }

    return NextResponse.json({ user: enrichedUser }, { status: 200 });
  } catch (error: unknown) {
    console.error('Get user error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
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

    if (!session?.user || !(session.user.roles || [session.user.role]).includes(UserRole.ADMIN)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const userId = params.id;
    const body = await request.json();
    const { username, email, roles, tutorId, firstName, lastName, points } = body;
    let { role } = body;

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

    // sync role and roles
    const updatedRoles: UserRole[] = roles || (role ? [role as UserRole] : user.roles);
    const primaryRole = role || (updatedRoles.length > 0 ? updatedRoles[0] : user.role);

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
    const isStudent = updatedRoles.includes(UserRole.STUDENT) || primaryRole === UserRole.STUDENT;
    if (isStudent) {
      if (tutorId) {
        // Verify tutor exists and has TUTOR role
        const tutor = await prisma.user.findFirst({
          where: {
            id: tutorId,
            roles: { has: UserRole.TUTOR }
          }
        });

        if (!tutor) {
          return NextResponse.json(
            { error: 'Invalid tutor ID provided (must be a user with TUTOR role)' },
            { status: 400 }
          );
        }
      } else if (!user.tutorId) {
        return NextResponse.json(
          { error: 'Tutor ID is required for students' },
          { status: 400 }
        );
      }
    }

    // Update user with transaction to handle classroom assignment
    const updatedUser = await prisma.$transaction(async (tx) => {
      let classroomId = undefined;

      // If assigning to a tutor, also assign to their classroom
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

      return await tx.user.update({
        where: { id: userId },
        data: {
          ...(username && { username }),
          role: primaryRole as UserRole,
          roles: updatedRoles,
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
          roles: true,
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

export async function PATCH(
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

    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);
    const isTutor = userRoles.includes(UserRole.TUTOR);
    const isAsistan = userRoles.includes(UserRole.ASISTAN);

    if (!isAdmin && !isTutor && !isAsistan) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin or Tutor access required' },
        { status: 403 }
      );
    }

    const userId = params.id;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean value' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, roles: true, tutorId: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // For tutors, they can only update their own students' status
    const sessionRoles = session.user.roles || [session.user.role];
    const isSessionTutor = sessionRoles.includes(UserRole.TUTOR);
    const isSessionAdmin = sessionRoles.includes(UserRole.ADMIN);

    if (isSessionTutor && !isSessionAdmin) {
      const isStudent = (user.roles && user.roles.includes(UserRole.STUDENT)) || user.role === UserRole.STUDENT;
      if (!isStudent || user.tutorId !== session.user.id) {
        return NextResponse.json(
          { error: 'Unauthorized: Can only update your own students' },
          { status: 403 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive,
        statusChangedAt: new Date(),
        statusChangedBy: session.user.id
      },
      select: {
        id: true,
        username: true,
        isActive: true,
        statusChangedAt: true,
        statusChangedBy: true
      }
    });

    return NextResponse.json({
      message: 'User status updated successfully',
      user: updatedUser
    }, { status: 200 });
  } catch (error) {
    console.error('Update user status error:', error);
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

    if (!session?.user || !(session.user.roles || [session.user.role]).includes(UserRole.ADMIN)) {
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

    // SOFT DELETE: We never hard-delete users, because that would also wipe all of
    // their historical period data (points/experience/notes/reports/wishes etc.).
    // Instead we mark them as deleted + inactive. All historical records and their
    // period memberships are preserved, so past periods stay intact (no data loss).
    // The `deletedAt: null` filter used across listings hides them from current views.
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        isActive: false,
        statusChangedAt: new Date(),
        statusChangedBy: session.user.id
      }
    });

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Delete user error:', error);

    // Handle specific Prisma errors
    if (error instanceof Error && (error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (error instanceof Error && (error as any).code === 'P2028') {
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