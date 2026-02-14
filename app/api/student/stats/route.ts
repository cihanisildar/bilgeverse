import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { RequestStatus, ParticipantStatus, UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { hasRole } = await import('@/app/lib/auth-utils');
    const userRoles = (session.user as any)?.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isStudent = userRoles.includes(UserRole.STUDENT);

    if (!isStudent) {
      return NextResponse.json(
        { error: 'Unauthorized: Only students can access this endpoint' },
        { status: 403 }
      );
    }

    // Get student's stats
    const [
      completedEvents,
      approvedRequests
    ] = await Promise.all([
      // Count completed events
      prisma.eventParticipant.count({
        where: {
          userId: session.user.id,
          status: ParticipantStatus.ATTENDED
        }
      }),

      // Count approved requests
      prisma.itemRequest.count({
        where: {
          studentId: session.user.id,
          status: RequestStatus.APPROVED
        }
      })
    ]);

    return NextResponse.json({
      stats: {
        completedEvents,
        approvedRequests
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}