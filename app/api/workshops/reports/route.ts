export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);
        const isBoardMember = userRoles.includes(UserRole.BOARD_MEMBER);

        if (!isAdmin && !isBoardMember) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Metrics: Activity count per tutor
        const tutorActivityCounts = await prisma.workshopActivity.groupBy({
            by: ['tutorId'],
            _count: {
                id: true,
            },
        });

        // Populate tutor names
        const tutorIds = tutorActivityCounts.map((t) => t.tutorId);
        const tutors = await prisma.user.findMany({
            where: { id: { in: tutorIds } },
            select: { id: true, firstName: true, lastName: true },
        });

        const tutorStats = tutorActivityCounts.map((stat) => {
            const tutor = tutors.find((t) => t.id === stat.tutorId);
            return {
                tutorName: tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Unknown',
                activityCount: stat._count.id,
            };
        });

        // Workshop summaries
        const workshops = await prisma.workshop.findMany({
            include: {
                _count: {
                    select: {
                        activities: true,
                        students: true,
                    }
                },
                activities: {
                    include: {
                        _count: {
                            select: { attendances: { where: { status: true } } }
                        }
                    }
                }
            }
        });

        const workshopReports = workshops.map((w) => {
            const totalPossibleAttendances = w._count.activities * w._count.students;
            const actualAttendances = w.activities.reduce((acc: number, curr) => acc + (curr._count?.attendances || 0), 0);

            return {
                id: w.id,
                name: w.name,
                activityCount: w._count.activities,
                studentCount: w._count.students,
                attendanceRate: totalPossibleAttendances > 0 ? (actualAttendances / totalPossibleAttendances * 100).toFixed(2) : 0,
            };
        });

        return NextResponse.json({
            tutorStats,
            workshopReports,
        });
    } catch (error: unknown) {
        console.error('Error fetching reports:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
