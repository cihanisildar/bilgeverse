// Commands to explore your data:
// - node scripts/view-backup-data.js - Shows all tables summary
// - node scripts/view-backup-data.js users 5 - Shows first 5 users
// - node scripts/view-backup-data.js pointsTransactions 10 - Shows
// transactions
// - node scripts/view-backup-data.js wishes - Shows all wishesconst
 fs = require('fs');
const path = require('path');

function viewBackupData(backupFile, table = null, limit = 10) {
  try {
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    console.log('🗂️  Backup Data Viewer');
    console.log('='.repeat(50));
    console.log(`📅 Backup Date: ${new Date(backupData.metadata.timestamp).toLocaleString()}`);
    console.log(`📊 Total Tables: ${Object.keys(backupData.metadata.recordCounts).length}`);
    console.log('');

    if (table) {
      // Show specific table
      if (!backupData[table]) {
        console.error(`❌ Table '${table}' not found`);
        return;
      }

      console.log(`📋 Table: ${table} (${backupData[table].length} records)`);
      console.log('-'.repeat(50));

      if (backupData[table].length === 0) {
        console.log('No records found');
        return;
      }

      // Show sample records
      const records = backupData[table].slice(0, limit);
      records.forEach((record, index) => {
        console.log(`\n[${index + 1}]`, JSON.stringify(record, null, 2));
      });

      if (backupData[table].length > limit) {
        console.log(`\n... and ${backupData[table].length - limit} more records`);
      }

    } else {
      // Show all tables summary
      console.log('📋 Tables Summary:');
      console.log('-'.repeat(50));

      for (const [tableName, count] of Object.entries(backupData.metadata.recordCounts)) {
        console.log(`${tableName.padEnd(25)}: ${count.toString().padStart(6)} records`);
      }

      console.log('\n💡 Usage:');
      console.log('node scripts/view-backup-data.js [table_name] [limit]');
      console.log('Examples:');
      console.log('  node scripts/view-backup-data.js users 5');
      console.log('  node scripts/view-backup-data.js pointsTransactions 3');
    }

  } catch (error) {
    console.error('❌ Error reading backup:', error.message);
  }
}

// Command line usage
if (require.main === module) {
  const backupDir = path.join(__dirname, '..', 'backups');

  // Find most recent backup
  const backupFiles = fs.readdirSync(backupDir)
    .filter(file => file.startsWith('bilgeverse-backup-') && file.endsWith('.json'))
    .sort()
    .reverse();

  if (backupFiles.length === 0) {
    console.error('❌ No backup files found');
    process.exit(1);
  }

  const backupFile = path.join(backupDir, backupFiles[0]);
  const table = process.argv[2];
  const limit = parseInt(process.argv[3]) || 10;

  viewBackupData(backupFile, table, limit);
}

module.exports = { viewBackupData };

