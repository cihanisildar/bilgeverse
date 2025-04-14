import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, isAuthenticated, isStudent } from '@/lib/server-auth';
import { RequestStatus, ParticipantStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isStudent(currentUser)) {
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
          userId: currentUser.id,
          status: ParticipantStatus.ATTENDED
        }
      }),
      
      // Count approved requests
      prisma.itemRequest.count({
        where: {
          studentId: currentUser.id,
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