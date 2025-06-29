import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized: Only admin can perform rollbacks' }, { status: 403 });
    }

    const { transactionId, transactionType, reason } = await request.json();
    if (!transactionId || !transactionType || !reason) {
      return NextResponse.json({ error: 'transactionId, transactionType, and reason are required' }, { status: 400 });
    }
    if (!['POINTS', 'EXPERIENCE'].includes(transactionType)) {
      return NextResponse.json({ error: 'transactionType must be POINTS or EXPERIENCE' }, { status: 400 });
    }

    // Prevent double rollback
    const alreadyRolledBack = await prisma.transactionRollback.findFirst({
      where: { transactionId, transactionType }
    });
    if (alreadyRolledBack) {
      return NextResponse.json({ error: 'This transaction has already been rolled back.' }, { status: 409 });
    }

    let rollbackResult;
    if (transactionType === 'POINTS') {
      rollbackResult = await prisma.$transaction(async (tx) => {
        const transaction = await tx.pointsTransaction.findUnique({ where: { id: transactionId } });
        if (!transaction) throw new Error('Points transaction not found');
        // Revert points
        const student = await tx.user.update({
          where: { id: transaction.studentId },
          data: { points: { decrement: transaction.type === 'AWARD' ? transaction.points : -transaction.points } }
        });
        // Mark transaction as rolled back
        await tx.pointsTransaction.update({
          where: { id: transactionId },
          data: { rolledBack: true }
        });
        // Log rollback
        const rollback = await tx.transactionRollback.create({
          data: {
            transactionId,
            transactionType,
            studentId: transaction.studentId,
            adminId: session.user.id,
            reason
          }
        });
        return { student, rollback };
      });
    } else if (transactionType === 'EXPERIENCE') {
      rollbackResult = await prisma.$transaction(async (tx) => {
        const transaction = await tx.experienceTransaction.findUnique({ where: { id: transactionId } });
        if (!transaction) throw new Error('Experience transaction not found');
        // Revert experience
        const student = await tx.user.update({
          where: { id: transaction.studentId },
          data: { experience: { decrement: transaction.amount } }
        });
        // Mark transaction as rolled back
        await tx.experienceTransaction.update({
          where: { id: transactionId },
          data: { rolledBack: true }
        });
        // Log rollback
        const rollback = await tx.transactionRollback.create({
          data: {
            transactionId,
            transactionType,
            studentId: transaction.studentId,
            adminId: session.user.id,
            reason
          }
        });
        return { student, rollback };
      });
    }
    return NextResponse.json({ success: true, ...rollbackResult });
  } catch (error: any) {
    console.error('Rollback error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized: Only admin can view rollback history' }, { status: 403 });
    }

    const rollbacks = await prisma.transactionRollback.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, username: true, firstName: true, lastName: true } },
        admin: { select: { id: true, username: true, firstName: true, lastName: true } }
      }
    });
    return NextResponse.json({ rollbacks }, { status: 200 });
  } catch (error: any) {
    console.error('Get rollback history error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 