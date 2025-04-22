import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, isAuthenticated, isTutor } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isTutor(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can access this endpoint' },
        { status: 403 }
      );
    }

    // Get all experience transactions for students assigned to this tutor
    const transactions = await prisma.experienceTransaction.findMany({
      where: {
        tutorId: currentUser.id
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
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isTutor(currentUser)) {
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

    // Create the transaction
    const transaction = await prisma.experienceTransaction.create({
      data: {
        amount,
        studentId,
        tutorId: currentUser.id
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

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating experience transaction:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 