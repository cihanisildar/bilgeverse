import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, isAuthenticated, isAdmin, isTutor } from '@/lib/server-auth';

// Default empty response
const EMPTY_RESPONSE = { items: [] };

// Helper to handle retries
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Operation failed (attempt ${attempt + 1}/${maxRetries}):`, error);
      lastError = error;
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 300 * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError;
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    console.log('Store API - Current user details:', {
      id: currentUser?.id,
      username: currentUser?.username,
      role: currentUser?.role,
      tutorId: currentUser?.tutorId,
      hasUser: !!currentUser
    });
    
    if (!isAuthenticated(currentUser)) {
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
      isStudent: !isTutor(currentUser),
      userTutorId: currentUser.tutorId
    });

    // If admin, show all items or filter by tutorId
    if (isAdmin(currentUser)) {
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
    if (!isTutor(currentUser)) {
      console.log('Store API - Student user check:', {
        hasCurrentUser: !!currentUser,
        userRole: currentUser?.role,
        tutorId: currentUser?.tutorId,
        isStudent: !isTutor(currentUser)
      });
      
      if (!currentUser.tutorId) {
        console.log('Store API - No tutor assigned to student');
        return NextResponse.json(
          { error: 'No tutor assigned' },
          { status: 400 }
        );
      }

      console.log('Store API - Fetching items for student with tutorId:', currentUser.tutorId);
      const items = await prisma.storeItem.findMany({
        where: {
          tutorId: currentUser.tutorId
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
        tutorId: currentUser.id
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
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || (!isAdmin(currentUser) && !isTutor(currentUser))) {
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
    if (isAdmin(currentUser) && tutorId) {
      const tutor = await prisma.user.findFirst({
        where: {
          id: tutorId,
          role: 'TUTOR'
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
          tutorId: isAdmin(currentUser) ? tutorId : currentUser.id
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