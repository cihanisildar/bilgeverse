/**
 * Quick script to activate an existing period
 */

const { PrismaClient, PeriodStatus } = require('@prisma/client');

const prisma = new PrismaClient();

async function activateExistingPeriod() {
  console.log('🔄 Activating existing period...');

  try {
    // Find the current semester period
    const currentPeriod = await prisma.period.findFirst({
      where: {
        name: { contains: '2025-2026 Güz Dönemi' }
      }
    });

    if (currentPeriod) {
      // Deactivate all other periods
      await prisma.period.updateMany({
        where: { status: PeriodStatus.ACTIVE },
        data: { status: PeriodStatus.INACTIVE }
      });

      // Activate the current period
      await prisma.period.update({
        where: { id: currentPeriod.id },
        data: { status: PeriodStatus.ACTIVE }
      });

      console.log(`✅ Activated period: ${currentPeriod.name}`);

      const activePeriod = await prisma.period.findFirst({
        where: { status: PeriodStatus.ACTIVE }
      });

      console.log(`🟢 Current active period: ${activePeriod?.name}`);
    } else {
      console.log('❌ Period not found');
    }

  } catch (error) {
    console.error('❌ Failed to activate period:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateExistingPeriod();