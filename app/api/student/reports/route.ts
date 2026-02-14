import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
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

    const userRoles = (session.user as any)?.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);
    const isTutor = userRoles.includes(UserRole.TUTOR);
    const isAsistan = userRoles.includes(UserRole.ASISTAN);

    if (!isAdmin && !isTutor && !isAsistan) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins, tutors, and asistans can access student reports' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // If tutor or asistan, verify they have access to this student
    if (isTutor || isAsistan) {
      // For asistan, we check if they assist the tutor who has this student
      const tutorIdToCheck = isAsistan ? (session.user as any).assistedTutorId : session.user.id;

      const student = await prisma.user.findFirst({
        where: {
          id: studentId,
          tutorId: tutorIdToCheck || session.user.id, // Fallback to current user if asistan doesn't have assistedTutorId
          roles: { has: UserRole.STUDENT },
          isActive: true
        }
      });

      if (!student) {
        return NextResponse.json(
          { error: 'Student not found, not assigned to you, or is currently inactive' },
          { status: 404 }
        );
      }
    }

    // Get student information (only if active)
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        roles: { has: UserRole.STUDENT },
        isActive: true
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        points: true,
        experience: true,
        createdAt: true
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found or is currently inactive' },
        { status: 404 }
      );
    }

    // Get all points transactions for this student
    const pointsTransactions = await prisma.pointsTransaction.findMany({
      where: {
        studentId: studentId,
        type: 'AWARD', // Only count awarded points
        rolledBack: false
      },
      include: {
        pointReason: true,
        tutor: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get all experience transactions for this student
    const experienceTransactions = await prisma.experienceTransaction.findMany({
      where: {
        studentId: studentId,
        rolledBack: false
      },
      include: {
        tutor: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get event participations for this student
    const eventParticipations = await prisma.eventParticipant.findMany({
      where: {
        userId: studentId,
        status: 'ATTENDED'
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            points: true,
            tags: true,
            startDateTime: true
          }
        }
      },
      orderBy: {
        registeredAt: 'desc'
      }
    });

    // Get total number of events created in the system
    const totalEventsCreated = await prisma.event.count();

    // Categorize points by point reason
    const pointsByActivity = categorizePointsByActivity(pointsTransactions);

    // Categorize experience by activity type
    const experienceByActivity = categorizeExperienceByActivity(experienceTransactions);

    // Clean up transaction reasons for display
    const cleanedPointsTransactions = pointsTransactions.map(transaction => ({
      ...transaction,
      reason: cleanTransactionReason(transaction.reason, transaction.points)
    }));

    // Calculate total points and experience from different sources
    const totalPointsFromEvents = eventParticipations.reduce((sum, participation) =>
      sum + (participation.event.points || 0), 0
    );

    const totalPointsFromTransactions = pointsTransactions.reduce((sum, transaction) =>
      sum + transaction.points, 0
    );

    const totalExperienceFromTransactions = experienceTransactions.reduce((sum, transaction) =>
      sum + transaction.amount, 0
    );

    // Create activity breakdown
    const activityBreakdown = {
      events: {
        count: eventParticipations.length,
        totalPoints: totalPointsFromEvents,
        participations: eventParticipations
      },
      transactions: {
        count: pointsTransactions.length,
        totalPoints: totalPointsFromTransactions,
        totalExperience: totalExperienceFromTransactions,
        byActivity: pointsByActivity,
        experienceByActivity: experienceByActivity
      }
    };

    // Calculate overall statistics
    const overallStats = {
      totalPoints: student.points,
      totalExperience: student.experience,
      totalPointsEarned: totalPointsFromEvents + totalPointsFromTransactions,
      totalExperienceEarned: totalExperienceFromTransactions,
      memberSince: student.createdAt,
      eventParticipations: eventParticipations.length,
      totalEventsCreated: totalEventsCreated,
      totalTransactions: pointsTransactions.length + experienceTransactions.length
    };

    return NextResponse.json({
      student,
      activityBreakdown,
      overallStats,
      recentTransactions: {
        points: cleanedPointsTransactions.slice(0, 10),
        experience: experienceTransactions.slice(0, 10)
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching student report:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to categorize points by point reason
function categorizePointsByActivity(transactions: any[]) {
  const categories: { [key: string]: { total: number; count: number; transactions: any[] } } = {};
  transactions.forEach(transaction => {
    const reasonName = transaction.pointReason?.name || 'Diğer Aktiviteler';
    if (!categories[reasonName]) {
      categories[reasonName] = { total: 0, count: 0, transactions: [] };
    }
    categories[reasonName].total += transaction.points;
    categories[reasonName].count += 1;
    categories[reasonName].transactions.push(transaction);
  });
  return categories;
}

// Helper function to clean up and standardize transaction reasons
function cleanTransactionReason(reason: string | null, points: number): string {
  if (!reason) return 'Puan İşlemi';

  const lowerReason = reason.toLowerCase();

  // Handle specific activity types
  if (lowerReason.includes('karakter') && lowerReason.includes('eğitimi')) {
    return 'Sohbet (Karakter Eğitimi)';
  }

  if (lowerReason.includes('atölye') && lowerReason.includes('faaliyeti')) {
    return 'Atölye Faaliyeti';
  }

  if (lowerReason.includes('kitap') || lowerReason.includes('okuma')) {
    return 'Kitap Okuma Ödülü';
  }

  if (lowerReason.includes('etkinlik') && lowerReason.includes('katılım')) {
    return reason; // Keep original as it already contains event title
  }

  // Handle admin operations
  if (lowerReason.includes('puan') && (lowerReason.includes('eklendi') || lowerReason.includes('azaltıldı'))) {
    return points > 0 ? 'Admin Tarafından Puan Eklendi' : 'Admin Tarafından Puan Azaltıldı';
  }

  // Default cases
  if (points > 0) {
    return 'Bilge Para Kazanımı';
  }

  return 'Puan İşlemi';
}

// Helper function to categorize experience by activity type
function categorizeExperienceByActivity(transactions: any[]) {
  const categories: { [key: string]: { total: number; count: number; transactions: any[] } } = {
    'Sohbet (Karakter Eğitimi)': { total: 0, count: 0, transactions: [] },
    'Atölye Faaliyetleri': { total: 0, count: 0, transactions: [] },
    'Kitap Okuma': { total: 0, count: 0, transactions: [] },
    'Diğer Aktiviteler': { total: 0, count: 0, transactions: [] }
  };

  // Since experience transactions don't have reasons, we'll categorize them based on amount patterns
  // or assign them to "Diğer Aktiviteler" by default
  transactions.forEach(transaction => {
    categories['Diğer Aktiviteler'].total += transaction.amount;
    categories['Diğer Aktiviteler'].count += 1;
    categories['Diğer Aktiviteler'].transactions.push(transaction);
  });

  return categories;
}