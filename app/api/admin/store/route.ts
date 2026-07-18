import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/auth.config';
import { getActivePeriod, storeItemWhere } from '@/lib/periods';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can access this endpoint' },
        { status: 403 }
      );
    }

    // Show items for the active period (plus legacy items). Admin sees passive
    // items too so they can re-activate them.
    const activePeriod = await getActivePeriod();
    const items = await prisma.storeItem.findMany({
      where: storeItemWhere(activePeriod?.id),
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ]
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can access this endpoint' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, pointsRequired, imageUrl } = body;

    // Validate required fields  
    if (!name || !description || !pointsRequired) {
      return NextResponse.json(
        { error: 'Name, description, and pointsRequired are required' },
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

    // Create store item scoped to the active period
    const activePeriod = await getActivePeriod();
    const newItem = await prisma.storeItem.create({
      data: {
        name,
        description,
        pointsRequired,
        periodId: activePeriod?.id ?? null,
        ...(imageUrl && { imageUrl })
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
        { error: 'An item with this name already exists' },
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
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

    const existingItem = await prisma.storeItem.findUnique({
      where: { id: itemId },
      select: { id: true }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Soft delete: deactivate the item instead of removing it. This keeps
    // purchase history intact and never touches other periods' items.
    await prisma.storeItem.update({
      where: { id: itemId },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Store item deactivated successfully' });
  } catch (error) {
    console.error('Admin delete store item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 