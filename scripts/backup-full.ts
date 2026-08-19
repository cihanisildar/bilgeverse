/**
 * TAM veritabanı yedeği — şemadaki HER tabloyu dışa aktarır.
 *
 *   npx tsx scripts/backup-full.ts
 *
 * Mevcut `backup-database-2025.js` yalnızca 16 tabloyu kapsıyor (part1-6 ve
 * part8-11'in tamamı eksik). Bu script tablo listesini `pg_tables`'tan okur.
 *
 * Neden Prisma client değil de HAM SQL: yedek çoğu zaman bir şema
 * değişikliğinden HEMEN ÖNCE alınır. O anda üretilmiş client yeni şemayı
 * bilir ama veritabanı bilmez; `findMany()` var olmayan kolonları SELECT
 * etmeye çalışıp patlar. Ham `SELECT *` veritabanında ne varsa onu alır —
 * yedeğin yapması gereken tam da budur.
 *
 * SALT OKUNUR: yalnızca SELECT çalıştırır.
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const file = path.join(backupDir, `full-backup-${timestamp}.json`);

  console.log('Tam yedek alınıyor (ham SQL)...');

  const tables = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
    `SELECT tablename FROM pg_tables
     WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
     ORDER BY tablename;`
  );

  const data: Record<string, any[]> = {};
  const counts: Record<string, number> = {};
  let total = 0;

  for (const { tablename } of tables) {
    const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "${tablename}";`);
    data[tablename] = rows;
    counts[tablename] = rows.length;
    total += rows.length;
  }

  const payload = {
    metadata: {
      timestamp: new Date().toISOString(),
      version: 'full-backup-v2',
      description: 'Çok kurumlu göç öncesi tam yedek (ham SQL)',
      tableCount: tables.length,
      totalRows: total,
      recordCounts: counts,
    },
    data,
  };

  fs.writeFileSync(
    file,
    JSON.stringify(payload, (_k, v) => (typeof v === 'bigint' ? v.toString() : v), 2)
  );

  const sizeMB = (fs.statSync(file).size / 1024 / 1024).toFixed(2);

  console.log(`\nTablo sayısı : ${tables.length}`);
  console.log(`Toplam satır : ${total}`);
  console.log(`Dosya boyutu : ${sizeMB} MB`);
  console.log(`Konum        : ${file}`);

  console.log('\nDolu tablolar:');
  Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .forEach(([t, c]) => console.log(`  ${t.padEnd(32)} ${c}`));
}

main()
  .catch((e) => { console.error('YEDEK BAŞARISIZ:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
