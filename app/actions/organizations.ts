'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { prismaUnscoped } from '@/lib/prisma';
import { bootstrapOrganization, BootstrapOrgInput } from '@/lib/org-bootstrap';
import { SYSTEM_ORG_ID, normalizeOrgCode, validateOrgCode } from '@/lib/constants/tenant';
import { getOrgAllowedParts } from '@/app/lib/packages';

/**
 * Süper admin işlemleri.
 *
 * Tamamı `prismaUnscoped` kullanır: bu işlemler tanımı gereği kurumlar arasıdır.
 * Her fonksiyon kendi yetki kontrolünü yapar — middleware'e güvenilmez.
 */

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isSuperAdmin) {
    return { ok: false as const, error: 'Bu işlem için süper admin yetkisi gerekiyor' };
  }
  return { ok: true as const, error: null };
}

export async function listOrganizations() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return { error: auth.error, data: null };

  const orgs = await prismaUnscoped.organization.findMany({
    where: { id: { not: SYSTEM_ORG_ID } },
    orderBy: { createdAt: 'asc' },
  });

  // `organizationId` FK'sız düz bir kolon olduğu için ilişki üzerinden
  // _count alınamıyor; tek bir groupBy ile sayılıyor.
  const counts = await prismaUnscoped.user.groupBy({
    by: ['organizationId'],
    where: { deletedAt: null },
    _count: { _all: true },
  });
  const countByOrg = new Map(counts.map((c) => [c.organizationId, c._count._all]));

  return {
    error: null,
    data: orgs.map((o) => ({
      id: o.id,
      code: o.code,
      name: o.name,
      isActive: o.isActive,
      packageIds: o.packageIds,
      extraParts: o.extraParts,
      excludedParts: o.excludedParts,
      allowedParts: getOrgAllowedParts(o),
      licenseExpiresAt: o.licenseExpiresAt?.toISOString() ?? null,
      contactEmail: o.contactEmail,
      contactPhone: o.contactPhone,
      userCount: countByOrg.get(o.id) ?? 0,
      createdAt: o.createdAt.toISOString(),
    })),
  };
}

export async function getOrganization(id: string) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return { error: auth.error, data: null };

  const org = await prismaUnscoped.organization.findUnique({ where: { id } });

  if (!org) return { error: 'Kurum bulunamadı', data: null };

  const admins = await prismaUnscoped.user.findMany({
    where: { organizationId: id, roles: { has: UserRole.ADMIN }, deletedAt: null },
    select: { id: true, username: true, firstName: true, lastName: true, isActive: true },
    orderBy: { createdAt: 'asc' },
  });

  return {
    error: null,
    data: {
      id: org.id,
      code: org.code,
      name: org.name,
      isActive: org.isActive,
      packageIds: org.packageIds,
      extraParts: org.extraParts,
      excludedParts: org.excludedParts,
      licenseExpiresAt: org.licenseExpiresAt?.toISOString() ?? null,
      contactEmail: org.contactEmail,
      contactPhone: org.contactPhone,
      notes: org.notes,
      admins,
    },
  };
}

export async function createOrganization(input: BootstrapOrgInput) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return { error: auth.error, data: null };

  try {
    const { organization } = await bootstrapOrganization(prismaUnscoped, input);
    revalidatePath('/superadmin');
    return { error: null, data: { id: organization.id, code: organization.code } };
  } catch (e: any) {
    return { error: e?.message || 'Kurum oluşturulamadı', data: null };
  }
}

export async function updateOrganizationEntitlements(
  id: string,
  data: {
    name?: string;
    code?: string;
    isActive?: boolean;
    packageIds?: number[];
    extraParts?: number[];
    excludedParts?: number[];
    licenseExpiresAt?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    notes?: string | null;
  }
) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return { error: auth.error, data: null };

  if (id === SYSTEM_ORG_ID) {
    return { error: 'Sistem kurumu düzenlenemez', data: null };
  }

  // Kurum kodu değiştirilebilir: hiçbir veri satırı koda bağlı değil, bağlantı
  // her yerde `organizationId` üzerinden. Yine de kod kullanıcıların giriş
  // ekranında yazdığı şey olduğu için kurallardan geçmesi ve benzersiz kalması
  // şart.
  let nextCode: string | undefined;
  if (data.code !== undefined) {
    nextCode = normalizeOrgCode(data.code);

    const codeError = validateOrgCode(nextCode);
    if (codeError) return { error: codeError, data: null };

    const clash = await prismaUnscoped.organization.findUnique({ where: { code: nextCode } });
    if (clash && clash.id !== id) {
      return { error: `"${nextCode}" kodu başka bir kurum tarafından kullanılıyor`, data: null };
    }
  }

  try {
    await prismaUnscoped.organization.update({
      where: { id },
      data: {
        ...(nextCode !== undefined && { code: nextCode }),
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.packageIds !== undefined && { packageIds: data.packageIds }),
        ...(data.extraParts !== undefined && { extraParts: data.extraParts }),
        ...(data.excludedParts !== undefined && { excludedParts: data.excludedParts }),
        ...(data.licenseExpiresAt !== undefined && {
          licenseExpiresAt: data.licenseExpiresAt ? new Date(data.licenseExpiresAt) : null,
        }),
        ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
        ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    revalidatePath('/superadmin');
    revalidatePath(`/superadmin/organizations/${id}`);
    return { error: null, data: { success: true } };
  } catch (e: any) {
    return { error: e?.message || 'Kurum güncellenemedi', data: null };
  }
}

/** Kuruma ek bir yönetici hesabı açar (ilk admin kurumla birlikte yaratılır). */
export async function createOrganizationAdmin(
  organizationId: string,
  input: { username: string; password: string; firstName?: string; lastName?: string }
) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return { error: auth.error, data: null };

  // Sistem kurumu kurum değil, süper adminlerin kabuğu: buraya normal admin
  // açılırsa giriş guard'ına takılıp giremeyen ölü bir kayıt oluşur.
  // Süper admin eklemek için /superadmin/account kullanılır.
  if (organizationId === SYSTEM_ORG_ID) {
    return { error: 'Sistem kurumuna yönetici eklenemez', data: null };
  }

  const org = await prismaUnscoped.organization.findUnique({ where: { id: organizationId } });
  if (!org) return { error: 'Kurum bulunamadı', data: null };

  const username = input.username.trim().toLowerCase();

  const clash = await prismaUnscoped.user.findUnique({
    where: { organizationId_username: { organizationId, username } },
  });
  if (clash) return { error: 'Bu kullanıcı adı bu kurumda zaten kullanılıyor', data: null };

  await prismaUnscoped.user.create({
    data: {
      organizationId,
      username,
      email: `${username}@${org.code.toLowerCase()}.local`,
      password: await bcrypt.hash(input.password, 10),
      firstName: input.firstName ?? 'Kurum',
      lastName: input.lastName ?? 'Yöneticisi',
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
    },
  });

  revalidatePath(`/superadmin/organizations/${organizationId}`);
  return { error: null, data: { success: true } };
}

/** Kurum yöneticisinin şifresini sıfırlar (kurum yetkilisi erişimini kaybettiğinde). */
export async function resetOrganizationAdminPassword(userId: string, newPassword: string) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return { error: auth.error, data: null };

  if (newPassword.length < 8) {
    return { error: 'Şifre en az 8 karakter olmalıdır', data: null };
  }

  const user = await prismaUnscoped.user.findUnique({
    where: { id: userId },
    select: { id: true, organizationId: true, isSuperAdmin: true },
  });
  if (!user) return { error: 'Kullanıcı bulunamadı', data: null };
  if (user.isSuperAdmin) return { error: 'Süper admin şifresi buradan değiştirilemez', data: null };

  await prismaUnscoped.user.update({
    where: { id: userId },
    data: { password: await bcrypt.hash(newPassword, 10), passwordChangedAt: new Date() },
  });

  revalidatePath(`/superadmin/organizations/${user.organizationId}`);
  return { error: null, data: { success: true } };
}

/** Kurum kodunun uygun olup olmadığını kontrol eder (form doğrulaması). */
export async function checkOrgCodeAvailable(code: string) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return { available: false, error: auth.error };

  const normalized = normalizeOrgCode(code);
  const existing = await prismaUnscoped.organization.findUnique({ where: { code: normalized } });
  return { available: !existing, error: null };
}
