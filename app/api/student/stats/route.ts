import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { RequestStatus, ParticipantStatus, UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.STUDENT) {
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