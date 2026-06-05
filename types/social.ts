import { SocialPlatform, PostStatus, ContentIdeaStatus, SocialEventType } from '@prisma/client';

export interface Creator {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
}

export interface SocialPost {
    id: string;
    title: string;
    content: string;
    platform: SocialPlatform;
    contentType: string | null;
    status: PostStatus;
    scheduledDate: Date | string | null;
    mediaUrl: string | null;
    hashtags: string[];
    views: number | null;
    engagement: number | null;
    reach: number | null;
    isSportsClub?: boolean;
    createdAt: Date | string;
    createdBy: Creator;
}

export interface ContentIngredient {
    id: string;
    title: string;
    content: string;
    type: string;
    createdAt: Date | string;
    createdBy: Creator;
}

export interface ContentIdea {
    id: string;
    title: string;
    description: string | null;
    platform: SocialPlatform | null;
    contentType: string | null;
    tags: string[];
    status: ContentIdeaStatus;
    convertedPostId: string | null;
    createdAt: Date | string;
    createdBy: Creator;
}

export interface SocialEvent {
    id: string;
    title: string;
    description: string | null;
    date: Date | string;
    type: SocialEventType;
    recurring: boolean;
    reminderDays: number;
    createdAt: Date | string;
    createdBy: Creator;
}

export interface UpcomingReminder {
    id: string;
    title: string;
    date: string;
    daysUntil: number;
    type: SocialEventType;
    source: 'EVENT' | 'SEED';
}

export interface SocialReportTopPost {
    id: string;
    title: string;
    platform: SocialPlatform;
    views: number;
    engagement: number;
    reach: number;
}

export interface SocialReport {
    year: number;
    month: number;
    totalProduced: number;
    publishedCount: number;
    byStatus: Record<string, number>;
    byPlatform: Record<string, number>;
    byContentType: Record<string, number>;
    members: { name: string; count: number }[];
    totalViews: number;
    totalEngagement: number;
    totalReach: number;
    engagementRate: number;
    topPosts: SocialReportTopPost[];
}

export interface SocialResponse<T> {
    data?: T;
    message?: string;
    error?: string;
}
