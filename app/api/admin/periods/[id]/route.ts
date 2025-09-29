import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { UserRole, PeriodStatus } from '@prisma/client';
import { authOptions } from '../../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

// GET - Get specific period
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can access periods' },
        { status: 403 }
      );
    }

    const period = await prisma.period.findUnique({
      where: { id: params.id },
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

    if (!period) {
      return NextResponse.json(
        { error: 'Period not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ period }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching period:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update period
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can update periods' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, startDate, endDate, status } = body;

    // Check if period exists
    const existingPeriod = await prisma.period.findUnique({
      where: { id: params.id }
    });

    if (!existingPeriod) {
      return NextResponse.json(
        { error: 'Period not found' },
        { status: 404 }
      );
    }

    // If changing name, check for duplicates
    if (name && name !== existingPeriod.name) {
      const duplicatePeriod = await prisma.period.findUnique({
        where: { name }
      });

      if (duplicatePeriod) {
        return NextResponse.json(
          { error: 'Period with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Validate dates
    const start = startDate ? new Date(startDate) : existingPeriod.startDate;
    const end = endDate ? new Date(endDate) : existingPeriod.endDate;

    if (end && end <= start) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startDate) updateData.startDate = start;
    if (endDate !== undefined) updateData.endDate = end;
    if (status) updateData.status = status;

    const period = await prisma.period.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json({ period }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating period:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete period (only if no data associated)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can delete periods' },
        { status: 403 }
      );
    }

    // Check if period exists
    const period = await prisma.period.findUnique({
      where: { id: params.id },
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

    if (!period) {
      return NextResponse.json(
        { error: 'Period not found' },
        { status: 404 }
      );
    }

    // Check if period has any associated data
    const hasData = Object.values(period._count).some(count => count > 0);

    if (hasData) {
      return NextResponse.json(
        { error: 'İlişkili verileri olan dönem silinemez. Bunun yerine arşivleyin.' },
        { status: 400 }
      );
    }

    await prisma.period.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      { message: 'Period deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting period:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}