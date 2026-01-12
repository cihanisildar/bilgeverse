import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.BOARD_MEMBER)) {
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
        const tutorIds = tutorActivityCounts.map((t: any) => t.tutorId);
        const tutors = await prisma.user.findMany({
            where: { id: { in: tutorIds } },
            select: { id: true, firstName: true, lastName: true },
        });

        const tutorStats = tutorActivityCounts.map((stat: any) => {
            const tutor = tutors.find((t: any) => t.id === stat.tutorId);
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

        const workshopReports = workshops.map((w: any) => {
            const totalPossibleAttendances = w._count.activities * w._count.students;
            const actualAttendances = w.activities.reduce((acc: number, curr: any) => acc + (curr._count?.attendances || 0), 0);

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
    } catch (error) {
        console.error('Error fetching reports:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
