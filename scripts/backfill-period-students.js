/**
 * Backfill PeriodStudent membership rows so existing behaviour is preserved
 * exactly: every existing student becomes a member of EVERY existing period.
 *
 * Without this, after the membership filter goes live every period would look
 * empty. Run ONCE right after `prisma db push` adds the PeriodStudent table and
 * BEFORE (or together with) deploying the code that filters by membership.
 *
 * Safe to re-run: uses skipDuplicates.
 *
 *   node scripts/backfill-period-students.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function backfillPeriodStudents() {
  console.log('🚀 Backfilling period-student memberships...');

  try {
    const periods = await prisma.period.findMany({ select: { id: true, name: true } });
    // Only non-deleted students. (deletedAt is null for everyone right now.)
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT', deletedAt: null },
      select: { id: true },
    });

    console.log(`📊 ${periods.length} dönem, ${students.length} öğrenci bulundu.`);

    if (periods.length === 0 || students.length === 0) {
      console.log('⚠️  Backfill yapılacak veri yok. Çıkılıyor.');
      return;
    }

    let totalCreated = 0;

    for (const period of periods) {
      const data = students.map((s) => ({ periodId: period.id, studentId: s.id }));

      // createMany + skipDuplicates: var olan üyelikleri atlar, tekrar çalıştırılabilir.
      const result = await prisma.periodStudent.createMany({
        data,
        skipDuplicates: true,
      });

      totalCreated += result.count;
      console.log(`✅ "${period.name}": ${result.count} yeni üyelik (${students.length} öğrenciden).`);
    }

    console.log(`\n🎉 Tamamlandı. Toplam ${totalCreated} yeni üyelik oluşturuldu.`);
  } catch (error) {
    console.error('❌ Backfill başarısız:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  backfillPeriodStudents()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { backfillPeriodStudents };
