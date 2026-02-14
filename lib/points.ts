import prisma from '@/lib/prisma';
import { TransactionType } from '@prisma/client';
import { getActivePeriod } from './periods';

/**
 * Calculate current points for a user based on transactions in the active period
 * @param userId The user ID
 * @param periodId Optional specific period ID (defaults to active period)
 * @returns Current points for the user in the specified period
 */
export async function calculateUserPoints(userId: string, periodId?: string): Promise<number> {
  try {
    // Use provided periodId or get active period
    let targetPeriodId = periodId;
    if (!targetPeriodId) {
      const activePeriod = await getActivePeriod();
      if (!activePeriod) {
        return 0; // No active period, no points
      }
      targetPeriodId = activePeriod.id;
    }

    // Get all non-rolled-back transactions for the user in the period
    const transactions = await prisma.pointsTransaction.findMany({
      where: {
        studentId: userId,
        periodId: targetPeriodId,
        rolledBack: false
      },
      select: {
        points: true,
        type: true
      }
    });

    // Calculate total points
    const totalPoints = transactions.reduce((sum, transaction) => {
      if (transaction.type === TransactionType.AWARD) {
        return sum + transaction.points;
      } else if (transaction.type === TransactionType.REDEEM) {
        return sum - transaction.points;
      }
      return sum;
    }, 0);

    return Math.max(0, totalPoints); // Ensure points don't go negative
  } catch (error) {
    console.error('Error calculating user points:', error);
    return 0;
  }
}

/**
 * Calculate current experience for a user based on transactions in the active period
 * @param userId The user ID
 * @param periodId Optional specific period ID (defaults to active period)
 * @returns Current experience for the user in the specified period
 */
export async function calculateUserExperience(userId: string, periodId?: string): Promise<number> {
  try {
    // Use provided periodId or get active period
    let targetPeriodId = periodId;
    if (!targetPeriodId) {
      const activePeriod = await getActivePeriod();
      if (!activePeriod) {
        return 0; // No active period, no experience
      }
      targetPeriodId = activePeriod.id;
    }

    // Get experience from experience transactions
    const experienceTransactions = await prisma.experienceTransaction.findMany({
      where: {
        studentId: userId,
        periodId: targetPeriodId,
        rolledBack: false
      },
      select: {
        amount: true
      }
    });

    // Get experience from points transactions (when points were awarded, experience was also added)
    const pointsTransactions = await prisma.pointsTransaction.findMany({
      where: {
        studentId: userId,
        periodId: targetPeriodId,
        type: TransactionType.AWARD,
        rolledBack: false
      },
      select: {
        points: true
      }
    });

    const experienceFromTransactions = experienceTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

    const experienceFromPoints = pointsTransactions.reduce(
      (sum, transaction) => sum + transaction.points,
      0
    );

    return experienceFromTransactions + experienceFromPoints;
  } catch (error) {
    console.error('Error calculating user experience:', error);
    return 0;
  }
}

/**
 * Calculate experience for multiple users efficiently using batch queries
 * @param userIds Array of user IDs
 * @param periodId Optional specific period ID (defaults to active period)
 * @returns Map of userId to experience
 */
export async function calculateMultipleUserExperience(userIds: string[], periodId?: string): Promise<Map<string, number>> {
  try {
    // Use provided periodId or get active period
    let targetPeriodId = periodId;
    if (!targetPeriodId) {
      const activePeriod = await getActivePeriod();
      if (!activePeriod) {
        return new Map(); // No active period, no experience
      }
      targetPeriodId = activePeriod.id;
    }

    // Get all experience transactions for all users in a single query
    const experienceTransactions = await prisma.experienceTransaction.findMany({
      where: {
        studentId: { in: userIds },
        periodId: targetPeriodId,
        rolledBack: false
      },
      select: {
        studentId: true,
        amount: true
      }
    });

    // Get all points transactions for all users in a single query
    const pointsTransactions = await prisma.pointsTransaction.findMany({
      where: {
        studentId: { in: userIds },
        periodId: targetPeriodId,
        type: TransactionType.AWARD,
        rolledBack: false
      },
      select: {
        studentId: true,
        points: true
      }
    });

    // Initialize all users with 0 experience
    const userExperienceMap = new Map<string, number>();
    userIds.forEach(userId => userExperienceMap.set(userId, 0));

    // Calculate experience from experience transactions
    experienceTransactions.forEach(transaction => {
      const currentExperience = userExperienceMap.get(transaction.studentId) || 0;
      userExperienceMap.set(transaction.studentId, currentExperience + transaction.amount);
    });

    // Calculate experience from points transactions (points = experience)
    pointsTransactions.forEach(transaction => {
      const currentExperience = userExperienceMap.get(transaction.studentId) || 0;
      userExperienceMap.set(transaction.studentId, currentExperience + transaction.points);
    });

    return userExperienceMap;
  } catch (error) {
    console.error('Error calculating multiple user experience:', error);
    return new Map();
  }
}

/**
 * Calculate points for multiple users efficiently
 * @param userIds Array of user IDs
 * @param periodId Optional specific period ID (defaults to active period)
 * @returns Map of userId to points
 */
export async function calculateMultipleUserPoints(userIds: string[], periodId?: string): Promise<Map<string, number>> {
  try {
    // Use provided periodId or get active period
    let targetPeriodId = periodId;
    if (!targetPeriodId) {
      const activePeriod = await getActivePeriod();
      if (!activePeriod) {
        return new Map(); // No active period, no points
      }
      targetPeriodId = activePeriod.id;
    }

    // Get all transactions for the users in the period
    const transactions = await prisma.pointsTransaction.findMany({
      where: {
        studentId: { in: userIds },
        periodId: targetPeriodId,
        rolledBack: false
      },
      select: {
        studentId: true,
        points: true,
        type: true
      }
    });

    // Group transactions by user and calculate points
    const userPointsMap = new Map<string, number>();

    // Initialize all users with 0 points
    userIds.forEach(userId => userPointsMap.set(userId, 0));

    // Calculate points from transactions
    transactions.forEach(transaction => {
      const currentPoints = userPointsMap.get(transaction.studentId) || 0;
      if (transaction.type === TransactionType.AWARD) {
        userPointsMap.set(transaction.studentId, currentPoints + transaction.points);
      } else if (transaction.type === TransactionType.REDEEM) {
        userPointsMap.set(transaction.studentId, Math.max(0, currentPoints - transaction.points));
      }
    });

    return userPointsMap;
  } catch (error) {
    console.error('Error calculating multiple user points:', error);
    return new Map();
  }
}

/**
 * Get user with calculated points and experience for the current period
 * @param userId The user ID
 * @param periodId Optional specific period ID (defaults to active period)
 * @returns User data with calculated points and experience
 */
export async function getUserWithCalculatedStats(userId: string, periodId?: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        roles: true,
        avatarUrl: true,
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

    if (!user) {
      return null;
    }

    const [calculatedPoints, calculatedExperience] = await Promise.all([
      calculateUserPoints(userId, periodId),
      calculateUserExperience(userId, periodId)
    ]);

    return {
      ...user,
      points: calculatedPoints,
      experience: calculatedExperience
    };
  } catch (error) {
    console.error('Error getting user with calculated stats:', error);
    return null;
  }
}