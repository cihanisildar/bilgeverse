const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyEmptyDatabase() {
  console.log('🔍 Verifying database is empty...');
  console.log('');

  try {
    const counts = {
      users: await prisma.user.count(),
      classrooms: await prisma.classroom.count(),
      events: await prisma.event.count(),
      eventParticipants: await prisma.eventParticipant.count(),
      storeItems: await prisma.storeItem.count(),
      registrationRequests: await prisma.registrationRequest.count(),
      itemRequests: await prisma.itemRequest.count(),
      pointsTransactions: await prisma.pointsTransaction.count(),
      experienceTransactions: await prisma.experienceTransaction.count(),
      wishes: await prisma.wish.count(),
      studentNotes: await prisma.studentNote.count(),
      studentReports: await prisma.studentReport.count(),
      pointEarningCards: await prisma.pointEarningCard.count(),
      pointReasons: await prisma.pointReason.count(),
      announcements: await prisma.announcement.count(),
      transactionRollbacks: await prisma.transactionRollback.count()
    };

    let totalRecords = 0;
    let allEmpty = true;

    console.log('📊 Current record counts:');
    console.log('-'.repeat(40));

    for (const [table, count] of Object.entries(counts)) {
      const status = count === 0 ? '✅' : '❌';
      console.log(`${status} ${table.padEnd(25)}: ${count.toString().padStart(6)} records`);
      totalRecords += count;
      if (count > 0) allEmpty = false;
    }

    console.log('-'.repeat(40));
    console.log(`📈 Total records remaining: ${totalRecords}`);
    console.log('');

    if (allEmpty) {
      console.log('✅ SUCCESS: All tables are empty!');
      console.log('🆕 Database is ready for fresh data');
    } else {
      console.log('❌ WARNING: Some tables still contain data!');
      console.log('🔄 You may need to run the cleanup script again');
    }

    return { success: allEmpty, totalRecords, counts };

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  verifyEmptyDatabase()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyEmptyDatabase };