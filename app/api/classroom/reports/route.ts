import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can access class reports' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get('classroomId');
    if (!classroomId) {
      return NextResponse.json(
        { error: 'Classroom ID is required' },
        { status: 400 }
      );
    }

    // Get classroom info and students
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        students: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            points: true,
            experience: true
          }
        },
        tutor: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    if (!classroom) {
      return NextResponse.json(
        { error: 'Classroom not found' },
        { status: 404 }
      );
    }
    const students = classroom.students;
    if (students.length === 0) {
      return NextResponse.json({
        classroom,
        totalStudents: 0,
        totalPoints: 0,
        totalExperience: 0,
        activityDistribution: [],
        averagePointsPerStudent: 0,
        averageExperiencePerStudent: 0,
        students: [],
      }, { status: 200 });
    }
    const studentIds = students.map(s => s.id);
    // Points transactions
    const pointsTransactions = await prisma.pointsTransaction.findMany({
      where: {
        studentId: { in: studentIds },
        type: 'AWARD',
        rolledBack: false
      },
      include: {
        pointReason: true
      }
    });
    // Experience transactions
    const experienceTransactions = await prisma.experienceTransaction.findMany({
      where: {
        studentId: { in: studentIds },
        rolledBack: false
      },
      select: {
        amount: true,
        createdAt: true
      }
    });
    // Event participations
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
            tags: true,
            createdById: true,
            createdForTutorId: true
          }
        }
      }
    });

    // Get tutor's events and their statistics
    const tutorEvents = classroom.tutor ? await prisma.event.findMany({
      where: {
        OR: [
          { createdById: classroom.tutor.id },
          { createdForTutorId: classroom.tutor.id }
        ]
      },
      include: {
        participants: {
          where: {
            status: 'ATTENDED'
          }
        }
      }
    }) : [];

    const eventStats = {
      totalEvents: tutorEvents.length,
      totalAttendances: tutorEvents.reduce((sum, event) => sum + event.participants.length, 0),
      averageAttendancePerEvent: tutorEvents.length > 0 ? Math.round(tutorEvents.reduce((sum, event) => sum + event.participants.length, 0) / tutorEvents.length) : 0
    };
    // Aggregates
    const totalPoints = students.reduce((sum, student) => sum + student.points, 0);
    const totalExperience = students.reduce((sum, student) => sum + student.experience, 0);
    const totalPointsFromEvents = eventParticipations.reduce((sum, participation) => sum + (participation.event.points || 0), 0);
    const totalPointsFromTransactions = pointsTransactions.reduce((sum, transaction) => sum + transaction.points, 0);
    const totalExperienceFromTransactions = experienceTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    // Categorize points by activity type
    const activityCategories = categorizeAllPointsByActivity(pointsTransactions, eventParticipations);
    const totalAllPoints = totalPointsFromEvents + totalPointsFromTransactions;
    const activityDistribution = Object.entries(activityCategories).map(([category, data]) => ({
      name: category,
      value: data.total,
      percentage: totalAllPoints > 0 ? Math.round((data.total / totalAllPoints) * 100) : 0,
      count: data.count
    })).filter(item => item.value > 0);
    // Averages
    const averagePointsPerStudent = Math.round(totalPoints / students.length);
    const averageExperiencePerStudent = Math.round(totalExperience / students.length);
    // Per-student stats
    const studentStats = students.map(student => ({
      id: student.id,
      name: student.firstName && student.lastName ? `${student.firstName} ${student.lastName}` : student.username,
      points: student.points,
      experience: student.experience
    }));
    // Get detailed points and experience lists
    const pointsList = pointsTransactions.map(transaction => ({
      points: transaction.points,
      reason: transaction.pointReason?.name || 'Diğer Aktiviteler',
      date: transaction.createdAt
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const experienceList = experienceTransactions.map(transaction => ({
      amount: transaction.amount,
      date: transaction.createdAt
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      classroom,
      totalStudents: students.length,
      totalPoints,
      totalExperience,
      totalPointsEarned: totalPointsFromEvents + totalPointsFromTransactions,
      totalExperienceEarned: totalExperienceFromTransactions,
      activityDistribution,
      averagePointsPerStudent,
      averageExperiencePerStudent,
      students: studentStats,
      eventStats,
      pointsList,
      experienceList
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching classroom report:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function categorizeAllPointsByActivity(pointsTransactions: any[], eventParticipations: any[]) {
  const categories: { [key: string]: { total: number; count: number } } = {};
  pointsTransactions.forEach(transaction => {
    const reasonName = transaction.pointReason?.name || 'Diğer Aktiviteler';
    if (!categories[reasonName]) {
      categories[reasonName] = { total: 0, count: 0 };
    }
    categories[reasonName].total += transaction.points;
    categories[reasonName].count += 1;
  });
  eventParticipations.forEach(participation => {
    const eventTitle = participation.event.title?.toLowerCase() || '';
    const eventTags = participation.event.tags || [];
    const eventPoints = participation.event.points || 0;
    if (!categories['Etkinlik Katılımı']) {
      categories['Etkinlik Katılımı'] = { total: 0, count: 0 };
    }
    categories['Etkinlik Katılımı'].total += eventPoints;
    categories['Etkinlik Katılımı'].count += 1;
  });
  return categories;
} 