import { UserRole } from '@prisma/client';
import { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import prisma, { prismaUnscoped } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { getOrgAllowedParts } from './packages';
import { canAccessPart } from './permissions';

/**
 * Sunucu tarafı yetki kontrolleri.
 *
 * `permissions.ts` saf (client'tan da import edilebilir) kalsın diye Prisma'ya
 * dokunan her şey buraya ayrıldı. Bu dosya YALNIZCA server component,
 * route handler ve server action'lardan import edilmelidir — client'a
 * sızarsa Prisma (ve dolayısıyla `async_hooks`) tarayıcı paketine girmeye
 * çalışır ve build kırılır.
 */

/**
 * Kurumun bu modülü (part) lisansladığını doğrular.
 *
 * Oturumdaki `orgParts` hızlı yoldur ama süper admin paketleri değiştirdiğinde
 * bayatlayabilir; bu yüzden nihai karar DB'den okunur. Token yalnızca
 * middleware'in ucuz ön elemesi için kullanılır.
 */
export async function isPartLicensed(session: Session | null, partId: number): Promise<boolean> {
    const organizationId = session?.user?.organizationId;
    if (!organizationId) return false;

    const org = await prismaUnscoped.organization.findUnique({
        where: { id: organizationId },
        select: { isActive: true, packageIds: true, extraParts: true, excludedParts: true, licenseExpiresAt: true },
    });

    if (!org || !org.isActive) return false;
    if (org.licenseExpiresAt && org.licenseExpiresAt < new Date()) return false;

    return getOrgAllowedParts(org).includes(partId);
}

/** Paket kapısına takılan isteklere verilen ortak mesaj. */
export const PART_NOT_LICENSED = 'Bu modül kurumunuzun paketinde bulunmuyor';

/**
 * Server action'lar için oturum + kurum paketi kapısı.
 *
 * Sayfa katmanı (`requireAuth({ partId })`) zaten kapılı; bu helper aynı kapıyı
 * VERİYE dokunan tarafa koyar. Aksi halde paketi olmayan bir kurumun admini
 * server action'ı doğrudan çağırıp modülü ücretsiz kullanabilir — veri sızıntısı
 * değil (kurum filtresi koşulsuz çalışır) ama ticari bir açık.
 *
 * Kullanım:
 *   const gate = await requirePartLicense(9);
 *   if (gate.error) return { error: gate.error, data: null };
 */
export async function requirePartLicense(partId: number) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { session: null, error: 'Oturum açmanız gerekiyor' };
    if (!(await isPartLicensed(session, partId))) return { session: null, error: PART_NOT_LICENSED };
    return { session, error: null as string | null };
}

/**
 * API route'ları için aynı kapı; hata durumunda hazır `NextResponse` döner.
 *
 *   const gate = await requireApiPartLicense(3);
 *   if (gate.errorResponse) return gate.errorResponse;
 */
export async function requireApiPartLicense(partId: number) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { session: null, errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    if (!(await isPartLicensed(session, partId))) {
        return { session: null, errorResponse: NextResponse.json({ error: PART_NOT_LICENSED }, { status: 403 }) };
    }
    return { session, errorResponse: null };
}

/**
 * Higher-level helper for server components to check if a user is authorized for a part
 * @param session - The NextAuth session
 * @param partId - The part ID to check
 */
export async function isAuthorized(session: Session | null, partId: number): Promise<boolean> {
    if (!session?.user) return false;

    const user = session.user;

    // Süper adminler kurum modüllerini kullanmaz; yalnız /superadmin panelini.
    if (user.isSuperAdmin) return false;

    // --- KURUM LİSANS KAPISI ---
    // Bu kontrol bilinçli olarak EN BAŞTA: rol izinleri ve kullanıcı bazlı
    // `allowedParts` istisnaları, kurumun satın almadığı bir modülü açamamalı.
    if (!(await isPartLicensed(session, partId))) return false;

    const roles = (user.roles || (user.role ? [user.role] : [])) as UserRole[];

    // Explicitly allow board members to access part 1 if they have the role
    // or if they are marked as isBoardMember in the session
    let isBoardMember = roles.includes(UserRole.BOARD_MEMBER) || (user as any).isBoardMember;

    // Fallback database check for board members if session is stale
    if (!isBoardMember && partId === 1) {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { boardMember: { select: { isActive: true } } }
        });

        if (dbUser) {
            isBoardMember = dbUser.roles.includes(UserRole.BOARD_MEMBER) ||
                           dbUser.role === UserRole.BOARD_MEMBER ||
                           !!dbUser.boardMember?.isActive;
        }
    }

    if (partId === 1 && isBoardMember) return true;

    if (roles.length > 0 && canAccessPart(roles, partId)) return true;

    // Per-user access grants (e.g. admin lets specific students use Sosyal Medya)
    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { allowedParts: true }
    });
    if (dbUser?.allowedParts?.includes(partId)) return true;

    return false;
}
