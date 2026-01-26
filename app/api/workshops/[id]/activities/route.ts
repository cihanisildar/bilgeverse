import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import crypto from 'crypto';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const activities = await prisma.workshopActivity.findMany({
            where: { workshopId: params.id },
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
            orderBy: { date: 'desc' },
        });

        return NextResponse.json(activities);
    } catch (error) {
        console.error('Error fetching activities:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Permission check: Admin, Board Member, or Assigned Tutor/Asistan
        const isSpecialRole = session.user.role === UserRole.ADMIN || session.user.role === UserRole.BOARD_MEMBER;

        if (!isSpecialRole) {
            const assignment = await prisma.workshopAssignment.findUnique({
                where: {
                    workshopId_userId: {
                        workshopId: params.id,
                        userId: session.user.id,
                    },
                },
            });

            const allowedRoles: UserRole[] = [UserRole.TUTOR, UserRole.ASISTAN];
            if (!assignment || !allowedRoles.includes(assignment.role)) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        const body = await req.json();
        const { title, description, date, startTime, endTime, location } = body;

        if (!title || !date) {
            return NextResponse.json({ error: 'Title and date are required' }, { status: 400 });
        }

        const activity = await prisma.workshopActivity.create({
            data: {
                workshopId: params.id,
                tutorId: session.user.id,
                title,
                description,
                date: new Date(date),
                startTime,
                endTime,
                location,
                qrCodeToken: crypto.randomBytes(16).toString('hex'),
            },
        });

        return NextResponse.json(activity, { status: 201 });
    } catch (error) {
        console.error('Error creating activity:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
