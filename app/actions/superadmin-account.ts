'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { prismaUnscoped } from '@/lib/prisma';
import { SYSTEM_ORG_ID } from '@/lib/constants/tenant';
import { UserRole } from '@prisma/client';

/**
 * Süper adminin kendi hesabını yönetmesi.
 *
 * `prismaUnscoped` kullanılır: süper admin SYSTEM kurumundadır ve kurum
 * filtresi bu hesaba uygulanmaz. Her fonksiyon oturumdaki kullanıcının
 * kendisini okur — id dışarıdan ALINMAZ, aksi hâlde bir süper admin
 * başkasının hesabını değiştirebilirdi.
 *
 * Kullanıcı adı ya da şifre değiştiğinde JWT'deki bilgiler eskir; formlar
 * bu yüzden başarılı kayıttan sonra oturumu kapatır (`mustReLogin`).
 */

const USERNAME_RE = /^[a-z0-9._-]{3,20}$/;

async function currentSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isSuperAdmin) return null;

  const user = await prismaUnscoped.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, username: true, email: true, password: true,
      firstName: true, lastName: true, organizationId: true,
      isSuperAdmin: true, deletedAt: true,
    },
  });

  if (!user || !user.isSuperAdmin || user.deletedAt) return null;
  return user;
}

export async function getSuperAdminAccount() {
  const me = await currentSuperAdmin();
  if (!me) return { error: 'Bu sayfa için süper admin yetkisi gerekiyor', data: null };

  return {
    error: null,
    data: {
      username: me.username,
      email: me.email,
      firstName: me.firstName ?? '',
      lastName: me.lastName ?? '',
    },
  };
}

export async function updateSuperAdminProfile(input: {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  currentPassword: string;
}) {
  const me = await currentSuperAdmin();
  if (!me) return { error: 'Bu işlem için süper admin yetkisi gerekiyor', data: null };

  // Kimlik bilgisi değişikliği daima mevcut şifreyle doğrulanır: açık
  // bırakılmış bir oturumun hesabı ele geçirmesini engeller.
  const ok = await bcrypt.compare(input.currentPassword, me.password);
  if (!ok) return { error: 'Mevcut şifre hatalı', data: null };

  const username = input.username.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();

  if (!USERNAME_RE.test(username)) {
    return {
      error: 'Kullanıcı adı 3-20 karakter olmalı ve yalnız küçük harf, rakam, . _ - içermelidir',
      data: null,
    };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: 'Geçerli bir e-posta adresi girin', data: null };
  }

  if (username !== me.username) {
    const clash = await prismaUnscoped.user.findUnique({
      where: { organizationId_username: { organizationId: me.organizationId, username } },
      select: { id: true },
    });
    if (clash) return { error: 'Bu kullanıcı adı zaten kullanılıyor', data: null };
  }

  if (email !== me.email) {
    const clash = await prismaUnscoped.user.findUnique({
      where: { organizationId_email: { organizationId: me.organizationId, email } },
      select: { id: true },
    });
    if (clash) return { error: 'Bu e-posta adresi zaten kullanılıyor', data: null };
  }

  await prismaUnscoped.user.update({
    where: { id: me.id },
    data: {
      username,
      email,
      firstName: input.firstName.trim() || null,
      lastName: input.lastName.trim() || null,
    },
  });

  revalidatePath('/superadmin/account');
  return { error: null, data: { mustReLogin: username !== me.username } };
}

export async function changeSuperAdminPassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  const me = await currentSuperAdmin();
  if (!me) return { error: 'Bu işlem için süper admin yetkisi gerekiyor', data: null };

  const ok = await bcrypt.compare(input.currentPassword, me.password);
  if (!ok) return { error: 'Mevcut şifre hatalı', data: null };

  if (input.newPassword.length < 8) {
    return { error: 'Yeni şifre en az 8 karakter olmalıdır', data: null };
  }
  if (input.newPassword === input.currentPassword) {
    return { error: 'Yeni şifre mevcut şifreyle aynı olamaz', data: null };
  }

  await prismaUnscoped.user.update({
    where: { id: me.id },
    data: { password: await bcrypt.hash(input.newPassword, 10), passwordChangedAt: new Date() },
  });

  return { error: null, data: { mustReLogin: true } };
}


/**
 * Süper admin listesi ve yönetimi.
 *
 * Panelden ikinci bir süper admin açılabilmesi bilinçli: tek hesap kalırsa
 * şifre/kullanıcı adı unutulduğunda tek kurtarma yolu veritabanı script'i
 * oluyor.
 */
export async function listSuperAdmins() {
  const me = await currentSuperAdmin();
  if (!me) return { error: 'Bu sayfa için süper admin yetkisi gerekiyor', data: null };

  const admins = await prismaUnscoped.user.findMany({
    where: { isSuperAdmin: true, deletedAt: null },
    select: { id: true, username: true, firstName: true, lastName: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  return {
    error: null,
    data: admins.map((a) => ({
      id: a.id,
      username: a.username,
      fullName: [a.firstName, a.lastName].filter(Boolean).join(' '),
      createdAt: a.createdAt.toISOString(),
      isSelf: a.id === me.id,
    })),
  };
}

export async function createSuperAdmin(input: {
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  currentPassword: string;
}) {
  const me = await currentSuperAdmin();
  if (!me) return { error: 'Bu işlem için süper admin yetkisi gerekiyor', data: null };

  // Yeni bir sistem sahibi yaratmak en yetkili işlem: mevcut şifre şart.
  const ok = await bcrypt.compare(input.currentPassword, me.password);
  if (!ok) return { error: 'Mevcut şifre hatalı', data: null };

  const username = input.username.trim().toLowerCase();
  if (!USERNAME_RE.test(username)) {
    return {
      error: 'Kullanıcı adı 3-20 karakter olmalı ve yalnız küçük harf, rakam, . _ - içermelidir',
      data: null,
    };
  }
  if (input.password.length < 8) {
    return { error: 'Şifre en az 8 karakter olmalıdır', data: null };
  }

  const clash = await prismaUnscoped.user.findUnique({
    where: { organizationId_username: { organizationId: SYSTEM_ORG_ID, username } },
    select: { id: true },
  });
  if (clash) return { error: 'Bu kullanıcı adı zaten kullanılıyor', data: null };

  await prismaUnscoped.user.create({
    data: {
      organizationId: SYSTEM_ORG_ID,
      username,
      email: `${username}@bilgeverse.system`,
      password: await bcrypt.hash(input.password, 10),
      firstName: input.firstName?.trim() || 'Süper',
      lastName: input.lastName?.trim() || 'Admin',
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      isSuperAdmin: true,
    },
  });

  revalidatePath('/superadmin/account');
  return { error: null, data: { success: true } };
}

/** Başka bir süper adminin şifresini sıfırlar (kendi şifresi yukarıdaki formdan). */
export async function resetSuperAdminPassword(
  userId: string,
  newPassword: string,
  currentPassword: string
) {
  const me = await currentSuperAdmin();
  if (!me) return { error: 'Bu işlem için süper admin yetkisi gerekiyor', data: null };

  const ok = await bcrypt.compare(currentPassword, me.password);
  if (!ok) return { error: 'Mevcut şifre hatalı', data: null };

  if (newPassword.length < 8) {
    return { error: 'Yeni şifre en az 8 karakter olmalıdır', data: null };
  }
  if (userId === me.id) {
    return { error: 'Kendi şifreniz için üstteki "Şifre Değiştir" formunu kullanın', data: null };
  }

  const target = await prismaUnscoped.user.findUnique({
    where: { id: userId },
    select: { id: true, isSuperAdmin: true, deletedAt: true },
  });
  if (!target || !target.isSuperAdmin || target.deletedAt) {
    return { error: 'Süper admin bulunamadı', data: null };
  }

  await prismaUnscoped.user.update({
    where: { id: target.id },
    // Damga, o hesabın açık oturumlarını düşürür (auth.config.ts).
    data: { password: await bcrypt.hash(newPassword, 10), passwordChangedAt: new Date() },
  });

  revalidatePath('/superadmin/account');
  return { error: null, data: { success: true } };
}
