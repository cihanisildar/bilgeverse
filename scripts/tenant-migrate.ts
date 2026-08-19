/**
 * Çok kurumlu (multi-tenant) yapıya geçiş script'i.
 *
 * ÇALIŞTIRMA SIRASI — bu sırayı bozmayın:
 *
 *   1. YEDEK AL (zorunlu):  node scripts/backup-database-2025.js
 *                           node scripts/verify-backup-2025.js
 *      Bu adımdan sonrası tek yönlü kapıdır; geri dönüş yedekten restore demek.
 *
 *   2. Şemayı uygula:       npx prisma db push
 *      → Organization tablosunu oluşturur ve 97 tabloya `organizationId`
 *        kolonunu NOT NULL DEFAULT '<ROOT_ORG_ID>' olarak ekler.
 *        Postgres 11+ bunu tabloyu yeniden yazmadan yapar; MEVCUT TÜM SATIRLAR
 *        tek işlemde ana kuruma bağlanmış olur — ayrı bir backfill UPDATE'ine
 *        gerek yoktur.
 *      → Aynı push, 8 global `@unique` kısıtını kurum-bazlı bileşik kısıtlara
 *        çevirir (DROP INDEX + CREATE UNIQUE INDEX). Mevcut veri global olarak
 *        benzersiz olduğu için çakışma beklenmez.
 *      → `organizationId` FK'sız düz bir kolondur; bu yüzden kurumların önceden
 *        var olması GEREKMEZ ve push tek adımdır.
 *
 *   3. Kurumları oluştur:   npx tsx scripts/tenant-migrate.ts --create-orgs
 *   4. Doğrula:             npx tsx scripts/tenant-migrate.ts --verify
 *   5. Süper admin:         SUPERADMIN_PASSWORD="..." npx tsx scripts/tenant-migrate.ts --create-superadmin
 *   6. İzolasyon testi:     npx tsx scripts/verify-tenant-isolation.ts
 *
 * Script idempotenttir; tekrar çalıştırmak zarar vermez. Her komuta --dry-run
 * eklenebilir.
 */
import { PrismaClient, Prisma, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  ROOT_ORG_ID, ROOT_ORG_CODE, ROOT_ORG_NAME,
  SYSTEM_ORG_ID, SYSTEM_ORG_CODE, SYSTEM_ORG_NAME,
} from '../lib/constants/tenant';

// Bu script uzantısız client kullanır: kurum bağlamı yok, olması da istenmiyor.
const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run');

function log(msg: string) {
  console.log(`${DRY_RUN ? '[DRY-RUN] ' : ''}${msg}`);
}

/** Adım 1 — kurumları oluştur. */
async function createOrgs() {
  log('Kurumlar oluşturuluyor...');

  const orgs = [
    {
      id: ROOT_ORG_ID,
      code: ROOT_ORG_CODE,
      name: ROOT_ORG_NAME,
      // Mevcut kurum her şeye sahip: 4 paket de açık.
      packageIds: [1, 2, 3, 4],
    },
    {
      id: SYSTEM_ORG_ID,
      code: SYSTEM_ORG_CODE,
      name: SYSTEM_ORG_NAME,
      // Sistem kurumunun modülü yok; sadece süper adminleri barındırır.
      packageIds: [] as number[],
    },
  ];

  for (const org of orgs) {
    const existing = await prisma.organization.findUnique({ where: { id: org.id } });
    if (existing) {
      log(`  ✓ ${org.code} zaten var (${org.id})`);
      continue;
    }
    if (DRY_RUN) {
      log(`  + ${org.code} oluşturulacak (${org.id})`);
      continue;
    }
    await prisma.organization.create({ data: org });
    log(`  + ${org.code} oluşturuldu (${org.id})`);
  }
}

/** Adım 2 — her tabloda kurum ataması doğru mu? */
async function verify() {
  log('Kurum ataması doğrulanıyor...');

  const models = Prisma.dmmf.datamodel.models.filter((m) => m.name !== 'Organization');
  let problems = 0;
  let totalRows = 0;

  for (const model of models) {
    const hasOrgColumn = model.fields.some((f) => f.name === 'organizationId');
    if (!hasOrgColumn) {
      console.error(`  ✗ ${model.name}: organizationId kolonu YOK — izolasyon çalışmaz!`);
      problems++;
      continue;
    }

    const delegate = (prisma as any)[lowerFirst(model.name)];
    if (!delegate?.count) continue;

    const total = await delegate.count();
    // NOT: `organizationId` NOT NULL + DEFAULT olduğu için boş satır oluşamaz;
    // aranan şey, VAR OLMAYAN bir kuruma işaret eden satırlar.
    const validOrgIds = (await prisma.organization.findMany({ select: { id: true } })).map((o) => o.id);
    const dangling = await delegate.count({ where: { organizationId: { notIn: validOrgIds } } });
    const foreign = await delegate.count({
      where: { organizationId: { notIn: [ROOT_ORG_ID, SYSTEM_ORG_ID] } },
    });

    totalRows += total;

    if (dangling > 0) {
      console.error(`  ✗ ${model.name}: ${dangling} satır var olmayan bir kuruma bağlı`);
      problems++;
    } else if (foreign > 0) {
      // Göç sonrası yeni kurumlar açıldıysa bu normaldir; sadece bilgi.
      log(`  · ${model.name}: ${total} satır (${foreign} tanesi diğer kurumlarda)`);
    } else if (total > 0) {
      log(`  ✓ ${model.name}: ${total} satır ana kuruma bağlı`);
    }
  }

  console.log('');
  if (problems > 0) {
    console.error(`SONUÇ: ${problems} modelde sorun var. Göç TAMAMLANMADI.`);
    process.exitCode = 1;
  } else {
    console.log(`SONUÇ: tüm modeller temiz. Toplam ${totalRows} satır kurumlara bağlı.`);
  }
}

/** Adım 3 — sistem kurumunda ilk süper admin. */
async function createSuperAdmin() {
  const username = (process.env.SUPERADMIN_USERNAME || 'superadmin').toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!password) {
    console.error('HATA: SUPERADMIN_PASSWORD ortam değişkeni gerekli.');
    console.error('Örnek: SUPERADMIN_PASSWORD="güçlü-bir-şifre" npx tsx scripts/tenant-migrate.ts --create-superadmin');
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.user.findFirst({
    where: { organizationId: SYSTEM_ORG_ID, username },
  });

  if (existing) {
    log(`  ✓ Süper admin "${username}" zaten var`);
    return;
  }

  if (DRY_RUN) {
    log(`  + Süper admin "${username}" oluşturulacak`);
    return;
  }

  await prisma.user.create({
    data: {
      organizationId: SYSTEM_ORG_ID,
      username,
      email: `${username}@bilgeverse.system`,
      password: await bcrypt.hash(password, 10),
      firstName: 'Süper',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      isSuperAdmin: true,
    },
  });

  log(`  + Süper admin "${username}" oluşturuldu.`);
  log(`    Giriş: kurum kodu "${SYSTEM_ORG_CODE}", kullanıcı adı "${username}"`);
}

function lowerFirst(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--create-orgs')) await createOrgs();
  else if (args.includes('--verify')) await verify();
  else if (args.includes('--create-superadmin')) await createSuperAdmin();
  else {
    console.log('Kullanım (önce yedek al, sonra `npx prisma db push`):');
    console.log('  npx tsx scripts/tenant-migrate.ts --create-orgs         # 3. adım');
    console.log('  npx tsx scripts/tenant-migrate.ts --verify              # 4. adım');
    console.log('  npx tsx scripts/tenant-migrate.ts --create-superadmin   # 5. adım');
    console.log('  (herhangi biriyle --dry-run eklenebilir)');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
