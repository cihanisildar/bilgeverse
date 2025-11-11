import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// DELETE a PDF entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can delete PDF entries' },
        { status: 403 }
      );
    }

    const pdf = await prisma.partPdf.findUnique({
      where: { id: params.id },
    });

    if (!pdf) {
      return NextResponse.json(
        { error: 'PDF entry not found' },
        { status: 404 }
      );
    }

    // Delete from database
    await prisma.partPdf.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'PDF entry deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting PDF entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete PDF entry' },
      { status: 500 }
    );
  }
}

// PUT update PDF entry (title, description, driveLink, isActive)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can update PDF entries' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, driveLink, contentType, isActive } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Validate drive link format if provided
    if (driveLink && !driveLink.startsWith('http://') && !driveLink.startsWith('https://')) {
      return NextResponse.json(
        { error: 'Drive link must be a valid URL' },
        { status: 400 }
      );
    }

    const updateData: any = {
      title,
      description: description || null,
    };

    if (driveLink !== undefined) {
      updateData.driveLink = driveLink;
    }

    if (contentType !== undefined) {
      updateData.contentType = contentType || null;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const pdf = await prisma.partPdf.update({
      where: { id: params.id },
      data: updateData,
      include: {
        uploadedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'PDF entry updated successfully',
      pdf,
    });
  } catch (error) {
    console.error('Error updating PDF entry:', error);
    return NextResponse.json(
      { error: 'Failed to update PDF entry' },
      { status: 500 }
    );
  }
}

