import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';
import { getActivePeriod } from '@/lib/periods';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admins can access summer school reports' },
        { status: 403 }
      );
    }

    // Get the active period - this will be the primary filter
    const activePeriod = await getActivePeriod();
    if (!activePeriod) {
      return NextResponse.json(
        { error: 'No active period found. Please activate a period first.' },
        { status: 400 }
      );
    }

    // Period-based filter for transactions
    const periodFilter = {
      periodId: activePeriod.id
    };

    // Legacy date filter (optional, can be removed if not needed)
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    // Get all tutors and their student counts
    const tutors = await prisma.user.findMany({
      where: {
        role: { in: [UserRole.TUTOR, UserRole.ASISTAN] }
      },
      include: {
        students: {
          where: {
            role: UserRole.STUDENT,
            isActive: true
          },
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            points: true,
            experience: true
          }
        },
        _count: {
          select: {
            students: true
          }
        }
      }
    });

    // Get all students with calculated stats from transactions
    const studentsRaw = await prisma.user.findMany({
      where: { role: UserRole.STUDENT },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
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

    const studentIds = studentsRaw.map(s => s.id);

    // Calculate actual points and experience from non-rolled-back transactions
    const allStudents = await Promise.all(
      studentsRaw.map(async (student) => {
        // Calculate points from non-rolled-back transactions in current period
        const studentPointsTransactions = await prisma.pointsTransaction.findMany({
          where: {
            studentId: student.id,
            type: 'AWARD',
            rolledBack: false,
            ...periodFilter,
            ...dateFilter
          },
          select: {
            points: true,
          },
        });

        const studentExperienceTransactions = await prisma.experienceTransaction.findMany({
          where: {
            studentId: student.id,
            rolledBack: false,
            ...periodFilter,
            ...dateFilter
          },
          select: {
            amount: true,
          },
        });

        const calculatedPoints = studentPointsTransactions.reduce(
          (sum, transaction) => sum + transaction.points,
          0
        );

        const experienceFromTransactions = studentExperienceTransactions.reduce(
          (sum, transaction) => sum + transaction.amount,
          0
        );

        // Also include experience from points transactions (when points were awarded, experience was also added)
        const experienceFromPoints = studentPointsTransactions.reduce(
          (sum, transaction) => sum + transaction.points,
          0
        );

        const calculatedExperience = experienceFromTransactions + experienceFromPoints;

        return {
          ...student,
          points: calculatedPoints,
          experience: calculatedExperience,
        };
      })
    );

    // Get all point transactions with details for current period
    const pointTransactions = await prisma.pointsTransaction.findMany({
      where: {
        studentId: { in: studentIds },
        type: 'AWARD',
        rolledBack: false,
        ...periodFilter,
        ...dateFilter
      },
      include: {
        student: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        tutor: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        pointReason: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get penalty transactions (negative points) for current period
    const penaltyTransactions = await prisma.pointsTransaction.findMany({
      where: {
        studentId: { in: studentIds },
        points: { lt: 0 },
        rolledBack: false,
        ...periodFilter,
        ...dateFilter
      },
      include: {
        student: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Get all point reasons for activity criteria
    const pointReasons = await prisma.pointReason.findMany({
      where: { isActive: true },
      include: {
        transactions: {
          where: {
            studentId: { in: studentIds },
            type: 'AWARD',
            rolledBack: false,
            ...periodFilter,
            ...dateFilter
          },
          include: {
            student: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    // Calculate statistics
    const totalStudents = allStudents.length;
    const totalTutors = tutors.length;
    const totalPointsDistributed = pointTransactions.reduce((sum, t) => sum + t.points, 0);
    const totalTransactions = pointTransactions.length;

    // Tutor statistics
    const tutorStats = tutors.map(tutor => ({
      id: tutor.id,
      name: tutor.firstName && tutor.lastName
        ? `${tutor.firstName} ${tutor.lastName}`
        : tutor.username,
      studentCount: tutor._count.students,
      students: tutor.students.map(s => {
        // Find the calculated student data
        const calculatedStudent = allStudents.find(cs => cs.id === s.id);
        return {
          id: s.id,
          name: s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : s.username,
          points: calculatedStudent?.points || s.points,
          experience: calculatedStudent?.experience || s.experience
        };
      })
    }));

    // Activity statistics by point reason with error tracking
    const activityStats = await Promise.all(
      pointReasons.map(async (reason) => {
        const transactions = reason.transactions;
        const uniqueStudents = new Set(transactions.map(t => t.studentId));
        const totalPoints = transactions.reduce((sum, t) => sum + t.points, 0);

        // Calculate error count (rolled back transactions) for current period
        const errorTransactions = await prisma.pointsTransaction.findMany({
          where: {
            studentId: { in: studentIds },
            type: 'AWARD',
            rolledBack: true,
            pointReasonId: reason.id,
            ...periodFilter,
            ...dateFilter
          }
        });

        return {
          name: reason.name,
          description: reason.description,
          participantCount: uniqueStudents.size,
          transactionCount: transactions.length,
          totalPointsDistributed: totalPoints,
          errorCount: errorTransactions.length,
          participants: Array.from(uniqueStudents).map(studentId => {
            const student = allStudents.find(s => s.id === studentId);
            const studentTransactions = transactions.filter(t => t.studentId === studentId);
            const hasMultipleTransactions = studentTransactions.length > 1;

            return {
              id: studentId,
              name: student?.firstName && student?.lastName
                ? `${student.firstName} ${student.lastName}`
                : student?.username || 'Unknown',
              transactionCount: studentTransactions.length,
              totalPoints: studentTransactions.reduce((sum, t) => sum + t.points, 0),
              hasMultipleTransactions
            };
          }).sort((a, b) => b.totalPoints - a.totalPoints),
          // Activity-specific insights
          insights: generateActivityInsights(reason.name, uniqueStudents.size, transactions.length, totalPoints)
        };
      })
    );

    const filteredActivityStats = activityStats.filter(activity => activity.participantCount > 0);

    // Top students by points
    const topStudentsByPoints = allStudents
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
      .map((student, index) => ({
        rank: index + 1,
        id: student.id,
        name: student.firstName && student.lastName
          ? `${student.firstName} ${student.lastName}`
          : student.username,
        points: student.points,
        experience: student.experience,
        tutor: student.tutor ?
          (student.tutor.firstName && student.tutor.lastName
            ? `${student.tutor.firstName} ${student.tutor.lastName}`
            : student.tutor.username)
          : 'Atanmamış'
      }));

    // Students with no points
    const studentsWithNoPoints = allStudents.filter(s => s.points === 0);
    const studentsWithLowPoints = allStudents.filter(s => s.points > 0 && s.points < 50);

    // Students by activity participation count
    const studentActivityCounts = allStudents.map(student => {
      const studentTransactions = pointTransactions.filter(t => t.studentId === student.id);
      const uniqueActivities = new Set(studentTransactions.map(t => t.pointReason?.name || 'Diğer'));

      return {
        id: student.id,
        name: student.firstName && student.lastName
          ? `${student.firstName} ${student.lastName}`
          : student.username,
        points: student.points,
        activityCount: uniqueActivities.size,
        transactionCount: studentTransactions.length
      };
    }).sort((a, b) => b.activityCount - a.activityCount);

    // Penalty statistics
    const penaltyStats = {
      totalPenalties: penaltyTransactions.length,
      totalStudentsPenalized: new Set(penaltyTransactions.map(t => t.studentId)).size,
      totalPointsDeducted: Math.abs(penaltyTransactions.reduce((sum, t) => sum + t.points, 0)),
      penalizedStudents: penaltyTransactions.map(t => ({
        studentName: t.student.firstName && t.student.lastName
          ? `${t.student.firstName} ${t.student.lastName}`
          : t.student.username,
        points: Math.abs(t.points),
        reason: t.reason || 'Uygunsuz davranış',
        date: t.createdAt
      }))
    };

    // Calculate averages and distributions
    const averagePointsPerStudent = Math.round(totalPointsDistributed / totalStudents);
    const highestEarningStudent = topStudentsByPoints[0];

    // Enhanced analytics: Activity diversity analysis
    const activityDiversityAnalysis = {
      highActivityLowPoints: studentActivityCounts
        .filter(s => s.activityCount >= 5 && s.points < 500)
        .map(s => ({
          name: s.name,
          activityCount: s.activityCount,
          points: s.points,
          tutor: allStudents.find(st => st.id === s.id)?.tutor ? 
            (allStudents.find(st => st.id === s.id)?.tutor?.firstName && allStudents.find(st => st.id === s.id)?.tutor?.lastName ?
              `${allStudents.find(st => st.id === s.id)?.tutor?.firstName} ${allStudents.find(st => st.id === s.id)?.tutor?.lastName}` :
              allStudents.find(st => st.id === s.id)?.tutor?.username) : 'Atanmamış'
        })),
      lowActivityHighPoints: studentActivityCounts
        .filter(s => s.activityCount <= 3 && s.points >= 1000)
        .map(s => ({
          name: s.name,
          activityCount: s.activityCount,
          points: s.points,
          tutor: allStudents.find(st => st.id === s.id)?.tutor ? 
            (allStudents.find(st => st.id === s.id)?.tutor?.firstName && allStudents.find(st => st.id === s.id)?.tutor?.lastName ?
              `${allStudents.find(st => st.id === s.id)?.tutor?.firstName} ${allStudents.find(st => st.id === s.id)?.tutor?.lastName}` :
              allStudents.find(st => st.id === s.id)?.tutor?.username) : 'Atanmamış'
        }))
    };

    // Enhanced penalty stats with tutor information
    const enhancedPenaltyStats = {
      ...penaltyStats,
      penalizedStudents: penaltyTransactions.map(t => ({
        studentName: t.student.firstName && t.student.lastName
          ? `${t.student.firstName} ${t.student.lastName}`
          : t.student.username,
        points: Math.abs(t.points),
        reason: t.reason || 'Uygunsuz davranış',
        date: t.createdAt,
        tutor: allStudents.find(s => s.id === t.studentId)?.tutor ? 
          (allStudents.find(s => s.id === t.studentId)?.tutor?.firstName && allStudents.find(s => s.id === t.studentId)?.tutor?.lastName ?
            `${allStudents.find(s => s.id === t.studentId)?.tutor?.firstName} ${allStudents.find(s => s.id === t.studentId)?.tutor?.lastName}` :
            allStudents.find(s => s.id === t.studentId)?.tutor?.username) : 'Atanmamış'
      }))
    };

    // Activity recommendations based on the manual report
    const activityRecommendations = [
      { activity: 'Yasin suresi ezberi', recommendation: 'AKADEMİ için düşünülebilir', studentCount: 0 },
      { activity: '40 Hadis ezberi', recommendation: 'İradesi biraz daha kuvvetli şeklinde düşünülebilir', studentCount: 0 },
      { activity: 'Namaz kıldırma ve müezzinlik yapma', recommendation: 'AKADEMİ için düşünülebilir', studentCount: 0 },
      { activity: 'Örnek davranış sergileme', recommendation: 'LİDER olarak yetiştirilebilir', studentCount: 0 },
      { activity: 'Özel günlerde yemek & ezan duası okumak', recommendation: 'Daha sosyal olduğu düşünülebilir', studentCount: 0 }
    ].map(rec => {
      const activity = filteredActivityStats.find(a => a.name.includes(rec.activity.split(' ')[0]));
      return {
        ...rec,
        studentCount: activity?.participantCount || 0
      };
    });

    // Detailed activity participation lists
    const detailedActivityParticipation = filteredActivityStats.map(activity => ({
      activityName: activity.name,
      students: activity.participants.map(p => ({
        id: p.id,
        name: p.name,
        tutor: allStudents.find(s => s.id === p.id)?.tutor ? 
          (allStudents.find(s => s.id === p.id)?.tutor?.firstName && allStudents.find(s => s.id === p.id)?.tutor?.lastName ?
            `${allStudents.find(s => s.id === p.id)?.tutor?.firstName} ${allStudents.find(s => s.id === p.id)?.tutor?.lastName}` :
            allStudents.find(s => s.id === p.id)?.tutor?.username) : 'Atanmamış',
        transactionCount: p.transactionCount,
        totalPoints: p.totalPoints,
        hasMultipleTransactions: p.hasMultipleTransactions
      }))
    }));

    // Error analysis
    const errorAnalysis = {
      totalErrors: filteredActivityStats.reduce((sum, activity) => sum + activity.errorCount, 0),
      errorBreakdown: filteredActivityStats
        .filter(activity => activity.errorCount > 0)
        .map(activity => ({
          activity: activity.name,
          errorCount: activity.errorCount,
          lastErrorDate: new Date().toISOString() // This would need to be calculated from actual error dates
        }))
    };

    const report = {
      metadata: {
        generatedAt: new Date(),
        periodInfo: {
          name: activePeriod.name,
          description: activePeriod.description,
          startDate: activePeriod.startDate.toISOString().split('T')[0],
          endDate: activePeriod.endDate ? activePeriod.endDate.toISOString().split('T')[0] : 'Devam ediyor'
        },
        dateRange: {
          start: startDate || activePeriod.startDate.toISOString().split('T')[0],
          end: endDate || (activePeriod.endDate ? activePeriod.endDate.toISOString().split('T')[0] : 'Devam ediyor')
        },
        totalStudents,
        totalTutors,
        totalPointsDistributed,
        totalTransactions,
        averagePointsPerStudent
      },
      tutorStats,
      activityStats: filteredActivityStats,
      topStudentsByPoints,
      studentActivityParticipation: studentActivityCounts.slice(0, 30),
      performanceAnalysis: {
        highestEarningStudent: highestEarningStudent ? {
          name: highestEarningStudent.name,
          points: highestEarningStudent.points,
          activities: pointTransactions
            .filter(t => t.studentId === highestEarningStudent.id)
            .reduce((acc, t) => {
              const activity = t.pointReason?.name || 'Diğer';
              acc[activity] = (acc[activity] || 0) + t.points;
              return acc;
            }, {} as Record<string, number>)
        } : null,
        passiveStudents: {
          noPoints: studentsWithNoPoints.length,
          lowPoints: studentsWithLowPoints.length,
          noPointsList: studentsWithNoPoints.map(s => ({
            name: s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : s.username,
            tutor: s.tutor ?
              (s.tutor.firstName && s.tutor.lastName
                ? `${s.tutor.firstName} ${s.tutor.lastName}`
                : s.tutor.username)
              : 'Atanmamış'
          })),
          lowPointsList: studentsWithLowPoints.map(s => ({
            name: s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : s.username,
            points: s.points,
            tutor: s.tutor ?
              (s.tutor.firstName && s.tutor.lastName
                ? `${s.tutor.firstName} ${s.tutor.lastName}`
                : s.tutor.username)
              : 'Atanmamış'
          }))
        },
        activityDiversityAnalysis
      },
      penaltyStats: enhancedPenaltyStats,
      insights: {
        mostPopularActivity: filteredActivityStats.length > 0 ?
          filteredActivityStats.reduce((prev, current) =>
            prev.participantCount > current.participantCount ? prev : current
          ).name : 'Veri yok',
        leastPopularActivity: filteredActivityStats.length > 0 ?
          filteredActivityStats.reduce((prev, current) =>
            prev.participantCount < current.participantCount ? prev : current
          ).name : 'Veri yok',
        averageActivitiesPerStudent: studentActivityCounts.length > 0 ?
          Math.round(studentActivityCounts.reduce((sum, s) => sum + s.activityCount, 0) / studentActivityCounts.length) : 0,
        activityRecommendations
      },
      detailedActivityParticipation,
      errorAnalysis
    };

    return NextResponse.json(report, { status: 200 });

  } catch (error: any) {
    console.error('Error generating summer school report:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateActivityInsights(activityName: string, participantCount: number, transactionCount: number, totalPoints: number): string[] {
  const insights: string[] = [];

  // Activity-specific insights based on the original report
  if (activityName.toLowerCase().includes('yasin')) {
    insights.push('Yasin suresini ezberleyen öğrenciler AKADEMİ için düşünülebilir');
  }

  if (activityName.toLowerCase().includes('40 hadis') || activityName.toLowerCase().includes('hadis')) {
    insights.push('40 Hadis ezberleyen öğrencilerin iradesi biraz daha kuvvetli şeklinde düşünülebilir');
  }

  if (activityName.toLowerCase().includes('namaz') && activityName.toLowerCase().includes('kıldır')) {
    insights.push('Namaz kıldıran öğrenciler AKADEMİ için düşünülebilir');
  }

  if (activityName.toLowerCase().includes('örnek davranış')) {
    insights.push('Örnek davranış sergileyen öğrenciler LİDER olarak yetiştirilebilir');
  }

  if (activityName.toLowerCase().includes('özel gün')) {
    insights.push('Özel günlerde yapılan etkinliklere katılan öğrencilerin daha sosyal olduğu düşünülebilir');
  }

  // General insights based on participation
  if (participantCount === 1) {
    insights.push('Sadece 1 öğrenci bu aktiviteden bilge para kazanmış');
  } else if (participantCount < 5) {
    insights.push('Zorlayıcı görev - çok az kişi tarafından yapılmış');
  } else if (participantCount > 30) {
    insights.push('Popüler aktivite - yüksek katılım');
  }

  // Transaction vs participant ratio insights
  if (transactionCount > participantCount * 1.5) {
    insights.push('Birden fazla işlem yapan öğrenciler var');
  }

  return insights;
}