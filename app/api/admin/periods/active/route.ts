import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { UserRole, PeriodStatus } from '@prisma/client';
import { authOptions } from '../../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

// GET - Get currently active period
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const activePeriod = await prisma.period.findFirst({
      where: { status: PeriodStatus.ACTIVE },
      include: {
        _count: {
          select: {
            events: true,
            pointsTransactions: true,
            experienceTransactions: true,
            itemRequests: true,
            wishes: true,
            studentNotes: true,
            studentReports: true,
            announcements: true
          }
        }
      }
    });

    if (!activePeriod) {
      return NextResponse.json(
        { error: 'No active period found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ period: activePeriod }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching active period:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}