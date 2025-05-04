import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { EventStatus, UserRole } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.TUTOR) {
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
          tutorId: session.user.id
        }
      }),
      
      // Count events
      prisma.event.count({
        where: {
          createdById: session.user.id
        }
      }),
      
      // Sum points awarded
      prisma.pointsTransaction.aggregate({
        where: {
          tutorId: session.user.id
        },
        _sum: {
          points: true
        }
      }),
      
      // Count completed events
      prisma.event.count({
        where: {
          createdById: session.user.id,
          status: EventStatus.TAMAMLANDI
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