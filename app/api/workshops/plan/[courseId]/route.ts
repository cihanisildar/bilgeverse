import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

async function checkPermissions(courseId: string, userId: string, userRole: string) {
    if (userRole === UserRole.ADMIN || userRole === UserRole.BOARD_MEMBER) return true;

    const course = await prisma.workshopCourse.findUnique({
        where: { id: courseId },
        select: { workshopId: true }
    });

    if (!course) return false;

    const assignment = await prisma.workshopAssignment.findUnique({
        where: {
            workshopId_userId: {
                workshopId: course.workshopId,
                userId: userId
            }
        }
    });

    return !!assignment;
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { courseId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAuthorized = await checkPermissions(params.courseId, session.user.id, session.user.role);
        if (!isAuthorized) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { title, description, date } = body;

        const course = await prisma.workshopCourse.update({
            where: { id: params.courseId },
            data: {
                title,
                description,
                date: date ? new Date(date) : undefined,
            }
        });

        return NextResponse.json(course);
    } catch (error) {
        console.error('Error updating workshop course:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { courseId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAuthorized = await checkPermissions(params.courseId, session.user.id, session.user.role);
        if (!isAuthorized) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { isCompleted } = body;

        const course = await prisma.workshopCourse.update({
            where: { id: params.courseId },
            data: { isCompleted }
        });

        return NextResponse.json(course);
    } catch (error) {
        console.error('Error toggling workshop course:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { courseId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAuthorized = await checkPermissions(params.courseId, session.user.id, session.user.role);
        if (!isAuthorized) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.workshopCourse.delete({
            where: { id: params.courseId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting workshop course:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
