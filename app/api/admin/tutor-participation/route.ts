export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

/**
 * Rehber (tutor) weekly participation overview for the İnsan Kaynağı module.
 *
 * For every rehber (role TUTOR — leaders/assistants are intentionally excluded)
 * we compute how well their group attends meetings:
 *   participationRate = totalAttendances / (totalSessions * groupSize) * 100
 * i.e. the average share of the group that shows up per meeting. Rehber names
 * are then colour-coded: >=60% green, 40-60% yellow, <40% red.
 *
 * Fixes the old "Toplu Yoklama Özeti" that showed 0% for everyone because it
 * only looked at the current calendar week and depended on period membership.
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const roles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
        if (!roles.includes(UserRole.ADMIN) && !roles.includes(UserRole.BOARD_MEMBER)) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Only real rehberler (TUTOR). Assistants/leaders are excluded on purpose.
        const tutors = await prisma.user.findMany({
            where: {
                roles: { has: UserRole.TUTOR },
                deletedAt: null,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                isActive: true,
                students: {
                    // Use the roles[] array (source of truth across the app), not the
                    // legacy singular `role`, so no student is silently dropped.
                    where: { roles: { has: UserRole.STUDENT }, isActive: true, deletedAt: null },
                    select: { id: true, firstName: true, lastName: true, username: true },
                },
                createdSessions: {
                    select: {
                        id: true,
                        title: true,
                        sessionDate: true,
                        attendances: { select: { studentId: true } },
                    },
                },
                // Attendance a rehber's assistant (lider) records on the group's behalf
                // must roll up to the rehber — otherwise those sessions are lost, and
                // the group looks like it never took attendance.
                asistans: {
                    select: {
                        createdSessions: {
                            select: {
                                id: true,
                                attendances: { select: { studentId: true } },
                            },
                        },
                    },
                },
            },
        });

        const result = tutors.map((tutor) => {
            const groupSize = tutor.students.length;
            const sessions = [
                ...tutor.createdSessions,
                ...tutor.asistans.flatMap((a) => a.createdSessions),
            ];
            const totalSessions = sessions.length;
            const totalAttendances = sessions.reduce((sum, s) => sum + s.attendances.length, 0);

            const denominator = totalSessions * groupSize;
            const participationRate = denominator > 0 ? Math.round((totalAttendances / denominator) * 100) : 0;

            // Per-student attendance across this rehber's sessions
            const perStudent = tutor.students.map((student) => {
                const attended = sessions.filter((s) => s.attendances.some((a) => a.studentId === student.id)).length;
                const rate = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;
                return {
                    id: student.id,
                    name: student.firstName && student.lastName ? `${student.firstName} ${student.lastName}` : student.username,
                    attended,
                    totalSessions,
                    rate,
                };
            }).sort((a, b) => b.rate - a.rate);

            const color = totalSessions === 0 ? 'none' : participationRate >= 60 ? 'green' : participationRate >= 40 ? 'yellow' : 'red';

            return {
                tutorId: tutor.id,
                tutorName: tutor.firstName && tutor.lastName ? `${tutor.firstName} ${tutor.lastName}` : tutor.username,
                isActive: tutor.isActive,
                groupSize,
                totalSessions,
                totalAttendances,
                participationRate,
                color,
                students: perStudent,
            };
        });

        // Rehberler with sessions first, then by rate ascending so problem groups surface
        result.sort((a, b) => {
            if ((a.totalSessions === 0) !== (b.totalSessions === 0)) return a.totalSessions === 0 ? 1 : -1;
            return a.participationRate - b.participationRate;
        });

        return NextResponse.json({ success: true, tutors: result });
    } catch (error) {
        console.error('Error fetching tutor participation:', error);
        return NextResponse.json({ error: 'Failed to fetch tutor participation' }, { status: 500 });
    }
}
