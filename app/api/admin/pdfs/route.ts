import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET all PDFs, optionally filtered by partId
// All authenticated users can view PDFs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const partId = searchParams.get('partId');

    const where = partId ? { partId: parseInt(partId) } : {};

    const pdfs = await prisma.partPdf.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(pdfs);
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PDFs' },
      { status: 500 }
    );
  }
}

// POST create a new PDF entry with drive link
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can create PDF entries' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { partId, title, description, driveLink, contentType, isActive } = body;

    if (partId === undefined || partId === null || !title || !driveLink) {
      return NextResponse.json(
        { error: 'Part ID, title, and drive link are required' },
        { status: 400 }
      );
    }

    const partIdNum = parseInt(partId);
    if (isNaN(partIdNum) || partIdNum < 0 || partIdNum > 10) {
      return NextResponse.json(
        { error: 'Part ID must be between 0 and 10 (0 for dashboard, 1-10 for parts)' },
        { status: 400 }
      );
    }

    // Validate drive link format (basic check)
    if (!driveLink.startsWith('http://') && !driveLink.startsWith('https://')) {
      return NextResponse.json(
        { error: 'Drive link must be a valid URL' },
        { status: 400 }
      );
    }

    // Save to database
    const pdf = await prisma.partPdf.create({
      data: {
        partId: partIdNum,
        title,
        description: description || null,
        driveLink,
        contentType: contentType || null,
        isActive: isActive !== undefined ? isActive : true,
        uploadedById: session.user.id,
      },
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
      message: 'PDF entry created successfully',
      pdf,
    });
  } catch (error) {
    console.error('PDF creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create PDF entry' },
      { status: 500 }
    );
  }
}

