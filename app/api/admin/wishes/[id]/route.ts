import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

export async function GET(
  request: Request,
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const wish = await prisma.wish.findUnique({
      where: {
        id: params.id,
      },
      include: {
        student: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!wish) {
      return NextResponse.json({ error: 'Wish not found' }, { status: 404 });
    }

    return NextResponse.json({ wish });
  } catch (error) {
    console.error('Error fetching wish details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wish details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { response, action } = await request.json();

    const wish = await prisma.wish.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!wish) {
      return NextResponse.json({ error: 'Wish not found' }, { status: 404 });
    }

    // Handle deleting response
    if (action === 'delete_response') {
      const updatedWish = await prisma.wish.update({
        where: {
          id: params.id,
        },
        data: {
          response: null,
          respondedAt: null,
          respondedBy: null,
        },
        include: {
          student: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json({
        message: 'Response deleted successfully',
        wish: updatedWish
      });
    }

    // Handle adding/updating response
    if (!response || response.trim() === '') {
      return NextResponse.json({ error: 'Response is required' }, { status: 400 });
    }

    const updatedWish = await prisma.wish.update({
      where: {
        id: params.id,
      },
      data: {
        response: response.trim(),
        respondedAt: new Date(),
        respondedBy: session.user.id,
      },
      include: {
        student: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Response updated successfully',
      wish: updatedWish
    });
  } catch (error) {
    console.error('Error updating wish response:', error);
    return NextResponse.json(
      { error: 'Failed to update wish response' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { response } = await request.json();

    if (!response || response.trim() === '') {
      return NextResponse.json({ error: 'Response is required' }, { status: 400 });
    }

    const wish = await prisma.wish.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!wish) {
      return NextResponse.json({ error: 'Wish not found' }, { status: 404 });
    }

    if (!wish.response) {
      return NextResponse.json({ error: 'No response to edit' }, { status: 400 });
    }

    const updatedWish = await prisma.wish.update({
      where: {
        id: params.id,
      },
      data: {
        response: response.trim(),
        respondedAt: new Date(), // Update timestamp when editing
      },
      include: {
        student: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Response edited successfully',
      wish: updatedWish
    });
  } catch (error) {
    console.error('Error editing wish response:', error);
    return NextResponse.json(
      { error: 'Failed to edit wish response' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const wish = await prisma.wish.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!wish) {
      return NextResponse.json({ error: 'Wish not found' }, { status: 404 });
    }

    await prisma.wish.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: 'Wish deleted successfully' });
  } catch (error) {
    console.error('Error deleting wish:', error);
    return NextResponse.json(
      { error: 'Failed to delete wish' },
      { status: 500 }
    );
  }
}