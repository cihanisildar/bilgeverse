import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.BOARD_MEMBER)) {
            return NextResponse.json(
                { error: 'Unauthorized: Only admin and board members can access this endpoint' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const weekNumber = searchParams.get('week') ? parseInt(searchParams.get('week')!) : undefined;
        const tutorId = searchParams.get('tutorId') || undefined;

        // Get all attendance sessions
        const sessions = await prisma.attendanceSession.findMany({
            where: {
                createdBy: tutorId ? { id: tutorId } : undefined,
            },
            include: {
                attendances: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                username: true,
                                firstName: true,
                                lastName: true,
                                tutorId: true,
                                tutor: {
                                    select: {
                                        id: true,
                                        username: true,
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        },
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: {
                sessionDate: 'desc',
            },
        });

        // Group by tutor
        const tutorStats = new Map();

        sessions.forEach((session) => {
            const tutorKey = session.createdBy.id;
            if (!tutorStats.has(tutorKey)) {
                tutorStats.set(tutorKey, {
                    tutor: session.createdBy,
                    totalSessions: 0,
                    totalAttendances: 0,
                    students: new Set(),
                });
            }

            const stats = tutorStats.get(tutorKey);
            stats.totalSessions++;
            stats.totalAttendances += session.attendances.length;
            session.attendances.forEach((a) => stats.students.add(a.student.id));
        });

        const report = Array.from(tutorStats.values()).map((stats) => ({
            tutor: stats.tutor,
            totalSessions: stats.totalSessions,
            totalAttendances: stats.totalAttendances,
            uniqueStudents: stats.students.size,
        }));

        return NextResponse.json({ report, sessions }, { status: 200 });
    } catch (error: any) {
        console.error('Weekly participation report error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
