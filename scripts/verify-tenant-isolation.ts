/**
 * Kurum izolasyonunun gerçekten çalıştığını KANITLAYAN test.
 *
 *   npx tsx scripts/verify-tenant-isolation.ts
 *
 * İki test kurumu açar, her birine kayıt yazar, sonra A kurumu adına yapılan
 * sorguların B kurumunun hiçbir satırını görmediğini doğrular. Sonunda temizler.
 *
 * DİKKAT: yazma yapar. Önce bir Neon branch'inde çalıştırın.
 */

import prisma, { prismaUnscoped } from '../lib/prisma';
import { runAsOrg } from '../lib/tenant-context';

const A_ID = 'org_testa_isolation_check';
const B_ID = 'org_testb_isolation_check';

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail = '') {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function setup() {
  await cleanup();

  for (const [id, code] of [[A_ID, 'TESTA'], [B_ID, 'TESTB']] as const) {
    await prismaUnscoped.organization.create({
      data: { id, code, name: `Test ${code}`, packageIds: [1, 2, 3, 4] },
    });
  }

  // Her kuruma birer kayıt — extension'ın create'e organizationId koyduğunu da test eder.
  for (const id of [A_ID, B_ID]) {
    await runAsOrg(id, async () => {
      await prisma.period.create({ data: { name: 'Test Dönemi', startDate: new Date(), status: 'ACTIVE' } });
      await prisma.eventType.create({ data: { name: 'Test Etkinlik Tipi' } });
      await prisma.inventoryItem.create({ data: { name: 'Test Demirbaş' } });
    });
  }
}

async function cleanup() {
  for (const id of [A_ID, B_ID]) {
    // İlişkili satırlar önce; Organization'da User dışında FK yok.
    await prismaUnscoped.inventoryItem.deleteMany({ where: { organizationId: id } });
    await prismaUnscoped.eventType.deleteMany({ where: { organizationId: id } });
    await prismaUnscoped.period.deleteMany({ where: { organizationId: id } });
    await prismaUnscoped.user.deleteMany({ where: { organizationId: id } });
    await prismaUnscoped.organization.deleteMany({ where: { id } });
  }
}

async function run() {
  console.log('\n1) Aynı isim iki kurumda birlikte var olabiliyor mu?');
  {
    const all = await prismaUnscoped.period.count({ where: { name: 'Test Dönemi', organizationId: { in: [A_ID, B_ID] } } });
    check('İki kurumda da "Test Dönemi" var (kurum-bazlı unique çalışıyor)', all === 2, `bulunan: ${all}`);
  }

  console.log('\n2) Okuma izolasyonu — A kurumu B kurumunun verisini görmemeli');
  await runAsOrg(A_ID, async () => {
    const periods = await prisma.period.findMany({ where: { name: 'Test Dönemi' } });
    check('findMany yalnız A kurumunu döndürüyor',
      periods.length === 1 && periods[0].organizationId === A_ID,
      `${periods.length} satır`);

    const count = await prisma.eventType.count({ where: { name: 'Test Etkinlik Tipi' } });
    check('count yalnız A kurumunu sayıyor', count === 1, `sayı: ${count}`);

    const first = await prisma.inventoryItem.findFirst({ where: { name: 'Test Demirbaş' } });
    check('findFirst A kurumunun kaydını veriyor', first?.organizationId === A_ID);
  });

  console.log('\n3) findUnique / update / delete — B kurumunun kaydına A adına erişilememeli');
  const bPeriod = await prismaUnscoped.period.findFirstOrThrow({ where: { organizationId: B_ID } });

  await runAsOrg(A_ID, async () => {
    const found = await prisma.period.findUnique({ where: { id: bPeriod.id } });
    check('findUnique başka kurumun kaydında null dönüyor', found === null);

    let threw = false;
    try {
      await prisma.period.update({ where: { id: bPeriod.id }, data: { name: 'ELE GEÇİRİLDİ' } });
    } catch { threw = true; }
    check('update başka kurumun kaydında hata veriyor', threw);

    threw = false;
    try {
      await prisma.period.delete({ where: { id: bPeriod.id } });
    } catch { threw = true; }
    check('delete başka kurumun kaydında hata veriyor', threw);

    const affected = await prisma.eventType.updateMany({ where: {}, data: { description: 'A tarafından güncellendi' } });
    check('updateMany yalnız A kurumunu etkiliyor', affected.count === 1, `etkilenen: ${affected.count}`);
  });

  // B'nin kaydı hâlâ bozulmamış mı?
  const bAfter = await prismaUnscoped.period.findUnique({ where: { id: bPeriod.id } });
  check('B kurumunun kaydı değişmeden duruyor', bAfter?.name === 'Test Dönemi', `ad: ${bAfter?.name}`);

  const bEventType = await prismaUnscoped.eventType.findFirstOrThrow({ where: { organizationId: B_ID } });
  check('B kurumunun etkinlik tipi updateMany\'den etkilenmedi', bEventType.description !== 'A tarafından güncellendi');

  console.log('\n4) Yazma — create organizationId\'yi otomatik koyuyor mu?');
  await runAsOrg(A_ID, async () => {
    const created = await prisma.eventType.create({ data: { name: 'Otomatik Kurum Testi' } });
    check('create organizationId\'yi A olarak koydu', created.organizationId === A_ID);
    await prisma.eventType.delete({ where: { id: created.id } });
  });

  console.log('\n5) Fail-closed — kurum bağlamı yokken sorgu hata vermeli');
  {
    let threw = false;
    let message = '';
    try {
      await prisma.period.findMany();
    } catch (e: any) {
      threw = true;
      message = e?.name ?? '';
    }
    check('Bağlamsız sorgu MissingTenantContextError fırlatıyor',
      threw && message === 'MissingTenantContextError',
      threw ? `hata: ${message}` : 'hiç hata vermedi — TÜM VERİ SIZDI');
  }

  console.log('\n6) Tüm modellerde organizationId kolonu var mı?');
  {
    const { Prisma } = await import('@prisma/client');
    const missing = Prisma.dmmf.datamodel.models
      .filter((m) => m.name !== 'Organization')
      .filter((m) => !m.fields.some((f) => f.name === 'organizationId'))
      .map((m) => m.name);
    check(`${Prisma.dmmf.datamodel.models.length - 1} modelin hepsinde organizationId var`,
      missing.length === 0, missing.join(', '));
  }
}

async function main() {
  console.log('Kurum izolasyon testi başlıyor...');
  try {
    await setup();
    await run();
  } finally {
    await cleanup();
    console.log('\nTest verileri temizlendi.');
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`BAŞARILI: ${passed}   BAŞARISIZ: ${failed}`);
  console.log('='.repeat(50));

  if (failed > 0) {
    console.error('\nKURUM İZOLASYONU BOZUK — canlıya çıkmayın.');
    process.exit(1);
  }
  console.log('\nKurum izolasyonu doğrulandı.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prismaUnscoped.$disconnect());
