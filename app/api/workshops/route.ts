import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/app/lib/auth-utils';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET(req: NextRequest) {
    try {
        const { errorResponse } = await requireApiAuth();
        if (errorResponse) return errorResponse;

        const workshops = await prisma.workshop.findMany({
            include: {
                assignments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                role: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        students: true,
                        activities: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(workshops);
    } catch (error) {
        console.error('Error fetching workshops:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { errorResponse } = await requireApiAuth([UserRole.ADMIN]);
        if (errorResponse) return errorResponse;

        const body = await req.json();
        const { name, description, imageUrl } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const workshop = await prisma.workshop.create({
            data: {
                name,
                description,
                imageUrl,
            },
        });

        return NextResponse.json(workshop, { status: 201 });
    } catch (error) {
        console.error('Error creating workshop:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
