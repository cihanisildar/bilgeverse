import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import logger from '@/lib/logger';
import { authOptions } from '../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

// Get reports for a student
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.TUTOR) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can access reports' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const reports = await prisma.studentReport.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        tutor: {
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

    return NextResponse.json({ reports }, { status: 200 });
  } catch (error: any) {
    logger.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.TUTOR) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can create reports' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentId, title, content } = body;

    if (!studentId || !title || !content) {
      return NextResponse.json(
        { error: 'Student ID, title, and content are required' },
        { status: 400 }
      );
    }

    const report = await prisma.studentReport.create({
      data: {
        title,
        content,
        studentId,
        tutorId: session.user.id,
      },
      include: {
        tutor: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: 'Report created successfully', report },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Error creating report:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a report
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.TUTOR) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can update reports' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, title, content } = body;

    if (!id || !title || !content) {
      return NextResponse.json(
        { error: 'Report ID, title, and content are required' },
        { status: 400 }
      );
    }

    // Verify the report belongs to this tutor
    const existingReport = await prisma.studentReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    if (existingReport.tutorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only update your own reports' },
        { status: 403 }
      );
    }

    const updatedReport = await prisma.studentReport.update({
      where: { id },
      data: { title, content },
      include: {
        tutor: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: 'Report updated successfully', report: updatedReport },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('Error updating report:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a report
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.TUTOR) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can delete reports' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Verify the report belongs to this tutor
    const existingReport = await prisma.studentReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    if (existingReport.tutorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only delete your own reports' },
        { status: 403 }
      );
    }

    await prisma.studentReport.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Report deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('Error deleting report:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 