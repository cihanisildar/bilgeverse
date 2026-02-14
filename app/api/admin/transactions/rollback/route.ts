import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { UserRole } from '@prisma/client';
import { requireActivePeriod } from '@/lib/periods';

// Helper function to sync user table values with calculated values from transactions (NOT USED - period-aware system doesn't sync to user table)
async function syncUserTableValues(studentId: string) {
  // NOTE: This function is deprecated in the period-aware system
  // Points and experience are calculated dynamically from transactions per period
  // The user table's points/experience fields are no longer used
  console.log('syncUserTableValues called but skipped - using period-aware calculations');
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Only admin can perform rollbacks' }, { status: 403 });
    }

    const { transactionId, transactionType, reason } = await request.json();
    if (!transactionId || !transactionType || !reason) {
      return NextResponse.json({ error: 'transactionId, transactionType, and reason are required' }, { status: 400 });
    }
    if (!['POINTS', 'EXPERIENCE'].includes(transactionType)) {
      return NextResponse.json({ error: 'transactionType must be POINTS or EXPERIENCE' }, { status: 400 });
    }

    // Get active period
    const activePeriod = await requireActivePeriod();

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
            reason,
            periodId: activePeriod.id
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
            reason,
            periodId: activePeriod.id
          }
        });
        return { student, rollback };
      });
    }

    // Sync user table values with calculated values from transactions
    if (rollbackResult?.student) {
      await syncUserTableValues(rollbackResult.student.id);
    }

    return NextResponse.json({ success: true, ...rollbackResult });
  } catch (error: unknown) {
    console.error('Rollback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Only admin can view rollback history' }, { status: 403 });
    }

    // Get active period and filter rollbacks by it
    const activePeriod = await requireActivePeriod();

    const rollbacks = await prisma.transactionRollback.findMany({
      where: {
        periodId: activePeriod.id
      },
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, username: true, firstName: true, lastName: true } },
        admin: { select: { id: true, username: true, firstName: true, lastName: true } }
      }
    });
    return NextResponse.json({ rollbacks }, { status: 200 });
  } catch (error: unknown) {
    console.error('Get rollback history error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 