import { SocialPlatform, PostStatus } from '@prisma/client';

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
    status: PostStatus;
    scheduledDate: Date | string | null;
    mediaUrl: string | null;
    hashtags: string[];
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

export interface SocialResponse<T> {
    data?: T;
    message?: string;
    error?: string;
}
