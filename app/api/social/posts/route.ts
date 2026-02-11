import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole, SocialPlatform, PostStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import logger from '@/lib/logger';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

// Get all social posts
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const platform = searchParams.get('platform') as SocialPlatform | null;
        const status = searchParams.get('status') as PostStatus | null;

        const posts = await prisma.socialPost.findMany({
            where: {
                platform: platform || undefined,
                status: status || undefined,
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

        return NextResponse.json({ posts }, { status: 200 });
    } catch (error: any) {
        logger.error('Error fetching social posts:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// Create a new social post
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, content, platform, status, scheduledDate, hashtags, mediaUrl } = body;

        if (!title || !content || !platform) {
            return NextResponse.json(
                { error: 'Title, content, and platform are required' },
                { status: 400 }
            );
        }

        const post = await prisma.socialPost.create({
            data: {
                title,
                content,
                platform,
                status: status || PostStatus.DRAFT,
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                hashtags: hashtags || [],
                mediaUrl,
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

        return NextResponse.json(
            { message: 'Social post created successfully', post },
            { status: 201 }
        );
    } catch (error: any) {
        logger.error('Error creating social post:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// Update a social post
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, title, content, platform, status, scheduledDate, hashtags, mediaUrl } = body;

        if (!id) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
        }

        const existingPost = await prisma.socialPost.findUnique({
            where: { id },
        });

        if (!existingPost) {
            return NextResponse.json({ error: 'Social post not found' }, { status: 404 });
        }

        // Check permissions: only creator or admin can update
        if (existingPost.createdById !== session.user.id && session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized to update this post' }, { status: 403 });
        }

        const updatedPost = await prisma.socialPost.update({
            where: { id },
            data: {
                title: title || undefined,
                content: content || undefined,
                platform: platform || undefined,
                status: status || undefined,
                scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
                hashtags: hashtags || undefined,
                mediaUrl: mediaUrl !== undefined ? mediaUrl : undefined,
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

        return NextResponse.json(
            { message: 'Social post updated successfully', post: updatedPost },
            { status: 200 }
        );
    } catch (error: any) {
        logger.error('Error updating social post:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// Delete a social post
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
        }

        const existingPost = await prisma.socialPost.findUnique({
            where: { id },
        });

        if (!existingPost) {
            return NextResponse.json({ error: 'Social post not found' }, { status: 404 });
        }

        // Check permissions: only creator or admin can delete
        if (existingPost.createdById !== session.user.id && session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized to delete this post' }, { status: 403 });
        }

        await prisma.socialPost.delete({
            where: { id },
        });

        return NextResponse.json(
            { message: 'Social post deleted successfully' },
            { status: 200 }
        );
    } catch (error: any) {
        logger.error('Error deleting social post:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
