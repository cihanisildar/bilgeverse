/**
 * Setup script to create an active period for the current semester
 * and reset user points/experience for the fresh start
 */

const { PrismaClient, PeriodStatus } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupCurrentPeriod() {
  console.log('🚀 Setting up current active period...');

  try {
    // Check if there's already an active period
    const existingActivePeriod = await prisma.period.findFirst({
      where: { status: PeriodStatus.ACTIVE }
    });

    if (existingActivePeriod) {
      console.log(`⚠️  Active period already exists: "${existingActivePeriod.name}"`);
      console.log('Skipping setup. Use the admin panel to manage periods.');
      return;
    }

    // Create a new active period for current semester
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Determine semester based on current date
    let semesterName, startDate, endDate;
    if (currentMonth >= 8) {
      // Fall semester (September - December)
      semesterName = `${currentYear}-${currentYear + 1} Güz Dönemi`;
      startDate = new Date(currentYear, 8, 1);  // September 1st
      endDate = new Date(currentYear + 1, 0, 31); // January 31st next year
    } else if (currentMonth >= 1 && currentMonth <= 5) {
      // Spring semester (February - June)
      semesterName = `${currentYear - 1}-${currentYear} Bahar Dönemi`;
      startDate = new Date(currentYear, 1, 1);  // February 1st
      endDate = new Date(currentYear, 5, 30);   // June 30th
    } else {
      // Summer period (July - August)
      semesterName = `${currentYear} Yaz Dönemi`;
      startDate = new Date(currentYear, 6, 1);  // July 1st
      endDate = new Date(currentYear, 7, 31);   // August 31st
    }

    console.log(`📅 Creating active period: "${semesterName}"`);

    const activePeriod = await prisma.period.create({
      data: {
        name: semesterName,
        description: `Aktif akademik dönem - ${startDate.toLocaleDateString('tr-TR')} ile ${endDate.toLocaleDateString('tr-TR')} arası`,
        startDate,
        endDate,
        status: PeriodStatus.ACTIVE
      }
    });

    console.log(`✅ Created active period: ${activePeriod.name} (ID: ${activePeriod.id})`);

    // Reset user points and experience for fresh start
    console.log('🔄 Resetting user points and experience for new period...');

    const updateResult = await prisma.user.updateMany({
      where: {
        role: {
          in: ['STUDENT', 'TUTOR', 'ASISTAN']
        }
      },
      data: {
        points: 0,
        experience: 0
      }
    });

    console.log(`✅ Reset points and experience for ${updateResult.count} users`);

    // Show period summary
    const allPeriods = await prisma.period.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            events: true,
            pointsTransactions: true,
            experienceTransactions: true
          }
        }
      }
    });

    console.log('\n📊 Period Summary:');
    allPeriods.forEach(period => {
      const status = period.status === 'ACTIVE' ? '🟢' : period.status === 'INACTIVE' ? '🟡' : '🔵';
      console.log(`${status} ${period.name} (${period.status})`);
      console.log(`   📍 ${period.startDate.toLocaleDateString('tr-TR')} - ${period.endDate?.toLocaleDateString('tr-TR') || 'Açık'}`);
      console.log(`   📊 ${period._count.events} etkinlik, ${period._count.pointsTransactions} puan işlemi, ${period._count.experienceTransactions} deneyim işlemi`);
    });

    console.log('\n🎉 Period setup completed successfully!');
    console.log(`✅ Active period: "${activePeriod.name}"`);
    console.log('✅ User data reset for fresh start');
    console.log('✅ Ready to use the period system');

    console.log('\n📝 Next steps:');
    console.log('1. Visit /admin/periods to manage periods');
    console.log('2. Start awarding points and experience in the new period');
    console.log('3. Historical data remains accessible in archived periods');

  } catch (error) {
    console.error('❌ Period setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupCurrentPeriod()
    .then(() => {
      console.log('\n✅ Period setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Period setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupCurrentPeriod };