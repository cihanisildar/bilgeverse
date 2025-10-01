import prisma from '@/lib/prisma';

interface AttendanceCriteria {
  [key: string]: string | null;
}

/**
 * Calculate the attendance score for a weekly report
 * @param fixedCriteria Fixed criteria responses
 * @param variableCriteria Variable criteria responses
 * @returns Attendance score as percentage (0-100)
 */
export function calculateAttendanceScore(
  fixedCriteria: AttendanceCriteria | null,
  variableCriteria: AttendanceCriteria | null
): number {
  let totalCriteria = 0;
  let completedCriteria = 0;

  // Count fixed criteria
  if (fixedCriteria) {
    const fixedValues = Object.values(fixedCriteria).filter(v => v && v !== 'null');
    totalCriteria += fixedValues.length;
    completedCriteria += fixedValues.filter(v => v === "YAPILDI").length;
  }

  // Count variable criteria
  if (variableCriteria) {
    const variableValues = Object.values(variableCriteria).filter(v => v && v !== 'null');
    totalCriteria += variableValues.length;
    completedCriteria += variableValues.filter(v => v === "YAPILDI").length;
  }

  return totalCriteria > 0 ? Math.round((completedCriteria / totalCriteria) * 100) : 0;
}

/**
 * Calculate suggested points based on attendance score
 * @param attendanceScore Attendance score (0-100)
 * @param userRole User role (TUTOR or ASISTAN)
 * @returns Suggested points to award
 */
export function calculateSuggestedPoints(attendanceScore: number, userRole: string): number {
  // Base points for different roles
  const basePoints = userRole === "TUTOR" ? 15 : 10;

  // Calculate points based on attendance percentage
  if (attendanceScore >= 90) return basePoints;
  if (attendanceScore >= 80) return Math.round(basePoints * 0.8);
  if (attendanceScore >= 70) return Math.round(basePoints * 0.6);
  if (attendanceScore >= 60) return Math.round(basePoints * 0.4);
  if (attendanceScore >= 50) return Math.round(basePoints * 0.2);

  return 0; // No points for less than 50% attendance
}

/**
 * Get weekly report statistics for a period
 * @param periodId Period ID
 * @returns Report statistics
 */
export async function getWeeklyReportStats(periodId: string) {
  try {
    const period = await prisma.period.findUnique({
      where: { id: periodId },
      select: { totalWeeks: true },
    });

    const totalWeeks = period?.totalWeeks || 8;

    const reports = await prisma.weeklyReport.findMany({
      where: { periodId },
      include: {
        user: {
          select: {
            id: true,
            role: true,
            firstName: true,
            lastName: true,
            username: true,
          }
        }
      }
    });

    const stats = {
      total: reports.length,
      byStatus: {
        DRAFT: reports.filter(r => r.status === "DRAFT").length,
        SUBMITTED: reports.filter(r => r.status === "SUBMITTED").length,
        APPROVED: reports.filter(r => r.status === "APPROVED").length,
        REJECTED: reports.filter(r => r.status === "REJECTED").length,
      },
      byRole: {
        TUTOR: reports.filter(r => r.user.role === "TUTOR").length,
        ASISTAN: reports.filter(r => r.user.role === "ASISTAN").length,
      },
      byWeek: {} as Record<number, number>,
      totalPointsAwarded: reports.reduce((sum, r) => sum + r.pointsAwarded, 0),
      averageAttendance: 0,
    };

    // Calculate by week
    for (let week = 1; week <= totalWeeks; week++) {
      stats.byWeek[week] = reports.filter(r => r.weekNumber === week).length;
    }

    return stats;
  } catch (error) {
    console.error('Error calculating weekly report stats:', error);
    throw error;
  }
}

/**
 * Get tutor/asistan performance summary
 * @param userId User ID
 * @param periodId Period ID
 * @returns Performance summary
 */
export async function getTutorPerformanceSummary(userId: string, periodId: string) {
  try {
    const period = await prisma.period.findUnique({
      where: { id: periodId },
      select: { totalWeeks: true },
    });

    const totalWeeks = period?.totalWeeks || 8;

    const reports = await prisma.weeklyReport.findMany({
      where: {
        userId,
        periodId,
      },
      include: {
        fixedCriteria: true,
        variableCriteria: true,
      },
      orderBy: {
        weekNumber: 'asc',
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const summary = {
      user,
      totalReports: reports.length,
      submittedReports: reports.filter(r => r.status === "SUBMITTED" || r.status === "APPROVED" || r.status === "REJECTED").length,
      approvedReports: reports.filter(r => r.status === "APPROVED").length,
      totalPointsEarned: reports.reduce((sum, r) => sum + r.pointsAwarded, 0),
      averageAttendance: 0,
      weeklyProgress: [] as Array<{
        week: number;
        submitted: boolean;
        approved: boolean;
        attendanceScore: number;
        pointsAwarded: number;
      }>,
    };

    // Calculate weekly progress and average attendance
    let totalAttendanceScore = 0;
    let reportsWithAttendance = 0;

    for (let week = 1; week <= totalWeeks; week++) {
      const weekReport = reports.find(r => r.weekNumber === week);

      if (weekReport) {
        const attendanceScore = calculateAttendanceScore(
          weekReport.fixedCriteria as any,
          weekReport.variableCriteria as any
        );

        if (weekReport.status !== "DRAFT") {
          totalAttendanceScore += attendanceScore;
          reportsWithAttendance++;
        }

        summary.weeklyProgress.push({
          week,
          submitted: weekReport.status !== "DRAFT",
          approved: weekReport.status === "APPROVED",
          attendanceScore,
          pointsAwarded: weekReport.pointsAwarded,
        });
      } else {
        summary.weeklyProgress.push({
          week,
          submitted: false,
          approved: false,
          attendanceScore: 0,
          pointsAwarded: 0,
        });
      }
    }

    summary.averageAttendance = reportsWithAttendance > 0
      ? Math.round(totalAttendanceScore / reportsWithAttendance)
      : 0;

    return summary;
  } catch (error) {
    console.error('Error calculating tutor performance summary:', error);
    throw error;
  }
}

/**
 * Get all tutors/asistans performance for admin overview
 * @param periodId Period ID
 * @returns Array of performance summaries
 */
export async function getAllTutorPerformances(periodId: string) {
  try {
    // Get all tutors and asistans who have reports in this period
    const usersWithReports = await prisma.user.findMany({
      where: {
        role: { in: ["TUTOR", "ASISTAN"] },
        weeklyReports: {
          some: {
            periodId,
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
      },
    });

    // Get performance summary for each user
    const performances = await Promise.all(
      usersWithReports.map(user => getTutorPerformanceSummary(user.id, periodId))
    );

    // Sort by total points earned (descending)
    performances.sort((a, b) => b.totalPointsEarned - a.totalPointsEarned);

    return performances;
  } catch (error) {
    console.error('Error getting all tutor performances:', error);
    throw error;
  }
}