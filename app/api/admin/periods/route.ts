import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { UserRole, PeriodStatus } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/auth.config';
import { handleDatabaseError } from '@/lib/api-error-handler';

export const dynamic = 'force-dynamic';

// GET - List all periods
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can access periods' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as PeriodStatus | null;

    const where = status ? { status } : {};

    const periods = await prisma.period.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
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

    return NextResponse.json({ periods }, { status: 200 });
  } catch (error: any) {
    return handleDatabaseError(error, 'Fetching periods');
  }
}

// POST - Create new period
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can create periods' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, startDate, endDate } = body;

    if (!name || !startDate) {
      return NextResponse.json(
        { error: 'Period name and start date are required' },
        { status: 400 }
      );
    }

    // Check if period name already exists
    const existingPeriod = await prisma.period.findUnique({
      where: { name }
    });

    if (existingPeriod) {
      return NextResponse.json(
        { error: 'Period with this name already exists' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (end && end <= start) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    const period = await prisma.period.create({
      data: {
        name,
        description,
        startDate: start,
        endDate: end,
        status: PeriodStatus.INACTIVE
      }
    });

    return NextResponse.json({ period }, { status: 201 });
  } catch (error: any) {
    return handleDatabaseError(error, 'Creating period');
  }
}