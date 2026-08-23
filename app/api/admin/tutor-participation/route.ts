export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getActivePeriod, periodStudentWhere } from '@/lib/periods';
import { requireApiPartLicense } from '@/app/lib/permissions.server';

/**
 * Rehber (tutor) weekly participation overview for the İnsan Kaynağı module.
 *
 * For every rehber (role TUTOR — leaders/assistants are intentionally excluded)
 * we compute how well their group attends meetings:
 *   participationRate = totalAttendances / (totalSessions * groupSize) * 100
 * i.e. the average share of the group that shows up per meeting. Rehber names
 * are then colour-coded: >=60% green, 40-60% yellow, <40% red.
 *
 * EVERYTHING here is scoped to the ACTIVE PERIOD:
 *   - rehberler : only those marked ACTIVE on the Gruplar screen (User.tutorStatus)
 *   - students  : only those enrolled in the active period (PeriodStudent)
 *   - sessions  : only those held inside the active period's date range
 * Without this scoping the screen mixed old periods' sessions with the new
 * period's group sizes, which produced meaningless rates, and it listed
 * rehberler who are no longer running a group.
 *
 * NOTE: AttendanceSession has no periodId column, so sessions are bounded by
 * `sessionDate` against the period's start/end dates.
 */
export async function GET() {
    // Kurum paketi kapısı — Değerler Halkası (part 2)
    const licenseGate = await requireApiPartLicense(2);
    if (licenseGate.errorResponse) return licenseGate.errorResponse;

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const roles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
        if (!roles.includes(UserRole.ADMIN) && !roles.includes(UserRole.BOARD_MEMBER)) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const activePeriod = await getActivePeriod();
        if (!activePeriod) {
            return NextResponse.json({
                success: true,
                tutors: [],
                period: null,
                message: 'Aktif dönem bulunamadı. Dönem Yönetimi\'nden bir dönemi aktif hale getirin.',
            });
        }

        // Sessions belonging to the active period. The period may still be open
        // (endDate null), in which case there is no upper bound.
        //
        // endDate is stored at midnight, so comparing `sessionDate <= endDate`
        // would drop every session held during the final day. Push the bound to
        // the end of that day instead.
        let sessionEnd: Date | null = null;
        if (activePeriod.endDate) {
            sessionEnd = new Date(activePeriod.endDate);
            sessionEnd.setHours(23, 59, 59, 999);
        }

        const sessionDateFilter = {
            sessionDate: {
                gte: activePeriod.startDate,
                ...(sessionEnd ? { lte: sessionEnd } : {}),
            },
        };

        // Only real rehberler (TUTOR). Assistants/leaders are excluded on purpose.
        // Only those the admin marked ACTIVE for this period are listed —
        // STANDBY / PASSIVE / LEAVING rehberler are not running a group now.
        const tutors = await prisma.user.findMany({
            where: {
                roles: { has: UserRole.TUTOR },
                deletedAt: null,
                isActive: true,
                // tutorStatus is null for rehberler created before the HR module;
                // those count as ACTIVE (same rule as the Gruplar screen).
                OR: [{ tutorStatus: 'ACTIVE' }, { tutorStatus: null }],
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                isActive: true,
                students: {
                    // Students enrolled in the ACTIVE PERIOD only. `periodStudentWhere`
                    // is the shared helper used everywhere else for period membership.
                    where: {
                        roles: { has: UserRole.STUDENT },
                        isActive: true,
                        ...periodStudentWhere(activePeriod.id),
                    },
                    select: { id: true, firstName: true, lastName: true, username: true },
                },
                createdSessions: {
                    where: sessionDateFilter,
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
                            where: sessionDateFilter,
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

            // Only count attendances from students who are in the group THIS period.
            // A student who left the period is out of the denominator (groupSize),
            // so leaving them in the numerator would push the rate above 100%.
            const groupStudentIds = new Set(tutor.students.map((s) => s.id));
            const totalAttendances = sessions.reduce(
                (sum, s) => sum + s.attendances.filter((a) => groupStudentIds.has(a.studentId)).length,
                0
            );

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

        return NextResponse.json({
            success: true,
            tutors: result,
            period: {
                id: activePeriod.id,
                name: activePeriod.name,
                startDate: activePeriod.startDate,
                endDate: activePeriod.endDate,
            },
        });
    } catch (error) {
        console.error('Error fetching tutor participation:', error);
        return NextResponse.json({ error: 'Failed to fetch tutor participation' }, { status: 500 });
    }
}
