import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import logger from '@/lib/logger';
import { authOptions } from '../auth/[...nextauth]/auth.config';
import { requireActivePeriod } from '@/lib/periods';

export const dynamic = 'force-dynamic';

// Get notes for a student
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== UserRole.TUTOR && session.user.role !== UserRole.ASISTAN)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors and asistans can access notes' },
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

    const notes = await prisma.studentNote.findMany({
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

    return NextResponse.json({ notes }, { status: 200 });
  } catch (error: any) {
    logger.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new note
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== UserRole.TUTOR && session.user.role !== UserRole.ASISTAN)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors and asistans can create notes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentId, content } = body;

    if (!studentId || !content) {
      return NextResponse.json(
        { error: 'Student ID and content are required' },
        { status: 400 }
      );
    }

    const activePeriod = await requireActivePeriod();

    const note = await prisma.studentNote.create({
      data: {
        content,
        studentId,
        tutorId: session.user.id,
        periodId: activePeriod.id,
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
      { message: 'Note created successfully', note },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Error creating note:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a note
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== UserRole.TUTOR && session.user.role !== UserRole.ASISTAN)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors and asistans can update notes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, content } = body;

    if (!id || !content) {
      return NextResponse.json(
        { error: 'Note ID and content are required' },
        { status: 400 }
      );
    }

    // Verify the note belongs to this tutor
    const existingNote = await prisma.studentNote.findUnique({
      where: { id },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    if (existingNote.tutorId !== session.user.id && !(session.user.role === UserRole.ASISTAN && existingNote.tutorId === (session.user as any).assistedTutorId)) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only update your own or your assisted tutor\'s notes' },
        { status: 403 }
      );
    }

    const updatedNote = await prisma.studentNote.update({
      where: { id },
      data: { content },
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
      { message: 'Note updated successfully', note: updatedNote },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('Error updating note:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a note
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== UserRole.TUTOR && session.user.role !== UserRole.ASISTAN)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors and asistans can delete notes' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    // Verify the note belongs to this tutor
    const existingNote = await prisma.studentNote.findUnique({
      where: { id },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    if (existingNote.tutorId !== session.user.id && !(session.user.role === UserRole.ASISTAN && existingNote.tutorId === (session.user as any).assistedTutorId)) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only delete your own or your assisted tutor\'s notes' },
        { status: 403 }
      );
    }

    await prisma.studentNote.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Note deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    logger.error('Error deleting note:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 