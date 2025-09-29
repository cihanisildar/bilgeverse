import prisma from '@/lib/prisma';
import { PeriodStatus } from '@prisma/client';

/**
 * Get the currently active period
 * @returns The active period or null if none exists
 */
export async function getActivePeriod() {
  try {
    const activePeriod = await prisma.period.findFirst({
      where: { status: PeriodStatus.ACTIVE }
    });

    return activePeriod;
  } catch (error) {
    console.error('Error fetching active period:', error);
    return null;
  }
}

/**
 * Ensure there is an active period, throw error if not
 * @returns The active period
 * @throws Error if no active period exists
 */
export async function requireActivePeriod() {
  const activePeriod = await getActivePeriod();

  if (!activePeriod) {
    throw new Error('No active period found. Please activate a period first.');
  }

  return activePeriod;
}

/**
 * Get period by ID
 * @param periodId The period ID
 * @returns The period or null if not found
 */
export async function getPeriodById(periodId: string) {
  try {
    const period = await prisma.period.findUnique({
      where: { id: periodId }
    });

    return period;
  } catch (error) {
    console.error('Error fetching period by ID:', error);
    return null;
  }
}