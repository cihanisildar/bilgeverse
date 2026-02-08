import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { EventStatus, UserRole } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== UserRole.TUTOR && session.user.role !== UserRole.ASISTAN)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors and asistans can access this endpoint' },
        { status: 403 }
      );
    }

    // Get the ID of the tutor to fetch stats for
    const targetTutorId = session.user.role === UserRole.ASISTAN
      ? (session.user as any).assistedTutorId
      : session.user.id;

    if (!targetTutorId) {
      return NextResponse.json(
        { error: 'Tutor ID not found for this user' },
        { status: 400 }
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
          tutorId: targetTutorId
        }
      }),

      // Count events
      prisma.event.count({
        where: {
          createdById: targetTutorId
        }
      }),

      // Sum points awarded
      prisma.pointsTransaction.aggregate({
        where: {
          tutorId: targetTutorId
        },
        _sum: {
          points: true
        }
      }),

      // Count completed events
      prisma.event.count({
        where: {
          createdById: targetTutorId,
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