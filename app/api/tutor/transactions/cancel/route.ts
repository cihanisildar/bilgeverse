import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userNode = session?.user as any;

    if (!userNode) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const userRoles: UserRole[] = userNode.roles || [userNode.role].filter(Boolean);
    const isTutor = userRoles.includes(UserRole.TUTOR);
    const isAsistan = userRoles.includes(UserRole.ASISTAN);
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isTutor && !isAsistan && !isAdmin) {
      return NextResponse.json({ error: 'Yetkisiz: Sadece rehberler işlem iptal edebilir' }, { status: 403 });
    }

    const { transactionId } = await request.json();

    if (!transactionId) {
      return NextResponse.json({ error: 'transactionId gerekli' }, { status: 400 });
    }

    // Find the transaction
    const transaction = await prisma.pointsTransaction.findUnique({
      where: { id: transactionId },
      include: {
        student: { select: { id: true, username: true, firstName: true, points: true } },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'İşlem bulunamadı' }, { status: 404 });
    }

    // Only allow cancelling own transactions (unless admin)
    if (!isAdmin && transaction.tutorId !== userNode.id) {
      return NextResponse.json({ error: 'Sadece kendi işlemlerinizi iptal edebilirsiniz' }, { status: 403 });
    }

    // Check if already rolled back via flag
    if (transaction.rolledBack) {
      return NextResponse.json({ error: 'Bu işlem zaten iptal edilmiş' }, { status: 409 });
    }

    // Check if already rolled back via rollback record
    const alreadyRolledBack = await prisma.transactionRollback.findFirst({
      where: { transactionId, transactionType: 'POINTS' },
    });

    if (alreadyRolledBack) {
      return NextResponse.json({ error: 'Bu işlem zaten iptal edilmiş' }, { status: 409 });
    }

    // Perform the cancellation in a transaction
    await prisma.$transaction(async (tx) => {
      // Reverse the points on the student
      const pointsDelta = transaction.type === 'AWARD' ? -transaction.points : transaction.points;
      await tx.user.update({
        where: { id: transaction.studentId },
        data: { points: { increment: pointsDelta } },
      });

      // Mark the original transaction as rolled back
      await tx.pointsTransaction.update({
        where: { id: transaction.id },
        data: { rolledBack: true },
      });

      // Record the rollback
      await tx.transactionRollback.create({
        data: {
          transactionId: transaction.id,
          transactionType: 'POINTS',
          studentId: transaction.studentId,
          adminId: userNode.id,
          reason: 'Rehber tarafından hatalı giriş iptali',
          periodId: transaction.periodId,
        },
      });
    });

    return NextResponse.json({ success: true, message: 'Puan girişi başarıyla iptal edildi' });
  } catch (error) {
    console.error('Transaction cancel error:', error);
    return NextResponse.json({ error: 'İşlem iptal edilirken bir hata oluştu' }, { status: 500 });
  }
}
