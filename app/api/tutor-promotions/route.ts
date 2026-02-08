import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole, TutorPromotionStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.BOARD_MEMBER)) {
            return NextResponse.json(
                { error: 'Unauthorized: Only admin and board members can access this endpoint' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as TutorPromotionStatus | null;

        const where = status ? { status } : {};

        const promotions = await prisma.tutorPromotion.findMany({
            where,
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

        return NextResponse.json({ promotions }, { status: 200 });
    } catch (error: any) {
        console.error('Fetch tutor promotions error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.BOARD_MEMBER)) {
            return NextResponse.json(
                { error: 'Unauthorized: Only admin and board members can create promotion requests' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { userId, requestedRole, notes } = body;

        if (!userId || !requestedRole) {
            return NextResponse.json(
                { error: 'userId and requestedRole are required' },
                { status: 400 }
            );
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if there's already a pending promotion for this user
        const existingPromotion = await prisma.tutorPromotion.findFirst({
            where: {
                userId,
                status: TutorPromotionStatus.PENDING,
            },
        });

        if (existingPromotion) {
            return NextResponse.json(
                { error: 'User already has a pending promotion request' },
                { status: 400 }
            );
        }

        const promotion = await prisma.tutorPromotion.create({
            data: {
                userId,
                requestedRole,
                notes,
                createdById: session.user.id,
            },
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
            },
        });

        return NextResponse.json({ promotion }, { status: 201 });
    } catch (error: any) {
        console.error('Create tutor promotion error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
