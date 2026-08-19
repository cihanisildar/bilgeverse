/**
 * Kurumu belirsiz kalmış satırları arar.
 *
 *   npx tsx scripts/audit-tenant-rows.ts
 *
 * Extension iç içe ilişki yazmalarına (`data: { x: { create: {...} } }`)
 * organizationId ekleyemez. Böyle bir yazma gözden kaçarsa satır var olmayan
 * bir kuruma ya da yanlış kuruma bağlanır. Bu script onları yakalar.
 *
 * Salt okunur — canlıda düzenli çalıştırılabilir.
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { NO_ORG_SENTINEL } from '../lib/constants/tenant';

const prisma = new PrismaClient();

function lowerFirst(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

async function main() {
  const orgs = await prisma.organization.findMany({ select: { id: true, code: true } });
  const validIds = orgs.map((o) => o.id);

  console.log(`${orgs.length} kurum: ${orgs.map((o) => o.code).join(', ')}\n`);

  const models = Prisma.dmmf.datamodel.models.filter((m) => m.name !== 'Organization');
  let problems = 0;

  for (const model of models) {
    if (!model.fields.some((f) => f.name === 'organizationId')) {
      console.error(`✗ ${model.name}: organizationId kolonu yok`);
      problems++;
      continue;
    }

    const delegate = (prisma as any)[lowerFirst(model.name)];
    if (!delegate?.count) continue;

    // Enjeksiyonun atlandığı satırlar: kolon varsayılanı olan sentinel'de kalmış.
    // Bunlar hiçbir kuruma görünmez (fail-closed) ama sessizce birikmemeli.
    const orphaned = await delegate.count({
      where: { organizationId: NO_ORG_SENTINEL },
    });

    if (orphaned > 0) {
      console.error(
        `✗ ${model.name}: ${orphaned} satır '${NO_ORG_SENTINEL}' sentinel'inde kalmış ` +
        `— bir yazma yolu organizationId enjeksiyonunu atlıyor`
      );
      problems++;
    }

    // Var olmayan bir kuruma işaret eden satırlar (silinmiş kurum vb.)
    const dangling = await delegate.count({
      where: { organizationId: { notIn: [...validIds, NO_ORG_SENTINEL] } },
    });

    if (dangling > 0) {
      console.error(`✗ ${model.name}: ${dangling} satır geçersiz bir kuruma bağlı`);
      problems++;
    }
  }

  console.log('');
  if (problems > 0) {
    console.error(`${problems} modelde sorun bulundu.`);
    process.exit(1);
  }
  console.log('Tüm satırlar geçerli bir kuruma bağlı.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
