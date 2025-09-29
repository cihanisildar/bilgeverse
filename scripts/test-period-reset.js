const { PrismaClient, UserRole } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPeriodReset() {
  try {
    console.log('🔍 Testing period reset functionality...\n');

    // 1. Check current active period
    const activePeriod = await prisma.period.findFirst({
      where: { status: 'ACTIVE' }
    });

    console.log('📅 Current active period:', activePeriod?.name || 'None');

    // 2. Check current user points
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['STUDENT', 'TUTOR', 'ASISTAN'] }
      },
      select: {
        id: true,
        username: true,
        role: true,
        points: true,
        experience: true
      },
      orderBy: { points: 'desc' }
    });

    console.log('\n👥 Current user points:');
    users.forEach(user => {
      console.log(`  ${user.username} (${user.role}): ${user.points} points, ${user.experience} exp`);
    });

    // 3. Find a non-active period to test with
    const inactivePeriod = await prisma.period.findFirst({
      where: { status: { not: 'ACTIVE' } }
    });

    if (!inactivePeriod) {
      console.log('\n⚠️ No inactive period found to test with');
      return;
    }

    console.log(`\n🧪 Would test activation of period: ${inactivePeriod.name}`);
    console.log('Run this test after manually activating a period to see if points reset');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPeriodReset();