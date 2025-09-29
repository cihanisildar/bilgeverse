/**
 * Migration script to transition from a non-period system to a period-based system
 *
 * This script will:
 * 1. Create a "Legacy" period to contain all existing data
 * 2. Associate all existing transactions with this legacy period
 * 3. Optionally create a new active period
 *
 * Run this script AFTER applying the database migration that adds the Period model
 * and adds periodId fields to the relevant tables.
 */

const { PrismaClient, PeriodStatus } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToPeriods() {
  console.log('🚀 Starting migration to period-based system...');

  try {
    // Check if we already have periods
    const existingPeriods = await prisma.period.count();
    if (existingPeriods > 0) {
      console.log('⚠️  Periods already exist. Skipping migration.');
      return;
    }

    // Step 1: Create a legacy period for all existing data
    console.log('📅 Creating legacy period...');
    const legacyPeriod = await prisma.period.create({
      data: {
        name: 'Legacy Data',
        description: 'Contains all data from before the period system was implemented',
        startDate: new Date('2024-01-01'), // Adjust this date as needed
        endDate: new Date('2024-12-31'),   // Adjust this date as needed
        status: PeriodStatus.ARCHIVED
      }
    });
    console.log(`✅ Created legacy period: ${legacyPeriod.name} (ID: ${legacyPeriod.id})`);

    // Step 2: Count existing data
    const counts = {
      events: await prisma.event.count(),
      pointsTransactions: await prisma.pointsTransaction.count(),
      experienceTransactions: await prisma.experienceTransaction.count(),
      itemRequests: await prisma.itemRequest.count(),
      wishes: await prisma.wish.count(),
      studentNotes: await prisma.studentNote.count(),
      studentReports: await prisma.studentReport.count(),
      announcements: await prisma.announcement.count(),
      rollbacks: await prisma.transactionRollback.count()
    };

    console.log('📊 Existing data counts:', counts);

    // Step 3: Associate all existing data with the legacy period
    console.log('🔄 Migrating existing data to legacy period...');

    // Update events
    if (counts.events > 0) {
      await prisma.event.updateMany({
        data: { periodId: legacyPeriod.id }
      });
      console.log(`✅ Migrated ${counts.events} events`);
    }

    // Update points transactions
    if (counts.pointsTransactions > 0) {
      await prisma.pointsTransaction.updateMany({
        data: { periodId: legacyPeriod.id }
      });
      console.log(`✅ Migrated ${counts.pointsTransactions} points transactions`);
    }

    // Update experience transactions
    if (counts.experienceTransactions > 0) {
      await prisma.experienceTransaction.updateMany({
        data: { periodId: legacyPeriod.id }
      });
      console.log(`✅ Migrated ${counts.experienceTransactions} experience transactions`);
    }

    // Update item requests
    if (counts.itemRequests > 0) {
      await prisma.itemRequest.updateMany({
        data: { periodId: legacyPeriod.id }
      });
      console.log(`✅ Migrated ${counts.itemRequests} item requests`);
    }

    // Update wishes
    if (counts.wishes > 0) {
      await prisma.wish.updateMany({
        data: { periodId: legacyPeriod.id }
      });
      console.log(`✅ Migrated ${counts.wishes} wishes`);
    }

    // Update student notes
    if (counts.studentNotes > 0) {
      await prisma.studentNote.updateMany({
        data: { periodId: legacyPeriod.id }
      });
      console.log(`✅ Migrated ${counts.studentNotes} student notes`);
    }

    // Update student reports
    if (counts.studentReports > 0) {
      await prisma.studentReport.updateMany({
        data: { periodId: legacyPeriod.id }
      });
      console.log(`✅ Migrated ${counts.studentReports} student reports`);
    }

    // Update announcements
    if (counts.announcements > 0) {
      await prisma.announcement.updateMany({
        data: { periodId: legacyPeriod.id }
      });
      console.log(`✅ Migrated ${counts.announcements} announcements`);
    }

    // Update rollbacks
    if (counts.rollbacks > 0) {
      await prisma.transactionRollback.updateMany({
        data: { periodId: legacyPeriod.id }
      });
      console.log(`✅ Migrated ${counts.rollbacks} transaction rollbacks`);
    }

    // Step 4: Create a new active period (optional)
    console.log('📅 Creating new active period...');
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Determine semester
    let semesterName, startDate, endDate;
    if (currentMonth < 6) {
      // Spring semester
      semesterName = `${currentYear} Bahar Dönemi`;
      startDate = new Date(currentYear, 1, 1); // February 1st
      endDate = new Date(currentYear, 5, 30);  // June 30th
    } else {
      // Fall semester
      semesterName = `${currentYear} Güz Dönemi`;
      startDate = new Date(currentYear, 8, 1);  // September 1st
      endDate = new Date(currentYear, 11, 31); // December 31st
    }

    const activePeriod = await prisma.period.create({
      data: {
        name: semesterName,
        description: 'Aktif dönem - yeni veriler bu döneme kaydedilecek',
        startDate,
        endDate,
        status: PeriodStatus.ACTIVE
      }
    });
    console.log(`✅ Created active period: ${activePeriod.name} (ID: ${activePeriod.id})`);

    // Step 5: Reset user points and experience for the new period
    console.log('🔄 Resetting user points and experience for new period...');
    await prisma.user.updateMany({
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
    console.log('✅ Reset all user points and experience');

    console.log('🎉 Migration completed successfully!');
    console.log(`📊 Summary:
    - Legacy period created: "${legacyPeriod.name}"
    - Active period created: "${activePeriod.name}"
    - All existing data migrated to legacy period
    - User points and experience reset for new period
    `);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateToPeriods()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToPeriods };