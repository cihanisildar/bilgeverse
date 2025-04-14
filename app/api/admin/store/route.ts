import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, isAuthenticated, isAdmin } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can access this endpoint' },
        { status: 403 }
      );
    }

    // Get tutorId from query params
    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get('tutorId');

    // Get all store items, optionally filtered by tutorId
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
  } catch (error) {
    console.error('Admin fetch store items error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can access this endpoint' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, pointsRequired, availableQuantity, imageUrl, tutorId } = body;

    // Validate required fields
    if (!name || !description || !pointsRequired || availableQuantity === undefined || !tutorId) {
      return NextResponse.json(
        { error: 'Name, description, pointsRequired, availableQuantity, and tutorId are required' },
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

    // Validate tutor exists
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

    // Create store item
    const newItem = await prisma.storeItem.create({
      data: {
        name,
        description,
        pointsRequired,
        availableQuantity,
        imageUrl,
        tutorId
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
  } catch (error: any) {
    console.error('Admin create store item error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An item with this name already exists in this tutor\'s store' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isAdmin(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can access this endpoint' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Delete the item
    await prisma.storeItem.delete({
      where: { id: itemId }
    });

    return NextResponse.json({ message: 'Store item deleted successfully' });
  } catch (error) {
    console.error('Admin delete store item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 