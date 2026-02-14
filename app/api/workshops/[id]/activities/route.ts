import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

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
    } catch (error: unknown) {
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

        const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);
        const isBoardMember = userRoles.includes(UserRole.BOARD_MEMBER);
        const isSpecialRole = isAdmin || isBoardMember;

        if (!isSpecialRole) {
            const assignment = await prisma.workshopAssignment.findUnique({
                where: {
                    workshopId_userId: {
                        workshopId: params.id,
                        userId: session.user.id,
                    },
                },
            });

            if (!assignment || (assignment.role !== UserRole.TUTOR && assignment.role !== UserRole.ASISTAN)) {
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
    } catch (error: unknown) {
        console.error('Error creating activity:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
