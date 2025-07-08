import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/auth.config';
import { deleteFromS3 } from '@/lib/s3';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can access this endpoint' },
        { status: 403 }
      );
    }

    // Get all store items (global store)
    const items = await prisma.storeItem.findMany({
      orderBy: {
        createdAt: 'desc'
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

    // Create store item (global store)
    const newItem = await prisma.storeItem.create({
      data: {
        name,
        description,
        pointsRequired,
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

    // Get the item first to check if it has an image
    const existingItem = await prisma.storeItem.findUnique({
      where: { id: itemId },
      select: { imageUrl: true }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Delete the item from database first
    await prisma.storeItem.delete({
      where: { id: itemId }
    });

    // Clean up the image file if it exists
    if (existingItem.imageUrl) {
      try {
        // Extract the S3 key from the URL
        const url = new URL(existingItem.imageUrl);
        const key = url.pathname.substring(1); // Remove leading slash
        
        await deleteFromS3(key);
        console.log(`Deleted image from S3: ${key}`);
      } catch (fileError) {
        // Log but don't fail the request if file deletion fails
        console.warn('Failed to delete image from S3:', fileError);
      }
    }

    return NextResponse.json({ message: 'Store item deleted successfully' });
  } catch (error) {
    console.error('Admin delete store item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 