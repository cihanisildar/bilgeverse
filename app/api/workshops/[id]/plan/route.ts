import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { title, description, date } = body;

        if (!title || !date) {
            return NextResponse.json({ error: 'Title and date are required' }, { status: 400 });
        }

        // Check permissions
        const isAdmin = session.user.role === UserRole.ADMIN;
        const isBoardMember = session.user.role === UserRole.BOARD_MEMBER;

        const assignment = await prisma.workshopAssignment.findUnique({
            where: {
                workshopId_userId: {
                    workshopId: params.id,
                    userId: session.user.id
                }
            }
        });

        if (!isAdmin && !isBoardMember && !assignment) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const course = await prisma.workshopCourse.create({
            data: {
                workshopId: params.id,
                title,
                description,
                date: new Date(date),
            }
        });

        return NextResponse.json(course);
    } catch (error) {
        console.error('Error creating workshop course:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const courses = await prisma.workshopCourse.findMany({
            where: { workshopId: params.id },
            orderBy: { date: 'asc' }
        });

        return NextResponse.json(courses);
    } catch (error) {
        console.error('Error fetching workshop courses:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
