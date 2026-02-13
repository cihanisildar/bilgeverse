'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole, TutorPromotionStatus } from '@prisma/client';

export async function getTutorPromotions() {
    try {
        const session = await getServerSession(authOptions);

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
        const session = await getServerSession(authOptions);

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
        const session = await getServerSession(authOptions);

        const sessionUser = session?.user as any;
        const userRoles = sessionUser?.roles || [sessionUser?.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);

        if (!session?.user || !isAdmin) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const users = await prisma.user.findMany({
            where: {
                roles: {
                    hasSome: [UserRole.STUDENT, UserRole.ASISTAN],
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
        const session = await getServerSession(authOptions);

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

        const targetUserRoles = user.roles || [user.role].filter(Boolean) as UserRole[];
        if (!targetUserRoles.includes(UserRole.STUDENT) && !targetUserRoles.includes(UserRole.ASISTAN)) {
            return { error: 'Sadece öğrenci ve asistanlar terfi ettirilebilir', data: null };
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
                requestedRole: UserRole.TUTOR,
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
}

export async function updateTutorPromotion(id: string, data: UpdateTutorPromotionInput) {
    try {
        const session = await getServerSession(authOptions);

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
            await prisma.$transaction([
                prisma.user.update({
                    where: { id: promotion.userId },
                    data: {
                        role: UserRole.TUTOR,
                        roles: {
                            set: Array.from(new Set([...(promotion.user as any).roles, UserRole.TUTOR])),
                        },
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
