import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, isAuthenticated, isAdmin, isStudent, isTutor } from '@/lib/server-auth';
import { TransactionType, UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !(isAdmin(currentUser) || isTutor(currentUser))) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin or tutor can award points' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentId, points, reason } = body;

    if (!studentId || points === undefined || points === null) {
      return NextResponse.json(
        { error: 'Student ID and points are required' },
        { status: 400 }
      );
    }

    if (Math.abs(points) <= 0) {
      return NextResponse.json(
        { error: 'Points amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Use Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if student exists and is actually a student
      const student = await tx.user.findFirst({
        where: {
          id: studentId,
          role: UserRole.STUDENT
        }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      // If tutor, check if the student is assigned to this tutor
      if (isTutor(currentUser) && student.tutorId !== currentUser.id) {
        throw new Error('Unauthorized: Student not assigned to this tutor');
      }

      // Check if decreasing points would result in negative balance
      if (points < 0 && Math.abs(points) > student.points) {
        throw new Error('Cannot decrease more points than student has');
      }

      // Create transaction record
      const transaction = await tx.pointsTransaction.create({
        data: {
          studentId,
          tutorId: currentUser.id,
          points: Math.abs(points),
          type: points >= 0 ? TransactionType.AWARD : TransactionType.REDEEM,
          reason: reason || (points >= 0 ? 'Points awarded' : 'Points deducted')
        }
      });

      // Update student's points
      const updatedStudent = await tx.user.update({
        where: { id: studentId },
        data: {
          points: {
            increment: points
          }
        },
        select: {
          id: true,
          points: true
        }
      });

      return { transaction, newBalance: updatedStudent.points };
    });

    return NextResponse.json(
      {
        message: points >= 0 ? 'Points awarded successfully' : 'Points deducted successfully',
        transaction: result.transaction,
        newBalance: result.newBalance
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Points operation error:', error);
    
    if (error.message === 'Student not found') {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }
    
    if (error.message === 'Unauthorized: Student not assigned to this tutor') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    if (error.message === 'Cannot decrease more points than student has') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    // Log the detailed error for debugging
    console.error('Detailed error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Get transactions for a student or for a tutor's students
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    
    let where: any = {};

    // If admin, can see all transactions (optionally filtered by student)
    if (isAdmin(currentUser)) {
      if (studentId) {
        where.studentId = studentId;
      }
    } 
    // If tutor, can only see transactions for their students
    else if (isTutor(currentUser)) {
      if (studentId) {
        // Check if student belongs to this tutor
        const student = await prisma.user.findFirst({
          where: {
            id: studentId,
            tutorId: currentUser.id
          }
        });
        
        if (!student) {
          return NextResponse.json(
            { error: 'Student not found or not assigned to this tutor' },
            { status: 404 }
          );
        }
        
        where.studentId = studentId;
      } else {
        // Get all transactions for tutor's students
        where.student = {
          tutorId: currentUser.id
        };
      }
    }
    // If student, can only see their own transactions
    else {
      where.studentId = currentUser.id;
    }

    const transactions = await prisma.pointsTransaction.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        student: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        tutor: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json({ transactions }, { status: 200 });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 