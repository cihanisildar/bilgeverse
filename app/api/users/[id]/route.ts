import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getUserFromRequest, isAuthenticated, isAdmin, isTutor } from '@/lib/server-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser)) {
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
    const isSelf = currentUser?.id === userId;
    const isAdminUser = isAdmin(currentUser);
    const isTutorViewingStudent = 
      isTutor(currentUser) && 
      user.role === UserRole.STUDENT && 
      user.tutorId && 
      user.tutorId === currentUser?.id;
    
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
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isAdmin(currentUser)) {
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

    // Check for duplicate username or email if changing
    if ((username && username !== user.username) || (email && email !== user.email)) {
      const existingUser = await prisma.user.findFirst({
        where: {
          id: { not: userId },
          OR: [
            ...(username ? [{ username }] : []),
            ...(email ? [{ email }] : []),
          ],
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username or email already exists' },
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

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(email && { email }),
        ...(role && { role: role as UserRole }),
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(points !== undefined && { points: parseInt(points) || 0 }),
        ...(tutorId && { tutorId })
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

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    }, { status: 200 });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error instanceof Error && (error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'Username or email already exists' },
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
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }
    
    const userId = params.id;
    
    // Prevent deleting yourself
    if (currentUser?.id === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 