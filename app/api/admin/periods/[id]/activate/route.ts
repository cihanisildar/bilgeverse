import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { UserRole, PeriodStatus } from '@prisma/client';
import { authOptions } from '../../../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

// POST - Activate a period (deactivates others and resets user points/experience)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can activate periods' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { resetData = true } = body;

    // Check if period exists
    const period = await prisma.period.findUnique({
      where: { id: params.id }
    });

    if (!period) {
      return NextResponse.json(
        { error: 'Period not found' },
        { status: 404 }
      );
    }

    if (period.status === PeriodStatus.ACTIVE) {
      return NextResponse.json(
        { error: 'Period is already active' },
        { status: 400 }
      );
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Deactivate all other periods
      await tx.period.updateMany({
        where: {
          status: PeriodStatus.ACTIVE
        },
        data: {
          status: PeriodStatus.INACTIVE
        }
      });

      // Activate the selected period
      const activatedPeriod = await tx.period.update({
        where: { id: params.id },
        data: {
          status: PeriodStatus.ACTIVE
        }
      });

      // Reset user points and experience if requested
      if (resetData) {
        console.log('Resetting user points and experience...');
        const updateResult = await tx.user.updateMany({
          where: {
            role: {
              in: [UserRole.STUDENT, UserRole.TUTOR, UserRole.ASISTAN]
            }
          },
          data: {
            points: 0,
            experience: 0
          }
        });
        console.log(`Reset points and experience for ${updateResult.count} users`);
      }

      return activatedPeriod;
    });

    return NextResponse.json(
      {
        period: result,
        resetData,
        message: `Period "${result.name}" activated successfully${resetData ? ' and user data reset' : ''}`
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error activating period:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}