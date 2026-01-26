import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the activity to check its workshopId
        const activity = await prisma.workshopActivity.findUnique({
            where: { id: params.id },
            select: { workshopId: true },
        });

        if (!activity) {
            return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
        }

        // Permission check: Admin, Board Member, or Assigned User
        const isSpecialRole = session.user.role === UserRole.ADMIN || session.user.role === UserRole.BOARD_MEMBER;

        if (!isSpecialRole) {
            const assignment = await prisma.workshopAssignment.findUnique({
                where: {
                    workshopId_userId: {
                        workshopId: activity.workshopId,
                        userId: session.user.id,
                    },
                },
            });

            if (!assignment) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        const body = await req.json();
        const { title, description, date, startTime, endTime, location } = body;

        if (!title || !date) {
            return NextResponse.json({ error: 'Title and date are required' }, { status: 400 });
        }

        const updatedActivity = await prisma.workshopActivity.update({
            where: { id: params.id },
            data: {
                title,
                description,
                date: new Date(date),
                startTime,
                endTime,
                location,
            },
            include: {
                tutor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: {
                        attendances: {
                            where: { status: true }
                        }
                    }
                }
            },
        });

        return NextResponse.json(updatedActivity);
    } catch (error) {
        console.error('Error updating activity:', error);
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

        // Get the activity to check its workshopId
        const activity = await prisma.workshopActivity.findUnique({
            where: { id: params.id },
            select: { workshopId: true },
        });

        if (!activity) {
            return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
        }

        // Permission check: Admin, Board Member, or Assigned User
        const isSpecialRole = session.user.role === UserRole.ADMIN || session.user.role === UserRole.BOARD_MEMBER;

        if (!isSpecialRole) {
            const assignment = await prisma.workshopAssignment.findUnique({
                where: {
                    workshopId_userId: {
                        workshopId: activity.workshopId,
                        userId: session.user.id,
                    },
                },
            });

            if (!assignment) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        await prisma.workshopActivity.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true, message: 'Activity deleted successfully' });
    } catch (error) {
        console.error('Error deleting activity:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
