import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/auth.config';
import { UserRole } from '@prisma/client';
import { requireActivePeriod } from '@/lib/periods';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can access this endpoint' },
        { status: 403 }
      );
    }

    // Get active period and filter transactions by it
    const activePeriod = await requireActivePeriod();

    // Get experience transactions for the active period only
    const transactions = await prisma.experienceTransaction.findMany({
      where: {
        rolledBack: false,
        periodId: activePeriod.id
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
      },
      orderBy: {
        createdAt: 'desc'
      }
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