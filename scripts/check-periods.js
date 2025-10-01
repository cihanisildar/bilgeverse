/**
 * Check current period data and identify potential deletion issues
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPeriods() {
  console.log('🔍 Checking current period data...\n');

  try {
    // Get all periods with their related data counts
    const periods = await prisma.period.findMany({
      include: {
        _count: {
          select: {
            events: true,
            pointsTransactions: true,
            experienceTransactions: true,
            itemRequests: true,
            wishes: true,
            studentNotes: true,
            studentReports: true,
            announcements: true,
            rollbacks: true,
            weeklyReports: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (periods.length === 0) {
      console.log('📭 No periods found in database');
      return;
    }

    console.log(`📅 Found ${periods.length} period(s):\n`);

    for (const period of periods) {
      console.log(`📋 Period: ${period.name} (${period.status})`);
      console.log(`   ID: ${period.id}`);
      console.log(`   Description: ${period.description || 'No description'}`);
      console.log(`   Start: ${period.startDate.toISOString().split('T')[0]}`);
      console.log(`   End: ${period.endDate ? period.endDate.toISOString().split('T')[0] : 'No end date'}`);

      const counts = period._count;
      const totalRelatedData = Object.values(counts).reduce((sum, count) => sum + count, 0);

      console.log(`   📊 Related data (total: ${totalRelatedData}):`);
      console.log(`      Events: ${counts.events}`);
      console.log(`      Points Transactions: ${counts.pointsTransactions}`);
      console.log(`      Experience Transactions: ${counts.experienceTransactions}`);
      console.log(`      Item Requests: ${counts.itemRequests}`);
      console.log(`      Wishes: ${counts.wishes}`);
      console.log(`      Student Notes: ${counts.studentNotes}`);
      console.log(`      Student Reports: ${counts.studentReports}`);
      console.log(`      Announcements: ${counts.announcements}`);
      console.log(`      Rollbacks: ${counts.rollbacks}`);
      console.log(`      Weekly Reports: ${counts.weeklyReports}`);

      if (totalRelatedData === 0) {
        console.log(`   ✅ Period can be deleted (no related data)`);
      } else {
        console.log(`   ❌ Period cannot be deleted (has ${totalRelatedData} related records)`);

        // Show specific data that's blocking deletion
        const blockingData = [];
        if (counts.events > 0) blockingData.push(`${counts.events} events`);
        if (counts.pointsTransactions > 0) blockingData.push(`${counts.pointsTransactions} points transactions`);
        if (counts.experienceTransactions > 0) blockingData.push(`${counts.experienceTransactions} experience transactions`);
        if (counts.itemRequests > 0) blockingData.push(`${counts.itemRequests} item requests`);
        if (counts.wishes > 0) blockingData.push(`${counts.wishes} wishes`);
        if (counts.studentNotes > 0) blockingData.push(`${counts.studentNotes} student notes`);
        if (counts.studentReports > 0) blockingData.push(`${counts.studentReports} student reports`);
        if (counts.announcements > 0) blockingData.push(`${counts.announcements} announcements`);
        if (counts.rollbacks > 0) blockingData.push(`${counts.rollbacks} rollbacks`);
        if (counts.weeklyReports > 0) blockingData.push(`${counts.weeklyReports} weekly reports`);

        console.log(`   🚫 Blocking data: ${blockingData.join(', ')}`);
      }

      console.log(''); // Empty line for readability
    }

    // Check for orphaned/soft-deleted data that might not be properly cleaned up
    console.log('🔍 Checking for potential data inconsistencies...\n');

    // Check for events that might have been "deleted" but still exist
    const allEvents = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
        periodId: true,
        period: {
          select: { name: true }
        }
      }
    });

    console.log(`📝 Total events in database: ${allEvents.length}`);

    for (const period of periods) {
      const periodEvents = allEvents.filter(event => event.periodId === period.id);
      if (periodEvents.length > 0) {
        console.log(`   ${period.name}: ${periodEvents.length} events`);
        periodEvents.forEach(event => {
          console.log(`     - ${event.title} (${event.id})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error checking periods:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  checkPeriods()
    .then(() => {
      console.log('✅ Period check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Period check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkPeriods };