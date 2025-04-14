import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, isAuthenticated, isTutor } from '@/lib/server-auth';
import { RequestStatus, EventStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser) || !isTutor(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors can access this endpoint' },
        { status: 403 }
      );
    }

    // Get tutor's stats
    const [
      studentsCount,
      eventsCount,
      pointsAwarded,
      completedEvents
    ] = await Promise.all([
      // Count students
      prisma.user.count({
        where: {
          tutorId: currentUser.id
        }
      }),
      
      // Count events
      prisma.event.count({
        where: {
          createdById: currentUser.id
        }
      }),
      
      // Sum points awarded
      prisma.pointsTransaction.aggregate({
        where: {
          tutorId: currentUser.id
        },
        _sum: {
          points: true
        }
      }),
      
      // Count completed events
      prisma.event.count({
        where: {
          createdById: currentUser.id,
          status: EventStatus.COMPLETED
        }
      })
    ]);

    return NextResponse.json({
      stats: {
        studentsCount,
        eventsCount,
        pointsAwarded: pointsAwarded._sum.points || 0,
        completedEvents
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching tutor profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 