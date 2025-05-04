import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/auth.config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Store API - Current user details:', {
      id: session?.user?.id,
      username: session?.user?.username,
      role: session?.user?.role,
      tutorId: session?.user?.tutorId,
      hasUser: !!session?.user
    });
    
    if (!session?.user) {
      console.log('Store API - User not authenticated');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tutorId from query params
    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get('tutorId');
    console.log('Store API - Request details:', {
      url: request.url,
      tutorId,
      isStudent: session.user.role === UserRole.STUDENT,
      userTutorId: session.user.tutorId
    });

    // If admin, show all items or filter by tutorId
    if (session.user.role === UserRole.ADMIN) {
      console.log('Store API - Admin user, fetching all items');
      const items = await prisma.storeItem.findMany({
        where: tutorId ? {
          tutorId: tutorId
        } : undefined,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
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

      return NextResponse.json({ items });
    }

    // If user is a student, only show their tutor's store
    if (session.user.role === UserRole.STUDENT) {
      console.log('Store API - Student user check:', {
        hasCurrentUser: !!session.user,
        userRole: session.user.role,
        tutorId: session.user.tutorId,
        isStudent: session.user.role === UserRole.STUDENT
      });
      
      if (!session.user.tutorId) {
        console.log('Store API - No tutor assigned to student');
        return NextResponse.json(
          { error: 'No tutor assigned' },
          { status: 400 }
        );
      }

      console.log('Store API - Fetching items for student with tutorId:', session.user.tutorId);
      const items = await prisma.storeItem.findMany({
        where: {
          tutorId: session.user.tutorId
        },
        orderBy: {
          createdAt: 'desc'
        },
        include: {
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

      return NextResponse.json({ items });
    }

    // For tutors, show their own store
    const items = await prisma.storeItem.findMany({
      where: {
        tutorId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
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

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Fetch store items error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'TUTOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin or tutor can create store items' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, pointsRequired, availableQuantity, imageUrl, tutorId } = body;

    // Validate required fields
    if (!name || !description || !pointsRequired || availableQuantity === undefined) {
      return NextResponse.json(
        { error: 'Name, description, pointsRequired, and availableQuantity are required' },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (pointsRequired <= 0) {
      return NextResponse.json(
        { error: 'Points required must be greater than 0' },
        { status: 400 }
      );
    }

    if (availableQuantity < 0) {
      return NextResponse.json(
        { error: 'Available quantity cannot be negative' },
        { status: 400 }
      );
    }

    // If admin is creating item for a tutor, validate tutorId
    if (session.user.role === UserRole.ADMIN && tutorId) {
      const tutor = await prisma.user.findFirst({
        where: {
          id: tutorId,
          role: UserRole.TUTOR
        }
      });

      if (!tutor) {
        return NextResponse.json(
          { error: 'Invalid tutor ID' },
          { status: 400 }
        );
      }
    }

    try {
      const newItem = await prisma.storeItem.create({
        data: {
          name,
          description,
          pointsRequired,
          availableQuantity,
          ...(imageUrl && { imageUrl }),
          tutorId: session.user.role === UserRole.ADMIN ? tutorId : session.user.id
        },
        include: {
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

      return NextResponse.json(
        {
          message: 'Store item created successfully',
          item: newItem
        },
        { status: 201 }
      );
    } catch (dbError: any) {
      console.error('Database error creating store item:', dbError);
      
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { error: 'An item with this name already exists in this tutor\'s store' },
          { status: 409 }
        );
      }
      
      throw dbError;
    }
  } catch (error: any) {
    console.error('Create store item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 