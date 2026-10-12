'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { isPartLicensed, requirePartLicense } from '@/app/lib/permissions.server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { startOfWeek } from 'date-fns';
import { getActivePeriod, periodDateRange, periodStudentWhere } from '@/lib/periods';

/**
 * Kurumun Değerler Halkası raporları paketi (part 2) + oturum.
 *
 * Paket yoksa null döner; çağıran taraftaki mevcut oturum/rol kontrolleri
 * isteği zaten reddeder. Sayfa katmanı ayrıca requireAuth({ partId: 2 })
 * ile kapılı — buradaki kapı, server action'ın doğrudan çağrılması hâlini kapatır.
 */
const LICENSED_PART = 2;

async function getLicensedSession() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;
    if (!(await isPartLicensed(session, LICENSED_PART))) return null;
    return session;
}

/** Oturuma bakmayan okuma uçları için yalnız paket kontrolü. */
async function requireLicense() {
    const gate = await requirePartLicense(LICENSED_PART);
    return { ok: !gate.error, error: gate.error };
}

import {
    WeeklyParticipationReport,
    SyllabusTrackingReport,
    AttendanceAlertsReport,
    EventsOverviewReport,
    BaseReportResponse,
    StudentAlert,
    MissedActivity
} from '@/types/reports';

type ActivePeriod = NonNullable<Awaited<ReturnType<typeof getActivePeriod>>>;

type ActivityItem = {
    id: string;
    title: string;
    type: 'ETKİNLİK' | 'ATÖLYE' | 'OTURUM';
    date: Date;
    registered: number;
    attended: number;
};

/**
 * Per-rehber activity for the ACTIVE PERIOD, shared by the "Haftalık Katılım"
 * and "Etkinlik Özeti" reports. Uses the same rules as the Toplu Yoklama Özeti
 * screen (app/api/admin/tutor-participation/route.ts) so the numbers match:
 *   - rehberler : TUTOR, not deleted, active, tutorStatus ACTIVE (or null = legacy)
 *   - group     : students enrolled in the active period (periodStudentWhere)
 *   - sessions  : created by the rehber or by their asistan (lider), inside the
 *                 period's date range; only the group's own students are counted
 *   - events    : Event by periodId, Part2Event by date range
 */
async function loadActivePeriodTutorActivity(activePeriod: ActivePeriod) {
    const dateRange = periodDateRange(activePeriod);

    const tutors = await prisma.user.findMany({
        where: {
            roles: { has: UserRole.TUTOR },
            deletedAt: null,
            isActive: true,
            OR: [{ tutorStatus: 'ACTIVE' }, { tutorStatus: null }],
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            students: {
                where: {
                    roles: { has: UserRole.STUDENT },
                    isActive: true,
                    ...periodStudentWhere(activePeriod.id),
                },
                select: { id: true },
            },
        },
    });

    const tutorIds = tutors.map((t) => t.id);
    if (tutorIds.length === 0) return [];

    const [events, part2Events, sessions] = await Promise.all([
        prisma.event.findMany({
            where: {
                periodId: activePeriod.id,
                OR: [
                    { createdForTutorId: { in: tutorIds } },
                    { createdById: { in: tutorIds } },
                ],
            },
            select: {
                id: true,
                title: true,
                startDateTime: true,
                createdById: true,
                createdForTutorId: true,
                participants: { select: { status: true } },
            },
        }),
        prisma.part2Event.findMany({
            where: { createdById: { in: tutorIds }, eventDate: dateRange },
            select: {
                id: true,
                title: true,
                eventDate: true,
                createdById: true,
                participants: { select: { status: true } },
            },
        }),
        prisma.attendanceSession.findMany({
            where: {
                sessionDate: dateRange,
                OR: [
                    { createdById: { in: tutorIds } },
                    { createdBy: { assistedTutorId: { in: tutorIds } } },
                ],
            },
            select: {
                id: true,
                title: true,
                sessionDate: true,
                createdById: true,
                createdBy: { select: { assistedTutorId: true } },
                attendances: { select: { studentId: true } },
            },
        }),
    ]);

    return tutors.map((tutor) => {
        const groupStudentIds = new Set(tutor.students.map((s) => s.id));
        const groupSize = groupStudentIds.size;

        const items: ActivityItem[] = [
            ...events
                .filter((e) => e.createdById === tutor.id || e.createdForTutorId === tutor.id)
                .map((e) => ({
                    id: e.id,
                    title: e.title,
                    type: 'ETKİNLİK' as const,
                    date: e.startDateTime,
                    registered: e.participants.length,
                    attended: e.participants.filter((p) => p.status === 'ATTENDED').length,
                })),
            ...part2Events
                .filter((e) => e.createdById === tutor.id)
                .map((e) => ({
                    id: e.id,
                    title: e.title,
                    type: 'ATÖLYE' as const,
                    date: e.eventDate,
                    registered: e.participants.length,
                    attended: e.participants.filter((p) => p.status === 'ATTENDED').length,
                })),
            ...sessions
                .filter((s) => s.createdById === tutor.id || s.createdBy.assistedTutorId === tutor.id)
                .map((s) => ({
                    id: s.id,
                    title: s.title,
                    type: 'OTURUM' as const,
                    date: s.sessionDate,
                    // Group meeting: everyone in the group this period is expected.
                    registered: groupSize,
                    // Students who left the period are out of the denominator, so
                    // counting them here would push the rate above 100%.
                    attended: s.attendances.filter((a) => groupStudentIds.has(a.studentId)).length,
                })),
        ].sort((a, b) => b.date.getTime() - a.date.getTime());

        const totalRegistered = items.reduce((sum, i) => sum + i.registered, 0);
        const totalAttended = items.reduce((sum, i) => sum + i.attended, 0);

        return {
            id: tutor.id,
            name: tutor.firstName && tutor.lastName ? `${tutor.firstName} ${tutor.lastName}` : tutor.username,
            username: tutor.username,
            groupSize,
            items,
            totalRegistered,
            totalAttended,
            participationRate: totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0,
        };
    });
}

const toReportItem = (i: ActivityItem) => ({ ...i, date: i.date.toISOString() });

export async function getWeeklyParticipationReport(): Promise<BaseReportResponse<WeeklyParticipationReport>> {
    try {
        const session = await getLicensedSession();

        const sessionUser = session?.user as any;
        const userRoles = sessionUser?.roles || [sessionUser?.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);

        if (!session?.user || !isAdmin) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const activePeriod = await getActivePeriod();
        if (!activePeriod) {
            const now = new Date().toISOString();
            return {
                error: null,
                data: {
                    period: null,
                    weekStart: now,
                    weekEnd: now,
                    summary: { totalEvents: 0, totalAttendance: 0, totalRegistered: 0, avgParticipation: 0, activeTutors: 0, totalTutors: 0 },
                    tutorStats: [],
                },
            };
        }

        const activity = await loadActivePeriodTutorActivity(activePeriod);

        const tutorStats = activity.map((t) => ({
            id: t.id,
            name: t.name,
            username: t.username,
            groupSize: t.groupSize,
            eventsCreated: t.items.length,
            totalAttendance: t.totalAttended,
            totalRegistered: t.totalRegistered,
            participationRate: t.participationRate,
            weeklySessions: t.items.map(toReportItem),
        }));

        const totalEvents = tutorStats.reduce((sum, t) => sum + t.eventsCreated, 0);
        const totalAttendance = tutorStats.reduce((sum, t) => sum + t.totalAttendance, 0);
        const totalRegistered = tutorStats.reduce((sum, t) => sum + t.totalRegistered, 0);
        // Average only over rehberler who actually did something — idle groups
        // would otherwise drag the average down with a meaningless 0%.
        const withActivity = tutorStats.filter((t) => t.eventsCreated > 0);
        const avgParticipation = withActivity.length > 0
            ? Math.round(withActivity.reduce((sum, t) => sum + t.participationRate, 0) / withActivity.length)
            : 0;

        return {
            error: null,
            data: {
                period: { id: activePeriod.id, name: activePeriod.name },
                weekStart: activePeriod.startDate.toISOString(),
                weekEnd: (activePeriod.endDate ?? new Date()).toISOString(),
                summary: {
                    totalEvents,
                    totalAttendance,
                    totalRegistered,
                    avgParticipation,
                    activeTutors: withActivity.length,
                    totalTutors: tutorStats.length,
                },
                tutorStats: tutorStats.sort((a, b) => b.eventsCreated - a.eventsCreated),
            },
        };
    } catch (error) {
        console.error('Error fetching weekly participation report:', error);
        return { error: 'Haftalık katılım raporu yüklenirken bir hata oluştu', data: null };
    }
}

export async function getSyllabusTrackingReport(): Promise<BaseReportResponse<SyllabusTrackingReport>> {
    try {
        const session = await getLicensedSession();

        const sessionUser = session?.user as any;
        const userRoles = sessionUser?.roles || [sessionUser?.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);

        if (!session?.user || !isAdmin) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const syllabuses = await prisma.syllabus.findMany({
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
                lessons: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                feedbackForms: {
                    select: {
                        overallRating: true,
                    },
                },
                classroomProgress: {
                    include: {
                        classroom: {
                            include: {
                                tutor: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        username: true,
                                    },
                                },
                            },
                        },
                        lesson: {
                            select: {
                                title: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const trackingData = syllabuses.map((syllabus) => {
            const totalTopics = syllabus.lessons.length;

            // Map all lessons
            const allLessons = syllabus.lessons.map(lesson => ({
                id: lesson.id,
                title: lesson.title,
            }));

            // Group progress by tutor/classroom
            const tutorProgressMap = new Map<string, any>();

            syllabus.classroomProgress.forEach((progress) => {
                const tutor = progress.classroom.tutor;
                if (!tutorProgressMap.has(tutor.id)) {
                    tutorProgressMap.set(tutor.id, {
                        tutorId: tutor.id,
                        tutorName: `${tutor.firstName} ${tutor.lastName}`,
                        tutorUsername: tutor.username,
                        classroomName: progress.classroom.name,
                        completedCount: 0,
                        lastTaughtDate: null as Date | null,
                        latestNotes: [] as any[],
                        completedLessonIds: [] as string[],
                    });
                }

                const stats = tutorProgressMap.get(tutor.id);
                if (progress.isTaught) {
                    stats.completedCount++;
                    stats.completedLessonIds.push(progress.lessonId);
                    if (!stats.lastTaughtDate || (progress.taughtDate && progress.taughtDate > stats.lastTaughtDate)) {
                        stats.lastTaughtDate = progress.taughtDate;
                    }
                    if (progress.notes) {
                        stats.latestNotes.push({
                            lesson: progress.lesson.title,
                            note: progress.notes,
                            date: progress.taughtDate?.toISOString(),
                        });
                    }
                }
            });

            const tutorProgress = Array.from(tutorProgressMap.values()).map(stats => ({
                ...stats,
                progress: totalTopics > 0 ? Math.round((stats.completedCount / totalTopics) * 100) : 0,
                lastTaughtDate: stats.lastTaughtDate?.toISOString() || null,
                latestNotes: stats.latestNotes
                    .sort((a: { date: string }, b: { date: string }) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                    .slice(0, 2),
            }));

            // Feedback summary
            const feedbackCount = syllabus.feedbackForms.length;
            const avgRating = feedbackCount > 0
                ? (syllabus.feedbackForms.reduce((sum, f) => {
                    const ratingMap: Record<string, number> = {
                        'EXCELLENT': 5, 'GOOD': 4, 'AVERAGE': 3, 'POOR': 2, 'VERY_POOR': 1
                    };
                    return sum + (f.overallRating ? (ratingMap[f.overallRating] || 0) : 0);
                }, 0) / feedbackCount).toFixed(1)
                : null;

            // Overall completion topics across all classrooms
            const totalClassrooms = tutorProgress.length;
            const completedTopicsCount = syllabus.classroomProgress.filter(p => p.isTaught).length;
            const overallProgress = (totalTopics * totalClassrooms) > 0
                ? Math.round((completedTopicsCount / (totalTopics * totalClassrooms)) * 100)
                : 0;

            return {
                id: syllabus.id,
                title: syllabus.title,
                tutorName: `${syllabus.createdBy.firstName} ${syllabus.createdBy.lastName}`,
                tutorUsername: syllabus.createdBy.username,
                totalTopics,
                lessons: allLessons,
                tutorProgress,
                progress: overallProgress,
                avgRating,
                feedbackCount,
                createdAt: syllabus.createdAt.toISOString(),
            };
        });

        const summary = {
            totalSyllabuses: syllabuses.length,
            averageProgress: trackingData.length > 0
                ? Math.round(trackingData.reduce((sum, s) => sum + s.progress, 0) / trackingData.length)
                : 0,
            completedSyllabuses: trackingData.filter(s => s.progress === 100).length,
        };

        return {
            error: null,
            data: {
                summary,
                syllabuses: trackingData,
            },
        };
    } catch (error) {
        console.error('Error fetching syllabus tracking report:', error);
        return { error: 'Müfredat takip raporu yüklenirken bir hata oluştu', data: null };
    }
}

export async function getAttendanceAlertsReport(): Promise<BaseReportResponse<AttendanceAlertsReport>> {
    try {
        const session = await getLicensedSession();

        const sessionUser = session?.user as any;
        const userRoles = sessionUser?.roles || [sessionUser?.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);

        if (!session?.user || !isAdmin) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const ATTENDANCE_THRESHOLD = 75;
        const now = new Date();

        // Get past events and sessions to determine "missed" activities
        const pastEvents = await prisma.event.findMany({
            where: { startDateTime: { lte: now } },
            select: { id: true, title: true, startDateTime: true },
        });

        const pastSessions = await prisma.attendanceSession.findMany({
            where: { sessionDate: { lte: now } },
            select: { id: true, title: true, sessionDate: true, createdById: true },
        });

        // Get students (members of the active period) with their participation data
        const activePeriod = await getActivePeriod();
        const students = await prisma.user.findMany({
            where: {
                roles: { has: UserRole.STUDENT },
                ...(activePeriod ? periodStudentWhere(activePeriod.id) : { deletedAt: null }),
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                email: true,
                phone: true,
                studentClassroomId: true,
                classroomStudents: {
                    select: {
                        name: true,
                    },
                },
                tutorId: true,
                eventParticipations: {
                    select: {
                        eventId: true,
                        status: true,
                    },
                },
                studentAttendances: {
                    select: {
                        sessionId: true,
                    },
                },
            },
        });

        const totalPotentialActivities = pastEvents.length + pastSessions.length;

        const studentAlerts = students
            .map((student) => {
                const attendedEventsCount = student.eventParticipations.filter(p => p.status === 'ATTENDED').length;
                const attendedSessionsCount = student.studentAttendances.length;
                const totalAttended = attendedEventsCount + attendedSessionsCount;

                const attendancePercentage = totalPotentialActivities > 0
                    ? Math.round((totalAttended / totalPotentialActivities) * 100)
                    : 100;

                // Identify specifically missed activities
                const missedActivities: MissedActivity[] = [];

                // Missed Events
                pastEvents.forEach(event => {
                    const participation = student.eventParticipations.find(p => p.eventId === event.id);
                    if (!participation || participation.status !== 'ATTENDED') {
                        missedActivities.push({
                            id: event.id,
                            type: 'EVENT',
                            title: event.title,
                            date: event.startDateTime.toISOString(),
                            status: participation ? (participation.status === 'ABSENT' ? 'GELMEDİ' : 'KAYITLI / KATILMADI') : 'KAYITSIZ',
                        });
                    }
                });

                // Missed Sessions (Weekly Participations)
                // Assuming students should attend sessions created by their tutor
                pastSessions.forEach(session => {
                    if (session.createdById === student.tutorId) {
                        const attended = student.studentAttendances.some(a => a.sessionId === session.id);
                        if (!attended) {
                            missedActivities.push({
                                id: session.id,
                                type: 'SESSION',
                                title: session.title,
                                date: session.sessionDate.toISOString(),
                                status: 'GELMEDİ',
                            });
                        }
                    }
                });

                return {
                    id: student.id,
                    name: `${student.firstName} ${student.lastName}`,
                    username: student.username,
                    email: student.email,
                    phone: student.phone,
                    classroomId: student.studentClassroomId,
                    classroomName: student.classroomStudents?.name || 'Sınıf Atanmamış',
                    attendedCount: totalAttended,
                    totalPotential: totalPotentialActivities,
                    attendancePercentage,
                    missedActivities: missedActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
                } as StudentAlert;
            })
            .filter(s => s.attendancePercentage < ATTENDANCE_THRESHOLD)
            .sort((a, b) => a.attendancePercentage - b.attendancePercentage);

        const summary = {
            threshold: ATTENDANCE_THRESHOLD,
            totalStudents: students.length,
            studentsNeedingAttention: studentAlerts.length,
            averageAttendance: students.length > 0
                ? Math.round(
                    students.reduce((sum, s) => {
                        const attended = s.eventParticipations.filter(p => p.status === 'ATTENDED').length + s.studentAttendances.length;
                        const pct = totalPotentialActivities > 0 ? (attended / totalPotentialActivities) * 100 : 100;
                        return sum + pct;
                    }, 0) / students.length
                )
                : 0,
        };

        return {
            error: null,
            data: {
                summary,
                alerts: studentAlerts,
            },
        };
    } catch (error) {
        console.error('Error fetching attendance alerts report:', error);
        return { error: 'Devamsızlık uyarıları raporu yüklenirken bir hata oluştu', data: null };
    }
}

export async function getEventsOverviewReport(): Promise<BaseReportResponse<EventsOverviewReport>> {
    try {
        const session = await getLicensedSession();

        const sessionUser = session?.user as any;
        const userRoles = sessionUser?.roles || [sessionUser?.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);

        if (!session?.user || !isAdmin) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const activePeriod = await getActivePeriod();
        if (!activePeriod) {
            return {
                error: null,
                data: {
                    period: null,
                    summary: { totalTutors: 0, totalEvents: 0, avgParticipation: 0, totalAttended: 0, totalRegistered: 0 },
                    tutors: [],
                },
            };
        }

        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const activity = await loadActivePeriodTutorActivity(activePeriod);

        const tutorsData = activity.map((t) => ({
            id: t.id,
            name: t.name,
            username: t.username,
            groupSize: t.groupSize,
            totalEvents: t.items.length,
            eventsThisWeek: t.items.filter((i) => i.date >= weekStart).length,
            eventsThisMonth: t.items.filter((i) => i.date >= monthStart).length,
            totalRegistered: t.totalRegistered,
            totalAttended: t.totalAttended,
            participationRate: t.participationRate,
            // Same data as the totals above (items are already sorted newest first)
            recentEvents: t.items.slice(0, 15).map(toReportItem),
        }));

        const sortedTutors = tutorsData.sort((a, b) => b.totalEvents - a.totalEvents);

        // Admin-created general events/sessions of this period that are not tied to a rehber
        const [globalEventsCount, globalSessionsCount] = await Promise.all([
            prisma.event.count({
                where: {
                    periodId: activePeriod.id,
                    createdForTutorId: null,
                    createdBy: { roles: { has: UserRole.ADMIN } },
                },
            }),
            prisma.attendanceSession.count({
                where: {
                    sessionDate: periodDateRange(activePeriod),
                    createdBy: { roles: { has: UserRole.ADMIN } },
                    attendances: { none: {} },
                },
            }),
        ]);

        const withActivity = tutorsData.filter((t) => t.totalEvents > 0);
        const summary = {
            totalTutors: tutorsData.length,
            totalEvents: tutorsData.reduce((sum, t) => sum + t.totalEvents, 0) + globalEventsCount + globalSessionsCount,
            avgParticipation: withActivity.length > 0
                ? Math.round(withActivity.reduce((sum, t) => sum + t.participationRate, 0) / withActivity.length)
                : 0,
            totalAttended: tutorsData.reduce((sum, t) => sum + t.totalAttended, 0),
            totalRegistered: tutorsData.reduce((sum, t) => sum + t.totalRegistered, 0),
        };

        return {
            error: null,
            data: {
                period: { id: activePeriod.id, name: activePeriod.name },
                summary,
                tutors: sortedTutors,
            },
        };
    } catch (error) {
        console.error('Error fetching events overview report:', error);
        return { error: 'Etkinlik özeti raporu yüklenirken bir hata oluştu', data: null };
    }
}
