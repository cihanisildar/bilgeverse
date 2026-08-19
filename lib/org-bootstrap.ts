import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';
import { DEFAULT_EVENT_TYPES, DEFAULT_PART2_EVENT_TYPES, DEFAULT_SPORT_BRANCHES } from './org-defaults';
import { normalizeOrgCode, validateOrgCode } from './constants/tenant';

export interface BootstrapOrgInput {
  code: string;
  name: string;
  packageIds: number[];
  extraParts?: number[];
  excludedParts?: number[];
  licenseExpiresAt?: Date | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  /** Kuruma teslim edilecek ilk yönetici hesabı */
  admin: {
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  /** İlk dönemin adı. Verilmezse içinde bulunulan eğitim yılı kullanılır. */
  periodName?: string;
}

function currentAcademicYear(): string {
  const now = new Date();
  // Eğitim yılı Eylül'de başlar.
  const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
}

/**
 * Yeni bir kurum oluşturur: kurum kaydı + ilk admin + kurumun kendi
 * başlangıç verisi.
 *
 * Başlangıç verisi kritik: bu tablolar tek kurumlu dönemde global'di. Yeni bir
 * kurum AKTİF DÖNEM olmadan açılırsa `periodId`'ye bağlı 12 modelin tamamı
 * (puan, tecrübe, rapor, duyuru, istek...) boş gelir veya hata verir — yani
 * kurum daha ilk gün kullanılamaz durumda olur.
 *
 * `client` olarak tenant filtresi UYGULANMAYAN bir client verilmelidir
 * (`prismaUnscoped` veya script'lerdeki `new PrismaClient()`), çünkü burada
 * henüz bir kurum bağlamı yok.
 */
export async function bootstrapOrganization(
  client: PrismaClient,
  input: BootstrapOrgInput
) {
  const code = normalizeOrgCode(input.code);

  const codeError = validateOrgCode(code);
  if (codeError) throw new Error(codeError);

  const existing = await client.organization.findUnique({ where: { code } });
  if (existing) {
    throw new Error(`"${code}" kodlu bir kurum zaten var.`);
  }

  const organizationId = `org_${code.toLowerCase()}_${Date.now().toString(36)}`;
  const username = input.admin.username.trim().toLowerCase();
  const hashedPassword = await bcrypt.hash(input.admin.password, 10);
  const periodName = input.periodName?.trim() || currentAcademicYear();

  return client.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        id: organizationId,
        code,
        name: input.name.trim(),
        packageIds: input.packageIds,
        extraParts: input.extraParts ?? [],
        excludedParts: input.excludedParts ?? [],
        licenseExpiresAt: input.licenseExpiresAt ?? null,
        contactEmail: input.contactEmail ?? null,
        contactPhone: input.contactPhone ?? null,
        notes: input.notes ?? null,
      },
    });

    const admin = await tx.user.create({
      data: {
        organizationId,
        username,
        email: input.admin.email?.trim().toLowerCase() || `${username}@${code.toLowerCase()}.local`,
        password: hashedPassword,
        firstName: input.admin.firstName ?? 'Kurum',
        lastName: input.admin.lastName ?? 'Yöneticisi',
        // NOT: `role` eski tekil alan, `roles` çoklu alan. İkisi de açıkça
        // yazılır — yalnız `role` verilip `roles` atlanırsa kullanıcı şema
        // varsayılanı olan [STUDENT] ile kaydolur.
        role: UserRole.ADMIN,
        roles: [UserRole.ADMIN],
      },
    });

    // --- Kuruma özel başlangıç verisi ---
    await tx.period.create({
      data: {
        organizationId,
        name: periodName,
        startDate: new Date(),
        status: 'ACTIVE',
      },
    });

    await tx.eventType.createMany({
      data: DEFAULT_EVENT_TYPES.map((t) => ({ ...t, organizationId })),
    });

    await tx.part2EventType.createMany({
      data: DEFAULT_PART2_EVENT_TYPES.map((t) => ({ ...t, organizationId })),
    });

    // Spor branşları yalnız Bilge Spor Kulübü (part 9) lisanslıysa anlamlı.
    const licensesSports = input.packageIds.includes(3) || (input.extraParts ?? []).includes(9);
    if (licensesSports) {
      await tx.sportBranch.createMany({
        data: DEFAULT_SPORT_BRANCHES.map((b) => ({ ...b, organizationId })),
      });
    }

    return { organization: org, admin };
  });
}
