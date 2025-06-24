import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Global store - all users see the same items
    const items = await prisma.storeItem.findMany({
      orderBy: {
        createdAt: 'desc'
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
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can create store items' },
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

    try {
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
    } catch (dbError: any) {
      console.error('Database error creating store item:', dbError);
      
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { error: 'An item with this name already exists' },
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