const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🚨 DANGER: About to clear all database tables!');
  console.log('⚠️  Make sure you have a backup before proceeding!');
  console.log('');

  // Check if backup exists
  const fs = require('fs');
  const path = require('path');
  const backupDir = path.join(__dirname, '..', 'backups');

  if (fs.existsSync(backupDir)) {
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('bilgeverse-backup-') && file.endsWith('.json'));

    if (backupFiles.length > 0) {
      console.log(`✅ Found ${backupFiles.length} backup file(s)`);
      console.log(`📁 Latest backup: ${backupFiles.sort().reverse()[0]}`);
    } else {
      console.log('❌ No backup files found! ABORTING for safety.');
      return;
    }
  } else {
    console.log('❌ No backup directory found! ABORTING for safety.');
    return;
  }

  console.log('');
  console.log('🔄 Starting database cleanup...');

  try {
    // Clear tables in reverse dependency order (to handle foreign key constraints)
    console.log('🗑️  Clearing TransactionRollback...');
    const rollbackCount = await prisma.transactionRollback.deleteMany();
    console.log(`   Deleted ${rollbackCount.count} records`);

    console.log('🗑️  Clearing Announcement...');
    const announcementCount = await prisma.announcement.deleteMany();
    console.log(`   Deleted ${announcementCount.count} records`);

    console.log('🗑️  Clearing PointReason...');
    const pointReasonCount = await prisma.pointReason.deleteMany();
    console.log(`   Deleted ${pointReasonCount.count} records`);

    console.log('🗑️  Clearing PointEarningCard...');
    const pointCardCount = await prisma.pointEarningCard.deleteMany();
    console.log(`   Deleted ${pointCardCount.count} records`);

    console.log('🗑️  Clearing StudentReport...');
    const reportCount = await prisma.studentReport.deleteMany();
    console.log(`   Deleted ${reportCount.count} records`);

    console.log('🗑️  Clearing StudentNote...');
    const noteCount = await prisma.studentNote.deleteMany();
    console.log(`   Deleted ${noteCount.count} records`);

    console.log('🗑️  Clearing Wish...');
    const wishCount = await prisma.wish.deleteMany();
    console.log(`   Deleted ${wishCount.count} records`);

    console.log('🗑️  Clearing ExperienceTransaction...');
    const expCount = await prisma.experienceTransaction.deleteMany();
    console.log(`   Deleted ${expCount.count} records`);

    console.log('🗑️  Clearing PointsTransaction...');
    const pointsCount = await prisma.pointsTransaction.deleteMany();
    console.log(`   Deleted ${pointsCount.count} records`);

    console.log('🗑️  Clearing ItemRequest...');
    const itemRequestCount = await prisma.itemRequest.deleteMany();
    console.log(`   Deleted ${itemRequestCount.count} records`);

    console.log('🗑️  Clearing RegistrationRequest...');
    const regRequestCount = await prisma.registrationRequest.deleteMany();
    console.log(`   Deleted ${regRequestCount.count} records`);

    console.log('🗑️  Clearing StoreItem...');
    const storeItemCount = await prisma.storeItem.deleteMany();
    console.log(`   Deleted ${storeItemCount.count} records`);

    console.log('🗑️  Clearing EventParticipant...');
    const participantCount = await prisma.eventParticipant.deleteMany();
    console.log(`   Deleted ${participantCount.count} records`);

    console.log('🗑️  Clearing Event...');
    const eventCount = await prisma.event.deleteMany();
    console.log(`   Deleted ${eventCount.count} records`);

    console.log('🗑️  Clearing Classroom...');
    const classroomCount = await prisma.classroom.deleteMany();
    console.log(`   Deleted ${classroomCount.count} records`);

    console.log('🗑️  Clearing User...');
    const userCount = await prisma.user.deleteMany();
    console.log(`   Deleted ${userCount.count} records`);

    const totalDeleted = rollbackCount.count + announcementCount.count + pointReasonCount.count +
                        pointCardCount.count + reportCount.count + noteCount.count + wishCount.count +
                        expCount.count + pointsCount.count + itemRequestCount.count + regRequestCount.count +
                        storeItemCount.count + participantCount.count + eventCount.count +
                        classroomCount.count + userCount.count;

    console.log('');
    console.log('✅ Database cleanup completed successfully!');
    console.log(`🗑️  Total records deleted: ${totalDeleted}`);
    console.log('🆕 Your database is now clean and ready for fresh data');

    return {
      success: true,
      totalDeleted,
      deletedCounts: {
        users: userCount.count,
        classrooms: classroomCount.count,
        events: eventCount.count,
        eventParticipants: participantCount.count,
        storeItems: storeItemCount.count,
        registrationRequests: regRequestCount.count,
        itemRequests: itemRequestCount.count,
        pointsTransactions: pointsCount.count,
        experienceTransactions: expCount.count,
        wishes: wishCount.count,
        studentNotes: noteCount.count,
        studentReports: reportCount.count,
        pointEarningCards: pointCardCount.count,
        pointReasons: pointReasonCount.count,
        announcements: announcementCount.count,
        transactionRollbacks: rollbackCount.count
      }
    };

  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  clearDatabase()
    .then((result) => {
      console.log('🎉 Database cleanup process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database cleanup process failed:', error);
      process.exit(1);
    });
}

module.exports = { clearDatabase };