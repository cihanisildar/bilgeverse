import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { authOptions } from '../../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can update event types' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const eventTypeId = params.id;

    // Validate required fields
    if (!data.name || !data.name.trim()) {
      return NextResponse.json(
        { error: 'Event type name is required' },
        { status: 400 }
      );
    }

    // Check if event type exists
    const existingEventType = await prisma.eventType.findUnique({
      where: { id: eventTypeId }
    });

    if (!existingEventType) {
      return NextResponse.json(
        { error: 'Event type not found' },
        { status: 404 }
      );
    }

    // Check if name is being changed and if new name already exists
    if (data.name.trim() !== existingEventType.name) {
      const nameExists = await prisma.eventType.findUnique({
        where: { name: data.name.trim() }
      });

      if (nameExists) {
        return NextResponse.json(
          { error: 'Event type with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Update event type
    const updatedEventType = await prisma.eventType.update({
      where: { id: eventTypeId },
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        isActive: data.isActive !== false
      }
    });

    return NextResponse.json({
      message: 'Event type updated successfully',
      eventType: updatedEventType
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error updating event type:', error);

    if (error instanceof Error && (error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'An event type with this name already exists' },
        { status: 409 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
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

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can delete event types' },
        { status: 403 }
      );
    }

    const eventTypeId = params.id;

    // Check if event type exists
    const existingEventType = await prisma.eventType.findUnique({
      where: { id: eventTypeId },
      include: {
        _count: {
          select: {
            events: true
          }
        }
      }
    });

    if (!existingEventType) {
      return NextResponse.json(
        { error: 'Event type not found' },
        { status: 404 }
      );
    }

    // Check if event type is in use
    if (existingEventType._count.events > 0) {
      return NextResponse.json(
        { error: 'Cannot delete event type that is in use by events. Deactivate it instead.' },
        { status: 400 }
      );
    }

    // Delete event type
    await prisma.eventType.delete({
      where: { id: eventTypeId }
    });

    return NextResponse.json({
      message: 'Event type deleted successfully'
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error deleting event type:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}