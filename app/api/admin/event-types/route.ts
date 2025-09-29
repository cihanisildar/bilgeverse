import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can view event types' },
        { status: 403 }
      );
    }

    const eventTypes = await prisma.eventType.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            events: true
          }
        }
      }
    });

    return NextResponse.json({ eventTypes }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching event types:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can create event types' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.name.trim()) {
      return NextResponse.json(
        { error: 'Event type name is required' },
        { status: 400 }
      );
    }

    // Check if event type already exists
    const existingEventType = await prisma.eventType.findUnique({
      where: { name: data.name.trim() }
    });

    if (existingEventType) {
      return NextResponse.json(
        { error: 'Event type with this name already exists' },
        { status: 409 }
      );
    }

    // Create new event type
    const newEventType = await prisma.eventType.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        isActive: data.isActive !== false // default to true
      }
    });

    return NextResponse.json({
      message: 'Event type created successfully',
      eventType: newEventType
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating event type:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An event type with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}