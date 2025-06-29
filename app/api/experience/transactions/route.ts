import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.TUTOR) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can access this endpoint' },
        { status: 403 }
      );
    }

    // Get all experience transactions for students assigned to this tutor
    const transactions = await prisma.experienceTransaction.findMany({
      where: {
        tutorId: session.user.id,
        rolledBack: false
      },
      include: {
        student: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 25 // Limit to last 25 transactions
    });

    return NextResponse.json({ transactions }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching experience transactions:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.TUTOR) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can create experience transactions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentId, amount } = body;

    if (!studentId || amount === undefined) {
      return NextResponse.json(
        { error: 'Student ID and amount are required' },
        { status: 400 }
      );
    }

    // Verify the student is assigned to this tutor
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        tutorId: session.user.id,
        role: UserRole.STUDENT
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found or not assigned to you' },
        { status: 404 }
      );
    }

    // Create the transaction
    const transaction = await prisma.experienceTransaction.create({
      data: {
        amount,
        studentId,
        tutorId: session.user.id
      },
      include: {
        student: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Update student's experience
    await prisma.user.update({
      where: { id: studentId },
      data: {
        experience: {
          increment: amount
        }
      }
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating experience transaction:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 