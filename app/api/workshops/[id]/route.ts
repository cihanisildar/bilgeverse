import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getWorkshopById } from '@/lib/workshops';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const workshop = await getWorkshopById(params.id);

        if (!workshop) {
            return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });
        }

        return NextResponse.json(workshop);
    } catch (error) {
        console.error('Error fetching workshop:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdminOrBoard = session.user.role === UserRole.ADMIN || session.user.role === UserRole.BOARD_MEMBER;

        let canUpdate = isAdminOrBoard;
        if (!canUpdate) {
            const assignment = await prisma.workshopAssignment.findUnique({
                where: {
                    workshopId_userId: {
                        workshopId: params.id,
                        userId: session.user.id,
                    },
                },
            });
            if (assignment) canUpdate = true;
        }

        if (!canUpdate) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { name, description, imageUrl } = body;

        const workshop = await prisma.workshop.update({
            where: { id: params.id },
            data: {
                name,
                description,
                imageUrl,
            },
        });

        return NextResponse.json(workshop);
    } catch (error) {
        console.error('Error updating workshop:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdminOrBoard = session.user.role === UserRole.ADMIN || session.user.role === UserRole.BOARD_MEMBER;

        let canDelete = isAdminOrBoard;
        if (!canDelete) {
            const assignment = await prisma.workshopAssignment.findUnique({
                where: {
                    workshopId_userId: {
                        workshopId: params.id,
                        userId: session.user.id,
                    },
                },
            });
            if (assignment) canDelete = true;
        }

        if (!canDelete) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.workshop.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting workshop:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
