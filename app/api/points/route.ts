import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TransactionType, UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TUTOR) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin or tutor can award points' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentId, points, reason, pointReasonId } = body;

    // Add logging
    console.log('Points API request body:', { studentId, points, reason, pointReasonId });

    if (!studentId || points === undefined || points === null) {
      return NextResponse.json(
        { error: 'Öğrenci numarası ve puan gerekli' },
        { status: 400 }
      );
    }

    if (Math.abs(points) <= 0) {
      return NextResponse.json(
        { error: 'Eklenmek istenen puan 0 dan fazla olmalı' },
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
      if (session.user.role === UserRole.TUTOR && student.tutorId !== session.user.id) {
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
          tutorId: session.user.id,
          points: Math.abs(points),
          type: points >= 0 ? TransactionType.AWARD : TransactionType.REDEEM,
          reason: reason || (points >= 0 ? 'Puan eklendi' : 'Puan azaltıldı'),
          pointReasonId: pointReasonId || null
        }
      });

      // Add detailed logging
      console.log('Created transaction with details:', {
        id: transaction.id,
        studentId: transaction.studentId,
        tutorId: transaction.tutorId,
        points: transaction.points,
        type: transaction.type,
        reason: transaction.reason,
        pointReasonId: transaction.pointReasonId
      });

      // Update student's points
      const updatedStudent = await tx.user.update({
        where: { id: studentId },
        data: {
          points: {
            increment: points
          },
          // Also update experience if points are being increased
          ...(points > 0 && {
            experience: {
              increment: points
            }
          })
        },
        select: {
          id: true,
          points: true,
          experience: true
        }
      });

      return { transaction, newBalance: updatedStudent.points };
    });

    return NextResponse.json(
      {
        message: points >= 0 ? 'Puan başarıyla eklendi' : 'Puan başarıyla azaltıldı',
        transaction: result.transaction,
        newBalance: result.newBalance
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Points operation error:', error);
    
    if (error instanceof Error) {
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
      
      return NextResponse.json(
        { error: 'Internal server error', details: error.message },
        { status: 500 }
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    
    let where: any = {};

    // If admin, can see all transactions (optionally filtered by student)
    if (session.user.role === UserRole.ADMIN) {
      if (studentId) {
        where.studentId = studentId;
      }
    } 
    // If tutor, can only see transactions for their students
    else if (session.user.role === UserRole.TUTOR) {
      if (studentId) {
        // Check if student belongs to this tutor
        const student = await prisma.user.findFirst({
          where: {
            id: studentId,
            tutorId: session.user.id
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
          tutorId: session.user.id
        };
      }
    }
    // If student, can only see their own transactions
    else {
      where.studentId = session.user.id;
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