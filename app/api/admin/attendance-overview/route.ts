export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// Helper to get current week
function getCurrentWeek(): { start: Date; end: Date } {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);

        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const currentWeek = getCurrentWeek();

        // Get all tutors with their students
        const tutors = await prisma.user.findMany({
            where: {
                role: {
                    in: [UserRole.TUTOR, UserRole.ASISTAN]
                },
                isActive: true,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                students: {
                    where: {
                        isActive: true,
                        role: UserRole.STUDENT,
                    },
                    select: {
                        id: true,
                    }
                }
            }
        });

        // Get all attendance sessions for this week
        const sessions = await prisma.attendanceSession.findMany({
            where: {
                sessionDate: {
                    gte: currentWeek.start,
                    lte: currentWeek.end,
                }
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                    }
                },
                attendances: {
                    select: {
                        studentId: true,
                    }
                }
            }
        });

        // Create stats for each tutor
        const stats = tutors.map(tutor => {
            const tutorSession = sessions.find(s => s.createdBy.id === tutor.id);
            const totalStudents = tutor.students.length;
            const attendedStudents = tutorSession
                ? tutor.students.filter(s => tutorSession.attendances.some(a => a.studentId === s.id)).length
                : 0;
            const absentStudents = totalStudents - attendedStudents;
            const attendanceRate = totalStudents > 0
                ? Math.round((attendedStudents / totalStudents) * 100)
                : 0;

            return {
                tutorId: tutor.id,
                tutorName: `${tutor.firstName} ${tutor.lastName}`,
                totalStudents,
                attendedStudents,
                absentStudents,
                attendanceRate,
                hasSession: !!tutorSession,
                sessionTitle: tutorSession?.title,
            };
        });

        // Sort by attendance rate descending
        stats.sort((a, b) => b.attendanceRate - a.attendanceRate);

        return NextResponse.json({
            success: true,
            stats,
            weekStart: currentWeek.start.toISOString(),
            weekEnd: currentWeek.end.toISOString(),
        });

    } catch (error: unknown) {
        console.error('Error fetching attendance overview:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch attendance overview';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
