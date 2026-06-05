'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { UserRole, PostStatus, SocialPlatform, ContentIdeaStatus, SocialEventType } from '@prisma/client';
import { SocialPost, ContentIngredient, ContentIdea, SocialEvent, UpcomingReminder, SocialReport } from '@/types/social';
import { getUpcomingFromSpecialDays } from '@/app/lib/social';
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
                contentType: data.contentType ?? null,
                status: data.status || PostStatus.DRAFT,
                scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
                hashtags: data.hashtags || [],
                mediaUrl: data.mediaUrl || null,
                views: data.views ?? null,
                engagement: data.engagement ?? null,
                reach: data.reach ?? null,
                isSportsClub: data.isSportsClub ?? false,
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
                contentType: data.contentType !== undefined ? data.contentType : undefined,
                status: data.status || undefined,
                scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
                hashtags: data.hashtags || undefined,
                mediaUrl: data.mediaUrl !== undefined ? data.mediaUrl : undefined,
                views: data.views !== undefined ? data.views : undefined,
                engagement: data.engagement !== undefined ? data.engagement : undefined,
                reach: data.reach !== undefined ? data.reach : undefined,
                isSportsClub: data.isSportsClub !== undefined ? data.isSportsClub : undefined,
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

// --- Auth helper: owner or admin can mutate ---
function canMutate(session: any, ownerId: string): boolean {
    const userNode = session.user as any;
    const userRoles = (userNode.roles || [userNode.role].filter(Boolean)) as UserRole[];
    return ownerId === userNode.id || userRoles.includes(UserRole.ADMIN);
}

const creatorSelect = {
    createdBy: {
        select: { id: true, username: true, firstName: true, lastName: true },
    },
} as const;

// --- Content Ideas (Fikir Havuzu) ---

export async function getContentIdeas() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { error: 'Unauthorized' };

        const ideas = await prisma.contentIdea.findMany({
            include: creatorSelect,
            orderBy: { createdAt: 'desc' },
        });

        return { data: ideas as unknown as ContentIdea[] };
    } catch (error: any) {
        logger.error('Error fetching content ideas:', error);
        return { error: error.message || 'Internal server error' };
    }
}

export async function createContentIdea(data: Partial<ContentIdea>) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { error: 'Unauthorized' };

        const idea = await prisma.contentIdea.create({
            data: {
                title: data.title!,
                description: data.description ?? null,
                platform: (data.platform as SocialPlatform) ?? null,
                contentType: data.contentType ?? null,
                tags: data.tags || [],
                status: (data.status as ContentIdeaStatus) || ContentIdeaStatus.NEW,
                createdById: session.user.id,
            },
            include: creatorSelect,
        });

        revalidatePath('/dashboard/part6');
        return { data: idea as unknown as ContentIdea, message: 'Fikir başarıyla eklendi' };
    } catch (error: any) {
        logger.error('Error creating content idea:', error);
        return { error: error.message || 'Internal server error' };
    }
}

export async function updateContentIdea(id: string, data: Partial<ContentIdea>) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { error: 'Unauthorized' };

        const existing = await prisma.contentIdea.findUnique({ where: { id } });
        if (!existing) return { error: 'Idea not found' };
        if (!canMutate(session, existing.createdById)) return { error: 'Unauthorized to update this idea' };

        const idea = await prisma.contentIdea.update({
            where: { id },
            data: {
                title: data.title || undefined,
                description: data.description !== undefined ? data.description : undefined,
                platform: data.platform !== undefined ? (data.platform as SocialPlatform | null) : undefined,
                contentType: data.contentType !== undefined ? data.contentType : undefined,
                tags: data.tags || undefined,
                status: (data.status as ContentIdeaStatus) || undefined,
            },
            include: creatorSelect,
        });

        revalidatePath('/dashboard/part6');
        return { data: idea as unknown as ContentIdea, message: 'Fikir güncellendi' };
    } catch (error: any) {
        logger.error('Error updating content idea:', error);
        return { error: error.message || 'Internal server error' };
    }
}

export async function deleteContentIdea(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { error: 'Unauthorized' };

        const existing = await prisma.contentIdea.findUnique({ where: { id } });
        if (!existing) return { error: 'Idea not found' };
        if (!canMutate(session, existing.createdById)) return { error: 'Unauthorized to delete this idea' };

        await prisma.contentIdea.delete({ where: { id } });

        revalidatePath('/dashboard/part6');
        return { message: 'Fikir silindi' };
    } catch (error: any) {
        logger.error('Error deleting content idea:', error);
        return { error: error.message || 'Internal server error' };
    }
}

export async function convertIdeaToPost(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { error: 'Unauthorized' };

        const idea = await prisma.contentIdea.findUnique({ where: { id } });
        if (!idea) return { error: 'Idea not found' };
        if (idea.convertedPostId) return { error: 'Bu fikir zaten bir gönderiye dönüştürülmüş' };

        const post = await prisma.socialPost.create({
            data: {
                title: idea.title,
                content: idea.description || '',
                platform: idea.platform || SocialPlatform.INSTAGRAM,
                contentType: idea.contentType,
                status: PostStatus.DRAFT,
                hashtags: idea.tags.map((t) => (t.startsWith('#') ? t : `#${t}`)),
                createdById: session.user.id,
            },
            include: creatorSelect,
        });

        await prisma.contentIdea.update({
            where: { id },
            data: { status: ContentIdeaStatus.CONVERTED, convertedPostId: post.id },
        });

        revalidatePath('/dashboard/part6');
        return { data: post as unknown as SocialPost, message: 'Fikir taslak gönderiye dönüştürüldü' };
    } catch (error: any) {
        logger.error('Error converting idea to post:', error);
        return { error: error.message || 'Internal server error' };
    }
}

// --- Social Events (Özel Günler / Kampanyalar) ---

export async function getSocialEvents() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { error: 'Unauthorized' };

        const events = await prisma.socialEvent.findMany({
            include: creatorSelect,
            orderBy: { date: 'asc' },
        });

        return { data: events as unknown as SocialEvent[] };
    } catch (error: any) {
        logger.error('Error fetching social events:', error);
        return { error: error.message || 'Internal server error' };
    }
}

export async function createSocialEvent(data: Partial<SocialEvent>) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { error: 'Unauthorized' };

        const event = await prisma.socialEvent.create({
            data: {
                title: data.title!,
                description: data.description ?? null,
                date: new Date(data.date as any),
                type: (data.type as SocialEventType) || SocialEventType.EVENT,
                recurring: data.recurring ?? false,
                reminderDays: data.reminderDays ?? 7,
                createdById: session.user.id,
            },
            include: creatorSelect,
        });

        revalidatePath('/dashboard/part6');
        return { data: event as unknown as SocialEvent, message: 'Etkinlik eklendi' };
    } catch (error: any) {
        logger.error('Error creating social event:', error);
        return { error: error.message || 'Internal server error' };
    }
}

export async function updateSocialEvent(id: string, data: Partial<SocialEvent>) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { error: 'Unauthorized' };

        const existing = await prisma.socialEvent.findUnique({ where: { id } });
        if (!existing) return { error: 'Event not found' };
        if (!canMutate(session, existing.createdById)) return { error: 'Unauthorized to update this event' };

        const event = await prisma.socialEvent.update({
            where: { id },
            data: {
                title: data.title || undefined,
                description: data.description !== undefined ? data.description : undefined,
                date: data.date ? new Date(data.date as any) : undefined,
                type: (data.type as SocialEventType) || undefined,
                recurring: data.recurring !== undefined ? data.recurring : undefined,
                reminderDays: data.reminderDays !== undefined ? data.reminderDays : undefined,
            },
            include: creatorSelect,
        });

        revalidatePath('/dashboard/part6');
        return { data: event as unknown as SocialEvent, message: 'Etkinlik güncellendi' };
    } catch (error: any) {
        logger.error('Error updating social event:', error);
        return { error: error.message || 'Internal server error' };
    }
}

export async function deleteSocialEvent(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { error: 'Unauthorized' };

        const existing = await prisma.socialEvent.findUnique({ where: { id } });
        if (!existing) return { error: 'Event not found' };
        if (!canMutate(session, existing.createdById)) return { error: 'Unauthorized to delete this event' };

        await prisma.socialEvent.delete({ where: { id } });

        revalidatePath('/dashboard/part6');
        return { message: 'Etkinlik silindi' };
    } catch (error: any) {
        logger.error('Error deleting social event:', error);
        return { error: error.message || 'Internal server error' };
    }
}

// --- Upcoming reminders (#8): user events + seed special days ---

export async function getUpcomingReminders(days: number = 30) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { error: 'Unauthorized' };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const events = await prisma.socialEvent.findMany();

        const reminders: UpcomingReminder[] = [];

        for (const ev of events) {
            const evDate = new Date(ev.date);
            let occurrence: Date;
            if (ev.recurring) {
                occurrence = new Date(today.getFullYear(), evDate.getMonth(), evDate.getDate());
                if (occurrence < today) {
                    occurrence = new Date(today.getFullYear() + 1, evDate.getMonth(), evDate.getDate());
                }
            } else {
                occurrence = new Date(evDate.getFullYear(), evDate.getMonth(), evDate.getDate());
            }
            const daysUntil = Math.round((occurrence.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const window = Math.max(days, ev.reminderDays);
            if (daysUntil >= 0 && daysUntil <= window) {
                reminders.push({
                    id: ev.id,
                    title: ev.title,
                    date: occurrence.toISOString(),
                    daysUntil,
                    type: ev.type,
                    source: 'EVENT',
                });
            }
        }

        // Seed special days (#8) — only those not already covered by a user event title
        const existingTitles = new Set(events.map((e) => e.title.toLowerCase()));
        for (const sd of getUpcomingFromSpecialDays(days, now)) {
            if (existingTitles.has(sd.title.toLowerCase())) continue;
            reminders.push({
                id: `seed-${sd.title}`,
                title: sd.title,
                date: sd.date.toISOString(),
                daysUntil: sd.daysUntil,
                type: SocialEventType.HOLIDAY,
                source: 'SEED',
            });
        }

        reminders.sort((a, b) => a.daysUntil - b.daysUntil);

        return { data: reminders };
    } catch (error: any) {
        logger.error('Error fetching reminders:', error);
        return { error: error.message || 'Internal server error' };
    }
}

// --- Monthly report (#9 + #11) ---

export async function getSocialReport(year: number, month: number) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { error: 'Unauthorized' };

        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);

        // Posts produced in the month (by creation date)
        const posts = await prisma.socialPost.findMany({
            where: { createdAt: { gte: start, lt: end } },
            include: creatorSelect,
            orderBy: { createdAt: 'desc' },
        });

        const byStatus: Record<string, number> = {};
        const byPlatform: Record<string, number> = {};
        const byContentType: Record<string, number> = {};
        const byMember: Record<string, { name: string; count: number }> = {};

        let totalViews = 0;
        let totalEngagement = 0;
        let totalReach = 0;
        let publishedCount = 0;

        for (const p of posts) {
            byStatus[p.status] = (byStatus[p.status] || 0) + 1;
            byPlatform[p.platform] = (byPlatform[p.platform] || 0) + 1;
            const ct = p.contentType || 'OTHER';
            byContentType[ct] = (byContentType[ct] || 0) + 1;

            const creator: any = (p as any).createdBy;
            const memberName = creator?.firstName || creator?.username || 'Bilinmeyen';
            const memberId = creator?.id || 'unknown';
            if (!byMember[memberId]) byMember[memberId] = { name: memberName, count: 0 };
            byMember[memberId].count += 1;

            if (p.status === PostStatus.PUBLISHED) publishedCount += 1;
            totalViews += p.views || 0;
            totalEngagement += p.engagement || 0;
            totalReach += p.reach || 0;
        }

        const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

        const topPosts = [...posts]
            .filter((p) => (p.engagement || 0) > 0)
            .sort((a, b) => (b.engagement || 0) - (a.engagement || 0))
            .slice(0, 5)
            .map((p) => ({
                id: p.id,
                title: p.title,
                platform: p.platform,
                views: p.views || 0,
                engagement: p.engagement || 0,
                reach: p.reach || 0,
            }));

        const report: SocialReport = {
            year,
            month,
            totalProduced: posts.length,
            publishedCount,
            byStatus,
            byPlatform,
            byContentType,
            members: Object.values(byMember).sort((a, b) => b.count - a.count),
            totalViews,
            totalEngagement,
            totalReach,
            engagementRate,
            topPosts,
        };

        return { data: report };
    } catch (error: any) {
        logger.error('Error generating social report:', error);
        return { error: error.message || 'Internal server error' };
    }
}
