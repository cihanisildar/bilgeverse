const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups');

  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, `bilgeverse-backup-${timestamp}.json`);

  console.log('🚀 Starting database backup...');
  console.log(`📁 Backup will be saved to: ${backupFile}`);

  try {
    // Get all data from all tables
    const data = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '2025-backup',
        description: 'Complete Bilgeverse database backup'
      },
      users: await prisma.user.findMany(),
      classrooms: await prisma.classroom.findMany(),
      events: await prisma.event.findMany(),
      eventParticipants: await prisma.eventParticipant.findMany(),
      storeItems: await prisma.storeItem.findMany(),
      registrationRequests: await prisma.registrationRequest.findMany(),
      itemRequests: await prisma.itemRequest.findMany(),
      pointsTransactions: await prisma.pointsTransaction.findMany(),
      experienceTransactions: await prisma.experienceTransaction.findMany(),
      wishes: await prisma.wish.findMany(),
      studentNotes: await prisma.studentNote.findMany(),
      studentReports: await prisma.studentReport.findMany(),
      pointEarningCards: await prisma.pointEarningCard.findMany(),
      pointReasons: await prisma.pointReason.findMany(),
      announcements: await prisma.announcement.findMany(),
      transactionRollbacks: await prisma.transactionRollback.findMany()
    };

    // Calculate record counts
    const counts = {};
    for (const [table, records] of Object.entries(data)) {
      if (table !== 'metadata') {
        counts[table] = Array.isArray(records) ? records.length : 0;
      }
    }

    data.metadata.recordCounts = counts;

    // Write backup file
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));

    console.log('✅ Backup completed successfully!');
    console.log('📊 Record counts:');
    for (const [table, count] of Object.entries(counts)) {
      console.log(`   ${table}: ${count} records`);
    }

    const fileSize = fs.statSync(backupFile).size;
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
    console.log(`📦 Backup file size: ${fileSizeMB} MB`);
    console.log(`💾 Backup saved to: ${backupFile}`);

    return { success: true, file: backupFile, counts, size: fileSizeMB };

  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run backup if this script is executed directly
if (require.main === module) {
  createBackup()
    .then((result) => {
      console.log('🎉 Backup process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Backup process failed:', error);
      process.exit(1);
    });
}

module.exports = { createBackup };