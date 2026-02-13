'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { UserRole, PostStatus, SocialPlatform } from '@prisma/client';
import { SocialPost, ContentIngredient } from '@/types/social';
import logger from '@/lib/logger';
import { revalidatePath } from 'next/cache';

// --- Social Posts ---

export async function getSocialPosts(filters?: { platform?: SocialPlatform; status?: PostStatus }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { error: 'Unauthorized' };

        const posts = await prisma.socialPost.findMany({
            where: {
                platform: filters?.platform || undefined,
                status: filters?.status || undefined,
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: {
                scheduledDate: 'desc',
            },
        });

        return { data: posts as unknown as SocialPost[] };
    } catch (error: any) {
        logger.error('Error fetching social posts:', error);
        return { error: error.message || 'Internal server error' };
    }
}

export async function createSocialPost(data: Partial<SocialPost>) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { error: 'Unauthorized' };

        const post = await prisma.socialPost.create({
            data: {
                title: data.title!,
                content: data.content!,
                platform: data.platform!,
                status: data.status || PostStatus.DRAFT,
                scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
                hashtags: data.hashtags || [],
                mediaUrl: data.mediaUrl || null,
                createdById: session.user.id,
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        revalidatePath('/dashboard/part6');
        return { data: post as unknown as SocialPost, message: 'Gönderi başarıyla oluşturuldu' };
    } catch (error: any) {
        logger.error('Error creating social post:', error);
        return { error: error.message || 'Internal server error' };
    }
}

export async function updateSocialPost(id: string, data: Partial<SocialPost>) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { error: 'Unauthorized' };

        const existingPost = await prisma.socialPost.findUnique({ where: { id } });
        if (!existingPost) return { error: 'Post not found' };

        const userNode = session.user as any;
        const userRoles = userNode.roles || [userNode.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);

        if (existingPost.createdById !== userNode.id && !isAdmin) {
            return { error: 'Unauthorized to update this post' };
        }

        const updatedPost = await prisma.socialPost.update({
            where: { id },
            data: {
                title: data.title || undefined,
                content: data.content || undefined,
                platform: data.platform || undefined,
                status: data.status || undefined,
                scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
                hashtags: data.hashtags || undefined,
                mediaUrl: data.mediaUrl !== undefined ? data.mediaUrl : undefined,
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        revalidatePath('/dashboard/part6');
        return { data: updatedPost as unknown as SocialPost, message: 'Gönderi başarıyla güncellendi' };
    } catch (error: any) {
        logger.error('Error updating social post:', error);
        return { error: error.message || 'Internal server error' };
    }
}

export async function deleteSocialPost(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { error: 'Unauthorized' };

        const existingPost = await prisma.socialPost.findUnique({ where: { id } });
        if (!existingPost) return { error: 'Post not found' };

        const userNode = session.user as any;
        const userRoles = userNode.roles || [userNode.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);

        if (existingPost.createdById !== userNode.id && !isAdmin) {
            return { error: 'Unauthorized to delete this post' };
        }

        await prisma.socialPost.delete({ where: { id } });

        revalidatePath('/dashboard/part6');
        return { message: 'Gönderi başarıyla silindi' };
    } catch (error: any) {
        logger.error('Error deleting social post:', error);
        return { error: error.message || 'Internal server error' };
    }
}

// --- Content Ingredients ---

export async function getSocialIngredients() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { error: 'Unauthorized' };

        const ingredients = await prisma.contentIngredient.findMany({
            include: {
                createdBy: {
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

        return { data: ingredients as unknown as ContentIngredient[] };
    } catch (error: any) {
        logger.error('Error fetching ingredients:', error);
        return { error: error.message || 'Internal server error' };
    }
}

export async function createSocialIngredient(data: Partial<ContentIngredient>) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { error: 'Unauthorized' };

        const ingredient = await prisma.contentIngredient.create({
            data: {
                title: data.title!,
                content: data.content!,
                type: data.type!,
                createdById: session.user.id,
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        revalidatePath('/dashboard/part6');
        return { data: ingredient as unknown as ContentIngredient, message: 'Bileşen başarıyla oluşturuldu' };
    } catch (error: any) {
        logger.error('Error creating ingredient:', error);
        return { error: error.message || 'Internal server error' };
    }
}

export async function updateSocialIngredient(id: string, data: Partial<ContentIngredient>) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { error: 'Unauthorized' };

        const existingIngredient = await prisma.contentIngredient.findUnique({ where: { id } });
        if (!existingIngredient) return { error: 'Ingredient not found' };

        const userNode = session.user as any;
        const userRoles = userNode.roles || [userNode.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);

        if (existingIngredient.createdById !== userNode.id && !isAdmin) {
            return { error: 'Unauthorized to update this ingredient' };
        }

        const updatedIngredient = await prisma.contentIngredient.update({
            where: { id },
            data: {
                title: data.title || undefined,
                content: data.content || undefined,
                type: data.type || undefined,
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        revalidatePath('/dashboard/part6');
        return { data: updatedIngredient as unknown as ContentIngredient, message: 'Bileşen başarıyla güncellendi' };
    } catch (error: any) {
        logger.error('Error updating ingredient:', error);
        return { error: error.message || 'Internal server error' };
    }
}

export async function deleteSocialIngredient(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { error: 'Unauthorized' };

        const existingIngredient = await prisma.contentIngredient.findUnique({ where: { id } });
        if (!existingIngredient) return { error: 'Ingredient not found' };

        const userNode = session.user as any;
        const userRoles = userNode.roles || [userNode.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);

        if (existingIngredient.createdById !== userNode.id && !isAdmin) {
            return { error: 'Unauthorized to delete this ingredient' };
        }

        await prisma.contentIngredient.delete({ where: { id } });

        revalidatePath('/dashboard/part6');
        return { message: 'Bileşen başarıyla silindi' };
    } catch (error: any) {
        logger.error('Error deleting ingredient:', error);
        return { error: error.message || 'Internal server error' };
    }
}
