const fs = require('fs');
const path = require('path');

function verifyBackup(backupFile) {
  console.log('🔍 Verifying backup integrity...');
  console.log(`📁 Backup file: ${backupFile}`);

  try {
    // Check if file exists
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    // Check file size
    const stats = fs.statSync(backupFile);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`📦 File size: ${fileSizeMB} MB`);

    if (stats.size === 0) {
      throw new Error('Backup file is empty');
    }

    // Parse JSON
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    // Verify structure
    if (!backupData.metadata) {
      throw new Error('Missing metadata in backup');
    }

    if (!backupData.metadata.timestamp) {
      throw new Error('Missing timestamp in metadata');
    }

    if (!backupData.metadata.recordCounts) {
      throw new Error('Missing record counts in metadata');
    }

    // Verify each table exists and has expected structure
    const expectedTables = [
      'users', 'classrooms', 'events', 'eventParticipants', 'storeItems',
      'registrationRequests', 'itemRequests', 'pointsTransactions',
      'experienceTransactions', 'wishes', 'studentNotes', 'studentReports',
      'pointEarningCards', 'pointReasons', 'announcements', 'transactionRollbacks'
    ];

    let totalRecords = 0;
    for (const table of expectedTables) {
      if (!Array.isArray(backupData[table])) {
        throw new Error(`Table ${table} is missing or not an array`);
      }

      const actualCount = backupData[table].length;
      const expectedCount = backupData.metadata.recordCounts[table];

      if (actualCount !== expectedCount) {
        throw new Error(`Record count mismatch for ${table}: expected ${expectedCount}, got ${actualCount}`);
      }

      totalRecords += actualCount;
      console.log(`✅ ${table}: ${actualCount} records`);
    }

    // Additional data validation for critical tables
    if (backupData.users.length > 0) {
      const sampleUser = backupData.users[0];
      const requiredUserFields = ['id', 'username', 'email', 'role'];
      for (const field of requiredUserFields) {
        if (!sampleUser.hasOwnProperty(field)) {
          throw new Error(`User record missing required field: ${field}`);
        }
      }
    }

    console.log('✅ All data integrity checks passed!');
    console.log(`📊 Total records: ${totalRecords}`);
    console.log(`⏰ Backup timestamp: ${backupData.metadata.timestamp}`);

    return {
      success: true,
      fileSizeMB,
      totalRecords,
      timestamp: backupData.metadata.timestamp,
      recordCounts: backupData.metadata.recordCounts
    };

  } catch (error) {
    console.error('❌ Backup verification failed:', error.message);
    throw error;
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  const backupDir = path.join(__dirname, '..', 'backups');

  // Find the most recent backup file
  const backupFiles = fs.readdirSync(backupDir)
    .filter(file => file.startsWith('bilgeverse-backup-') && file.endsWith('.json'))
    .sort()
    .reverse();

  if (backupFiles.length === 0) {
    console.error('❌ No backup files found');
    process.exit(1);
  }

  const mostRecentBackup = path.join(backupDir, backupFiles[0]);

  try {
    const result = verifyBackup(mostRecentBackup);
    console.log('🎉 Backup verification completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Backup verification failed:', error);
    process.exit(1);
  }
}

module.exports = { verifyBackup };