import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

// Helper to check if store item exists
async function checkItemExists(itemId: string) {
  const item = await prisma.storeItem.findUnique({
    where: { id: itemId }
  });
  
  return !!item;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.TUTOR) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const itemId = params.id;
    const body = await request.json();
    const { name, description, pointsRequired, availableQuantity, imageUrl } = body;

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

    // Check if item exists
    if (!await checkItemExists(itemId)) {
      return NextResponse.json(
        { error: 'Store item not found' },
        { status: 404 }
      );
    }

    // Update the item
    const updatedItem = await prisma.storeItem.update({
      where: { id: itemId },
      data: {
        name,
        description,
        pointsRequired,
        availableQuantity,
        ...(imageUrl && { imageUrl })
      }
    });

    return NextResponse.json({ item: updatedItem });
  } catch (error: any) {
    console.error('Update store item error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An item with this name already exists in your store' },
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
    
    if (!session?.user || session.user.role !== UserRole.TUTOR) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const itemId = params.id;

    // Check if item exists
    if (!await checkItemExists(itemId)) {
      return NextResponse.json(
        { error: 'Store item not found' },
        { status: 404 }
      );
    }

    // Delete the item
    await prisma.storeItem.delete({
      where: { id: itemId }
    });

    return NextResponse.json({ message: 'Store item deleted successfully' });
  } catch (error) {
    console.error('Delete store item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 