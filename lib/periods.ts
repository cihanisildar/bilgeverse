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
 * Reusable Prisma `where` fragment for listing students who are members of a
 * given period AND have not been soft-deleted.
 *
 * Use this for CURRENT/operational student listings (active period). Spread it
 * into a `where` that already targets `role: STUDENT`:
 *   where: { role: UserRole.STUDENT, ...periodStudentWhere(activePeriod.id) }
 *
 * For purely historical, period-scoped reports (a specific past periodId), do
 * NOT use this helper — filter only by `studentPeriods: { some: { periodId } }`
 * and omit the `deletedAt` filter, so soft-deleted students still appear in the
 * past data they belonged to.
 */
export function periodStudentWhere(periodId: string) {
  return {
    deletedAt: null,
    studentPeriods: { some: { periodId } },
  };
}

/**
 * Reusable Prisma `where` fragment for listing store items visible in a period.
 * Includes items belonging to the given period plus legacy items that predate
 * period-scoping (periodId === null), so old data keeps showing.
 * @param periodId The active period id (or null/undefined to only show legacy items)
 * @param opts.onlyActive When true, hides passive (soft-deleted) items — use for student/tutor storefront
 */
export function storeItemWhere(periodId?: string | null, opts?: { onlyActive?: boolean }) {
  const periodClause = periodId
    ? { OR: [{ periodId }, { periodId: null }] }
    : { periodId: null };
  return {
    ...(opts?.onlyActive ? { isActive: true } : {}),
    ...periodClause,
  };
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