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

    if (!studentId || !points) {
      return NextResponse.json(
        { error: 'Student ID and points are required' },
        { status: 400 }
      );
    }

    if (points <= 0) {
      return NextResponse.json(
        { error: 'Points must be greater than 0' },
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

      // Create transaction record
      const transaction = await tx.pointsTransaction.create({
        data: {
          studentId,
          tutorId: currentUser.id,
          points,
          type: TransactionType.AWARD,
          reason: reason || 'Points awarded'
        }
      });

      // Update student's points
      const updatedStudent = await tx.user.update({
        where: { id: studentId },
        data: {
          points: {
            increment: points
          }
        }
      });

      return { transaction, newBalance: updatedStudent.points };
    });

    return NextResponse.json(
      {
        message: 'Points awarded successfully',
        transaction: result.transaction,
        newBalance: result.newBalance
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Award points error:', error);
    
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
    
    return NextResponse.json(
      { error: 'Internal server error' },
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