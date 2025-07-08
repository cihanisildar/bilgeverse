import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { deleteFromS3 } from '@/lib/s3';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can access this endpoint' },
        { status: 403 }
      );
    }

    const itemId = params.id;
    
    const item = await prisma.storeItem.findUnique({
      where: { id: itemId },
      include: {
        itemRequests: {
          select: {
            id: true,
            status: true,
            pointsSpent: true,
            createdAt: true,
            student: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Admin get store item error:', error);
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
        { error: 'Unauthorized: Only admin can access this endpoint' },
        { status: 403 }
      );
    }

    const itemId = params.id;
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

    // Check if item exists and get current imageUrl
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

    // If we have a new imageUrl and it's different from the existing one, delete the old image
    if (imageUrl && existingItem.imageUrl && imageUrl !== existingItem.imageUrl) {
      // Check if the old image is an S3 image
      if (existingItem.imageUrl.includes('amazonaws.com/')) {
        try {
          // Extract the S3 key from the old URL
          const oldUrl = new URL(existingItem.imageUrl);
          const oldKey = oldUrl.pathname.substring(1); // Remove leading slash
          
          await deleteFromS3(oldKey);
          console.log(`Deleted old image from S3: ${oldKey}`);
        } catch (deleteError) {
          // Log but don't fail the request if delete fails
          console.warn('Failed to delete old image from S3:', deleteError);
        }
      }
    }

    // Update the item
    const updatedItem = await prisma.storeItem.update({
      where: { id: itemId },
      data: {
        name,
        description,
        pointsRequired,
        ...(imageUrl && { imageUrl })
      },
      include: {
        itemRequests: {
          select: {
            id: true,
            status: true,
            pointsSpent: true,
            createdAt: true,
            student: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ item: updatedItem });
  } catch (error: any) {
    console.error('Admin update store item error:', error);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can access this endpoint' },
        { status: 403 }
      );
    }

    const itemId = params.id;
    
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

    // First delete all related item requests
    await prisma.itemRequest.deleteMany({
      where: {
        itemId: itemId
      }
    });

    // Then delete the item from database
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

    return NextResponse.json({ message: 'Store item and related requests deleted successfully' });
  } catch (error: any) {
    console.error('Admin delete store item error:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete item due to existing references' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 