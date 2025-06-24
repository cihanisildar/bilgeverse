import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TUTOR)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins and tutors can access overall statistics' },
        { status: 403 }
      );
    }

    // Get all students (filtered by tutor if tutor role)
    const whereClause = session.user.role === UserRole.TUTOR 
      ? { role: UserRole.STUDENT, tutorId: session.user.id }
      : { role: UserRole.STUDENT };

    const students = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        points: true,
        experience: true
      }
    });

    if (students.length === 0) {
      return NextResponse.json({
        totalStudents: 0,
        totalPoints: 0,
        totalExperience: 0,
        activityDistribution: [],
        averagePointsPerStudent: 0,
        averageExperiencePerStudent: 0
      }, { status: 200 });
    }

    // Get all points transactions for these students
    const studentIds = students.map(s => s.id);
    
    const pointsTransactions = await prisma.pointsTransaction.findMany({
      where: {
        studentId: { in: studentIds },
        type: 'AWARD'
      },
      select: {
        points: true,
        reason: true,
        createdAt: true
      }
    });

    // Get all experience transactions for these students
    const experienceTransactions = await prisma.experienceTransaction.findMany({
      where: {
        studentId: { in: studentIds }
      },
      select: {
        amount: true,
        createdAt: true
      }
    });

    // Get all event participations for these students
    const eventParticipations = await prisma.eventParticipant.findMany({
      where: {
        userId: { in: studentIds },
        status: 'ATTENDED'
      },
      include: {
        event: {
          select: {
            title: true,
            points: true,
            tags: true
          }
        }
      }
    });

    // Calculate total points and experience
    const totalPoints = students.reduce((sum, student) => sum + student.points, 0);
    const totalExperience = students.reduce((sum, student) => sum + student.experience, 0);
    
    const totalPointsFromEvents = eventParticipations.reduce((sum, participation) => 
      sum + (participation.event.points || 0), 0
    );
    
    const totalPointsFromTransactions = pointsTransactions.reduce((sum, transaction) => 
      sum + transaction.points, 0
    );

    const totalExperienceFromTransactions = experienceTransactions.reduce((sum, transaction) => 
      sum + transaction.amount, 0
    );

    // Categorize all points by activity type
    const activityCategories = categorizeAllPointsByActivity(pointsTransactions, eventParticipations);

    // Calculate percentages for pie chart
    const totalAllPoints = totalPointsFromEvents + totalPointsFromTransactions;
    const activityDistribution = Object.entries(activityCategories).map(([category, data]) => ({
      name: category,
      value: data.total,
      percentage: totalAllPoints > 0 ? Math.round((data.total / totalAllPoints) * 100) : 0,
      count: data.count
    })).filter(item => item.value > 0);

    // Calculate averages
    const averagePointsPerStudent = Math.round(totalPoints / students.length);
    const averageExperiencePerStudent = Math.round(totalExperience / students.length);

    // Get top performing students
    const topStudentsByPoints = students
      .sort((a, b) => b.points - a.points)
      .slice(0, 5)
      .map((student, index) => ({
        rank: index + 1,
        id: student.id,
        name: student.firstName && student.lastName 
          ? `${student.firstName} ${student.lastName}` 
          : student.username,
        points: student.points,
        experience: student.experience
      }));

    const topStudentsByExperience = students
      .sort((a, b) => b.experience - a.experience)
      .slice(0, 5)
      .map((student, index) => ({
        rank: index + 1,
        id: student.id,
        name: student.firstName && student.lastName 
          ? `${student.firstName} ${student.lastName}` 
          : student.username,
        points: student.points,
        experience: student.experience
      }));

    return NextResponse.json({
      totalStudents: students.length,
      totalPoints,
      totalExperience,
      totalPointsEarned: totalPointsFromEvents + totalPointsFromTransactions,
      totalExperienceEarned: totalExperienceFromTransactions,
      activityDistribution,
      averagePointsPerStudent,
      averageExperiencePerStudent,
      topStudentsByPoints,
      topStudentsByExperience,
      summary: {
        eventsParticipated: eventParticipations.length,
        totalTransactions: pointsTransactions.length + experienceTransactions.length,
        averageEventParticipation: Math.round(eventParticipations.length / students.length)
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching overall statistics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to categorize all points by activity type
function categorizeAllPointsByActivity(pointsTransactions: any[], eventParticipations: any[]) {
  const categories: { [key: string]: { total: number; count: number } } = {
    'Sohbet (Karakter Eğitimi)': { total: 0, count: 0 },
    'Atölye Faaliyetleri': { total: 0, count: 0 },
    'Kitap Okuma': { total: 0, count: 0 },
    'Etkinlik Katılımı': { total: 0, count: 0 },
    'Diğer Aktiviteler': { total: 0, count: 0 }
  };

  // Categorize points transactions
  pointsTransactions.forEach(transaction => {
    const reason = transaction.reason?.toLowerCase() || '';
    
    if (reason.includes('sohbet') || reason.includes('karakter') || reason.includes('eğitim')) {
      categories['Sohbet (Karakter Eğitimi)'].total += transaction.points;
      categories['Sohbet (Karakter Eğitimi)'].count += 1;
    } else if (reason.includes('atölye') || reason.includes('aktivite')) {
      categories['Atölye Faaliyetleri'].total += transaction.points;
      categories['Atölye Faaliyetleri'].count += 1;
    } else if (reason.includes('kitap') || reason.includes('okuma')) {
      categories['Kitap Okuma'].total += transaction.points;
      categories['Kitap Okuma'].count += 1;
    } else {
      categories['Diğer Aktiviteler'].total += transaction.points;
      categories['Diğer Aktiviteler'].count += 1;
    }
  });

  // Categorize event participations
  eventParticipations.forEach(participation => {
    const eventTitle = participation.event.title?.toLowerCase() || '';
    const eventTags = participation.event.tags || [];
    const eventPoints = participation.event.points || 0;

    // Try to categorize based on event title and tags
    if (eventTitle.includes('sohbet') || eventTitle.includes('karakter') || 
        eventTags.some((tag: string) => tag.toLowerCase().includes('sohbet') || tag.toLowerCase().includes('karakter'))) {
      categories['Sohbet (Karakter Eğitimi)'].total += eventPoints;
      categories['Sohbet (Karakter Eğitimi)'].count += 1;
    } else if (eventTitle.includes('atölye') || eventTitle.includes('workshop') || 
               eventTags.some((tag: string) => tag.toLowerCase().includes('atölye') || tag.toLowerCase().includes('workshop'))) {
      categories['Atölye Faaliyetleri'].total += eventPoints;
      categories['Atölye Faaliyetleri'].count += 1;
    } else if (eventTitle.includes('kitap') || eventTitle.includes('okuma') || 
               eventTags.some((tag: string) => tag.toLowerCase().includes('kitap') || tag.toLowerCase().includes('okuma'))) {
      categories['Kitap Okuma'].total += eventPoints;
      categories['Kitap Okuma'].count += 1;
    } else {
      categories['Etkinlik Katılımı'].total += eventPoints;
      categories['Etkinlik Katılımı'].count += 1;
    }
  });

  return categories;
} 