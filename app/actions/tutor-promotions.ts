'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { isPartLicensed, requirePartLicense } from '@/app/lib/permissions.server';
import prisma from '@/lib/prisma';
import { UserRole, TutorPromotionStatus } from '@prisma/client';
import { isPromotionTarget, PROMOTABLE_FROM_ROLES, roleLabel } from '@/app/lib/promotion-roles';

/**
 * Kurumun İnsan Kaynağı paketi (part 3) + oturum.
 *
 * Paket yoksa null döner; çağıran taraftaki mevcut oturum/rol kontrolleri
 * isteği zaten reddeder. Sayfa katmanı ayrıca requireAuth({ partId: 3 })
 * ile kapılı — buradaki kapı, server action'ın doğrudan çağrılması hâlini kapatır.
 */
const LICENSED_PART = 3;

async function getLicensedSession() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;
    if (!(await isPartLicensed(session, LICENSED_PART))) return null;
    return session;
}

/** Oturuma bakmayan okuma uçları için yalnız paket kontrolü. */
async function requireLicense() {
    const gate = await requirePartLicense(LICENSED_PART);
    return { ok: !gate.error, error: gate.error };
}


export async function getTutorPromotions() {
    try {
        const session = await getLicensedSession();

        const sessionUser = session?.user as any;
        const userRoles = sessionUser?.roles || [sessionUser?.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);

        if (!session?.user || !isAdmin) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const promotions = await prisma.tutorPromotion.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                reviewedBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return {
            error: null,
            data: promotions.map((promotion) => ({
                id: promotion.id,
                userId: promotion.userId,
                requestedRole: promotion.requestedRole,
                status: promotion.status,
                notes: promotion.notes,
                rejectionReason: promotion.rejectionReason,
                createdAt: promotion.createdAt.toISOString(),
                reviewedAt: promotion.reviewedAt?.toISOString() || null,
                user: {
                    id: promotion.user.id,
                    username: promotion.user.username,
                    firstName: promotion.user.firstName,
                    lastName: promotion.user.lastName,
                    email: promotion.user.email,
                    role: promotion.user.role,
                },
                createdBy: {
                    id: promotion.createdBy.id,
                    username: promotion.createdBy.username,
                    firstName: promotion.createdBy.firstName,
                    lastName: promotion.createdBy.lastName,
                },
                reviewedBy: promotion.reviewedBy ? {
                    id: promotion.reviewedBy.id,
                    username: promotion.reviewedBy.username,
                    firstName: promotion.reviewedBy.firstName,
                    lastName: promotion.reviewedBy.lastName,
                } : null,
            })),
        };
    } catch (error) {
        console.error('Error fetching tutor promotions:', error);
        return { error: 'Terfi talepleri yüklenirken bir hata oluştu', data: null };
    }
}

export async function getTutorPromotionById(id: string) {
    try {
        const session = await getLicensedSession();

        const sessionUser = session?.user as any;
        const userRoles = sessionUser?.roles || [sessionUser?.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);

        if (!session?.user || !isAdmin) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const promotion = await prisma.tutorPromotion.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        role: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                reviewedBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        if (!promotion) {
            return { error: 'Terfi talebi bulunamadı', data: null };
        }

        return {
            error: null,
            data: {
                id: promotion.id,
                userId: promotion.userId,
                requestedRole: promotion.requestedRole,
                status: promotion.status,
                notes: promotion.notes,
                rejectionReason: promotion.rejectionReason,
                createdAt: promotion.createdAt.toISOString(),
                reviewedAt: promotion.reviewedAt?.toISOString() || null,
                user: {
                    id: promotion.user.id,
                    username: promotion.user.username,
                    firstName: promotion.user.firstName,
                    lastName: promotion.user.lastName,
                    email: promotion.user.email,
                    phone: promotion.user.phone,
                    role: promotion.user.role,
                },
                createdBy: {
                    id: promotion.createdBy.id,
                    username: promotion.createdBy.username,
                    firstName: promotion.createdBy.firstName,
                    lastName: promotion.createdBy.lastName,
                },
                reviewedBy: promotion.reviewedBy ? {
                    id: promotion.reviewedBy.id,
                    username: promotion.reviewedBy.username,
                    firstName: promotion.reviewedBy.firstName,
                    lastName: promotion.reviewedBy.lastName,
                } : null,
            },
        };
    } catch (error) {
        console.error('Error fetching tutor promotion:', error);
        return { error: 'Terfi talebi yüklenirken bir hata oluştu', data: null };
    }
}

export async function getEligibleUsers() {
    try {
        const session = await getLicensedSession();

        const sessionUser = session?.user as any;
        const userRoles = sessionUser?.roles || [sessionUser?.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);

        if (!session?.user || !isAdmin) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        // Havuz: öğrenci, lider ve rehberler. Rehberler de listede çünkü artık
        // Yönetim Kurulu Üyeliğine terfi mümkün. Hedef role göre süzme arayüzde
        // yapılıyor (kullanıcı zaten o role sahipse listelenmiyor).
        const users = await prisma.user.findMany({
            where: {
                roles: {
                    hasSome: PROMOTABLE_FROM_ROLES,
                },
            },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                roles: true,
            },
            orderBy: [
                { firstName: 'asc' },
                { lastName: 'asc' },
            ],
        });

        return {
            error: null,
            data: users,
        };
    } catch (error) {
        console.error('Error fetching eligible users:', error);
        return { error: 'Kullanıcılar yüklenirken bir hata oluştu', data: null };
    }
}

export interface CreateTutorPromotionInput {
    userId: string;
    requestedRole: string;
    notes?: string;
}

export async function createTutorPromotion(data: CreateTutorPromotionInput) {
    try {
        const session = await getLicensedSession();

        const sessionUser = session?.user as any;
        const userRoles = sessionUser?.roles || [sessionUser?.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);

        if (!session?.user || !isAdmin) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        // Validate user exists and is eligible
        const user = await prisma.user.findUnique({
            where: { id: data.userId },
        });

        if (!user) {
            return { error: 'Kullanıcı bulunamadı', data: null };
        }

        if (!isPromotionTarget(data.requestedRole)) {
            return { error: 'Geçersiz hedef rol', data: null };
        }
        const requestedRole = data.requestedRole;

        const targetUserRoles = (user.roles?.length ? user.roles : [user.role].filter(Boolean)) as UserRole[];
        if (!targetUserRoles.some((r) => PROMOTABLE_FROM_ROLES.includes(r))) {
            return { error: 'Bu kullanıcı terfi havuzunda değil', data: null };
        }
        if (targetUserRoles.includes(requestedRole)) {
            return { error: `Bu kullanıcı zaten ${roleLabel(requestedRole)} rolüne sahip`, data: null };
        }

        // Check for existing pending promotion
        const existingPromotion = await prisma.tutorPromotion.findFirst({
            where: {
                userId: data.userId,
                status: TutorPromotionStatus.PENDING,
            },
        });

        if (existingPromotion) {
            return { error: 'Bu kullanıcı için zaten bekleyen bir terfi talebi var', data: null };
        }

        const promotion = await prisma.tutorPromotion.create({
            data: {
                userId: data.userId,
                requestedRole,
                notes: data.notes || null,
                createdById: sessionUser.id,
                status: TutorPromotionStatus.PENDING,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        return {
            error: null,
            data: {
                id: promotion.id,
                userId: promotion.userId,
                requestedRole: promotion.requestedRole,
                status: promotion.status,
                notes: promotion.notes,
                createdAt: promotion.createdAt.toISOString(),
            },
        };
    } catch (error) {
        console.error('Error creating tutor promotion:', error);
        return { error: 'Terfi talebi oluşturulurken bir hata oluştu', data: null };
    }
}

export interface UpdateTutorPromotionInput {
    notes?: string;
    status?: TutorPromotionStatus;
    rejectionReason?: string;
    /** Hedef rol Lider (ASISTAN) ise: yardım edeceği rehberin id'si. */
    assistedTutorId?: string | null;
    /** Hedef rol Yönetim Kurulu Üyesi ise: kuruldaki görev/unvan. */
    boardTitle?: string;
}

export async function updateTutorPromotion(id: string, data: UpdateTutorPromotionInput) {
    try {
        const session = await getLicensedSession();

        const sessionUser = session?.user as any;
        const userRoles = sessionUser?.roles || [sessionUser?.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);

        if (!session?.user || !isAdmin) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const promotion = await prisma.tutorPromotion.findUnique({
            where: { id },
            include: { user: true },
        });

        if (!promotion) {
            return { error: 'Terfi talebi bulunamadı', data: null };
        }

        // If approving, update user role
        if (data.status === TutorPromotionStatus.APPROVED) {
            // Hedef rol artık sabit TUTOR değil: talepte ne istendiyse o veriliyor.
            const targetRole = promotion.requestedRole;
            if (!isPromotionTarget(targetRole)) {
                return { error: 'Bu talebin hedef rolü geçersiz', data: null };
            }

            // Lider (ASISTAN) bir rehbere bağlı çalışır; bağlantı kurulmazsa
            // yoklama/müfredat akışları kime ait olduğunu bulamıyor.
            let assistedTutorId: string | undefined;
            if (targetRole === UserRole.ASISTAN) {
                if (!data.assistedTutorId) {
                    return { error: 'Lider terfisinde yardım edeceği rehber seçilmelidir', data: null };
                }
                const tutor = await prisma.user.findUnique({
                    where: { id: data.assistedTutorId },
                    select: { id: true, role: true, roles: true },
                });
                const tutorRoles = (tutor?.roles?.length ? tutor.roles : [tutor?.role].filter(Boolean)) as UserRole[];
                if (!tutor || !tutorRoles.includes(UserRole.TUTOR)) {
                    return { error: 'Seçilen kişi rehber değil', data: null };
                }
                assistedTutorId = tutor.id;
            }

            const existingRoles = ((promotion.user as any).roles ?? []) as UserRole[];

            await prisma.$transaction([
                prisma.user.update({
                    where: { id: promotion.userId },
                    data: {
                        role: targetRole,
                        roles: { set: Array.from(new Set([...existingRoles, targetRole])) },
                        ...(assistedTutorId ? { assistedTutorId } : {}),
                    },
                }),
                prisma.tutorPromotion.update({
                    where: { id },
                    data: {
                        status: TutorPromotionStatus.APPROVED,
                        notes: data.notes,
                        reviewedById: sessionUser.id,
                        reviewedAt: new Date(),
                    },
                }),
            ]);

            // Yönetim Kurulu listesi BoardMember tablosundan okunuyor; rolü
            // vermek yetmez, kayıt açılmazsa kişi kurul listesinde görünmez.
            // Daha önce ayrılmış biri geri geliyorsa kaydı yeniden aktifleşir.
            if (targetRole === UserRole.BOARD_MEMBER) {
                const title = data.boardTitle?.trim() || 'Üye';
                await prisma.boardMember.upsert({
                    where: { userId: promotion.userId },
                    create: { userId: promotion.userId, title, isActive: true },
                    update: { isActive: true, ...(data.boardTitle?.trim() ? { title } : {}) },
                });
            }

            return {
                error: null,
                data: { success: true },
            };
        }

        // If rejecting, require rejection reason
        if (data.status === TutorPromotionStatus.REJECTED) {
            if (!data.rejectionReason?.trim()) {
                return { error: 'Red sebebi gereklidir', data: null };
            }

            await prisma.tutorPromotion.update({
                where: { id },
                data: {
                    status: TutorPromotionStatus.REJECTED,
                    notes: data.notes,
                    rejectionReason: data.rejectionReason,
                    reviewedById: sessionUser.id,
                    reviewedAt: new Date(),
                },
            });

            return {
                error: null,
                data: { success: true },
            };
        }

        // Just update notes
        await prisma.tutorPromotion.update({
            where: { id },
            data: {
                notes: data.notes,
            },
        });

        return {
            error: null,
            data: { success: true },
        };
    } catch (error) {
        console.error('Error updating tutor promotion:', error);
        return { error: 'Terfi talebi güncellenirken bir hata oluştu', data: null };
    }
}

/**
 * Terfi talebi kaydını siler.
 *
 * Yalnız KAYDI siler — onaylanmış bir talep silindiğinde kullanıcının TUTOR
 * rolü geri alınmaz. Rol değişikliği Kullanıcı Yönetimi'nin işi; burada geri
 * alınsa, aradan geçen sürede yapılmış başka rol düzenlemeleri de ezilirdi.
 * Arayüz onaylanmış kayıtlarda bunu kullanıcıya ayrıca hatırlatıyor.
 */
export async function deleteTutorPromotion(id: string) {
    try {
        const session = await getLicensedSession();

        const sessionUser = session?.user as any;
        const userRoles = sessionUser?.roles || [sessionUser?.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);

        if (!session?.user || !isAdmin) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const promotion = await prisma.tutorPromotion.findUnique({ where: { id } });
        if (!promotion) {
            return { error: 'Terfi talebi bulunamadı', data: null };
        }

        await prisma.tutorPromotion.delete({ where: { id } });

        return { error: null, data: { success: true } };
    } catch (error) {
        console.error('Error deleting tutor promotion:', error);
        return { error: 'Terfi talebi silinirken bir hata oluştu', data: null };
    }
}
