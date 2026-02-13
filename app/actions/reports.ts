'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { startOfWeek, endOfWeek } from 'date-fns';
import {
    WeeklyParticipationReport,
    SyllabusTrackingReport,
    AttendanceAlertsReport,
    EventsOverviewReport,
    BaseReportResponse,
    StudentAlert,
    MissedActivity
} from '@/types/reports';

export async function getWeeklyParticipationReport(): Promise<BaseReportResponse<WeeklyParticipationReport>> {
    try {
        const session = await getServerSession(authOptions);

        const sessionUser = session?.user as any;
        const userRoles = sessionUser?.roles || [sessionUser?.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);

        if (!session?.user || !isAdmin) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const activePeriod = await prisma.period.findFirst({
            where: { status: 'ACTIVE' }
        });

        const startDate = activePeriod?.startDate || new Date(0);
        const endDate = activePeriod?.endDate || new Date();

        // Get all tutors
        const tutors = await prisma.user.findMany({
            where: { roles: { has: UserRole.TUTOR } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
            },
        });

        const tutorStats = await Promise.all(
            tutors.map(async (tutor) => {
                // Fetch regular events this week
                const regularEvents = await prisma.event.findMany({
                    where: {
                        OR: [
                            { createdForTutorId: tutor.id },
                            { createdById: tutor.id }
                        ],
                        startDateTime: { gte: startDate, lte: endDate },
                    },
                    select: {
                        id: true,
                        title: true,
                        startDateTime: true,
                        participants: { select: { status: true } },
                    },
                });

                // Fetch Part 2 (Atölye) events this week
                const part2Events = await prisma.part2Event.findMany({
                    where: {
                        createdById: tutor.id,
                        eventDate: { gte: startDate, lte: endDate },
                    },
                    select: {
                        id: true,
                        title: true,
                        eventDate: true,
                        participants: { select: { status: true } },
                    },
                });

                // Fetch AttendanceSessions involving this tutor's students
                const sessions = await prisma.attendanceSession.findMany({
                    where: {
                        OR: [
                            { createdById: tutor.id },
                            { createdBy: { assistedTutorId: tutor.id } },
                            {
                                attendances: {
                                    some: {
                                        student: { tutorId: tutor.id }
                                    }
                                }
                            }
                        ],
                        sessionDate: { gte: startDate, lte: endDate },
                    },
                    select: {
                        id: true,
                        title: true,
                        sessionDate: true,
                        attendances: {
                            where: { student: { tutorId: tutor.id } },
                            select: { id: true }
                        },
                    },
                });

                // Get students for this tutor to calculate registration count for sessions
                const studentsCount = await prisma.user.count({
                    where: { tutorId: tutor.id, roles: { has: UserRole.STUDENT } }
                });

                const weeklySessions = [
                    ...regularEvents.map(e => ({
                        id: e.id,
                        title: e.title,
                        type: 'ETKİNLİK',
                        date: e.startDateTime.toISOString(),
                        registered: e.participants.length,
                        attended: e.participants.filter(p => p.status === 'ATTENDED').length,
                    })),
                    ...part2Events.map(e => ({
                        id: e.id,
                        title: e.title,
                        type: 'ATÖLYE',
                        date: e.eventDate.toISOString(),
                        registered: e.participants.length,
                        attended: e.participants.filter(p => p.status === 'ATTENDED').length,
                    })),
                    ...sessions.map(s => ({
                        id: s.id,
                        title: s.title,
                        type: 'OTURUM',
                        date: s.sessionDate.toISOString(),
                        registered: studentsCount,
                        attended: s.attendances.length,
                    })),
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                let totalRegistered = 0;
                let totalAttended = 0;
                weeklySessions.forEach(s => {
                    totalRegistered += s.registered;
                    totalAttended += s.attended;
                });

                const participationRate = totalRegistered > 0
                    ? Math.round((totalAttended / totalRegistered) * 100)
                    : 0;

                return {
                    id: tutor.id,
                    name: `${tutor.firstName} ${tutor.lastName}`,
                    username: tutor.username,
                    eventsCreated: weeklySessions.length,
                    totalAttendance: totalAttended,
                    totalRegistered,
                    participationRate,
                    weeklySessions,
                };
            })
        );

        const totalEvents = tutorStats.reduce((sum, t) => sum + t.eventsCreated, 0);
        const totalAttendance = tutorStats.reduce((sum, t) => sum + t.totalAttendance, 0);
        const totalRegistered = tutorStats.reduce((sum, t) => sum + t.totalRegistered, 0);
        const avgParticipation = tutorStats.length > 0
            ? Math.round(tutorStats.reduce((sum, t) => sum + t.participationRate, 0) / tutorStats.length)
            : 0;

        return {
            error: null,
            data: {
                weekStart: startDate.toISOString(),
                weekEnd: endDate.toISOString(),
                summary: {
                    totalEvents,
                    totalAttendance,
                    totalRegistered,
                    avgParticipation,
                    activeTutors: tutorStats.filter(t => t.eventsCreated > 0).length,
                    totalTutors: tutors.length,
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
        const session = await getServerSession(authOptions);

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
        const session = await getServerSession(authOptions);

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

        // Get all students with their participation data
        const students = await prisma.user.findMany({
            where: { roles: { has: UserRole.STUDENT } },
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
        const session = await getServerSession(authOptions);

        const sessionUser = session?.user as any;
        const userRoles = sessionUser?.roles || [sessionUser?.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);

        if (!session?.user || !isAdmin) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Fetch all tutors
        const tutors = await prisma.user.findMany({
            where: { roles: { has: UserRole.TUTOR } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
            },
        });

        const tutorsData = await Promise.all(tutors.map(async (tutor) => {
            // Get regular events created for this tutor
            const regularEvents = await prisma.event.findMany({
                where: {
                    OR: [
                        { createdForTutorId: tutor.id },
                        { createdById: tutor.id }
                    ]
                },
                select: {
                    id: true,
                    startDateTime: true,
                    participants: {
                        select: {
                            status: true,
                        },
                    },
                },
            });

            // Get Part 2 events created by this tutor
            const part2Events = await prisma.part2Event.findMany({
                where: { createdById: tutor.id },
                select: {
                    id: true,
                    eventDate: true,
                    participants: {
                        select: {
                            status: true,
                        },
                    },
                },
            });

            // Get Attendance Sessions involving this tutor's students
            const sessions = await prisma.attendanceSession.findMany({
                where: {
                    OR: [
                        { createdById: tutor.id },
                        { createdBy: { assistedTutorId: tutor.id } },
                        {
                            attendances: {
                                some: {
                                    student: { tutorId: tutor.id }
                                }
                            }
                        }
                    ],
                },
                select: {
                    id: true,
                    sessionDate: true,
                    attendances: {
                        where: { student: { tutorId: tutor.id } },
                        select: { id: true }
                    }
                }
            });

            // Get students for this tutor
            const studentsCount = await prisma.user.count({
                where: { tutorId: tutor.id, roles: { has: UserRole.STUDENT } }
            });

            // Combine events for unified analysis
            const allEvents = [
                ...regularEvents.map(e => ({
                    id: e.id,
                    type: 'REGULAR',
                    date: e.startDateTime,
                    participantsCount: e.participants.length,
                    attendedCount: e.participants.filter(p => p.status === 'ATTENDED').length
                })),
                ...part2Events.map(e => ({
                    id: e.id,
                    type: 'PART2',
                    date: e.eventDate,
                    participantsCount: e.participants.length,
                    attendedCount: e.participants.filter(p => p.status === 'ATTENDED').length
                })),
                ...sessions.map(s => ({
                    id: s.id,
                    type: 'SESSION',
                    date: s.sessionDate,
                    participantsCount: studentsCount,
                    attendedCount: s.attendances.length
                }))
            ];

            // Re-fetch with titles for the detail list
            const detailedEvents = await Promise.all([
                prisma.event.findMany({
                    where: { id: { in: regularEvents.map(e => e.id) } },
                    select: { id: true, title: true, startDateTime: true, participants: { select: { status: true } } },
                    orderBy: { startDateTime: 'desc' },
                    take: 10
                }),
                prisma.part2Event.findMany({
                    where: { id: { in: part2Events.map(e => e.id) } },
                    select: { id: true, title: true, eventDate: true, participants: { select: { status: true } } },
                    orderBy: { eventDate: 'desc' },
                    take: 10
                }),
                prisma.attendanceSession.findMany({
                    where: { id: { in: sessions.map(s => s.id) } },
                    select: { id: true, title: true, sessionDate: true, attendances: { select: { id: true } } },
                    orderBy: { sessionDate: 'desc' },
                    take: 10
                })
            ]);

            const recentEvents = [
                ...detailedEvents[0].map(e => ({
                    id: e.id,
                    title: e.title,
                    type: 'ETKİNLİK',
                    date: e.startDateTime.toISOString(),
                    registered: e.participants.length,
                    attended: e.participants.filter(p => p.status === 'ATTENDED').length
                })),
                ...detailedEvents[1].map(e => ({
                    id: e.id,
                    title: e.title,
                    type: 'ATÖLYE',
                    date: e.eventDate.toISOString(),
                    registered: e.participants.length,
                    attended: e.participants.filter(p => p.status === 'ATTENDED').length
                })),
                ...detailedEvents[2].map(s => ({
                    id: s.id,
                    title: s.title,
                    type: 'OTURUM',
                    date: s.sessionDate.toISOString(),
                    registered: studentsCount,
                    attended: s.attendances.length
                }))
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);

            const totalEvents = allEvents.length;
            const eventsThisWeek = allEvents.filter(e => e.date >= weekStart).length;
            const eventsThisMonth = allEvents.filter(e => e.date >= monthStart).length;

            let totalRegistered = 0;
            let totalAttended = 0;

            allEvents.forEach(e => {
                totalRegistered += e.participantsCount;
                totalAttended += e.attendedCount;
            });

            const participationRate = totalRegistered > 0
                ? Math.round((totalAttended / totalRegistered) * 100)
                : 0;

            return {
                id: tutor.id,
                name: `${tutor.firstName} ${tutor.lastName}`,
                username: tutor.username,
                totalEvents,
                eventsThisWeek,
                eventsThisMonth,
                totalRegistered,
                totalAttended,
                participationRate,
                recentEvents,
            };
        }));

        // Global Summary Metrics
        const sortedTutors = tutorsData.sort((a, b) => b.totalEvents - a.totalEvents);

        // Fetch Global Events & Sessions (those not assigned to a specific tutor in tutorsData)
        const [globalEventsCount, globalSessionsCount] = await Promise.all([
            prisma.event.count({
                where: {
                    createdForTutorId: null,
                    createdBy: { roles: { has: UserRole.ADMIN } }
                }
            }),
            prisma.attendanceSession.count({
                where: {
                    createdBy: { roles: { has: UserRole.ADMIN } },
                    attendances: { none: {} } // Sessions with no attendances yet or general ones
                }
            })
        ]);

        const summary = {
            totalTutors: tutors.length,
            totalEvents: tutorsData.reduce((sum, t) => sum + t.totalEvents, 0) + globalEventsCount + globalSessionsCount,
            avgParticipation: tutorsData.length > 0
                ? Math.round(tutorsData.reduce((sum, t) => sum + t.participationRate, 0) / tutorsData.length)
                : 0,
            totalAttended: tutorsData.reduce((sum, t) => sum + t.totalAttended, 0),
            totalRegistered: tutorsData.reduce((sum, t) => sum + t.totalRegistered, 0),
        };

        return {
            error: null,
            data: {
                summary,
                tutors: sortedTutors,
            },
        };
    } catch (error) {
        console.error('Error fetching events overview report:', error);
        return { error: 'Etkinlik özeti raporu yüklenirken bir hata oluştu', data: null };
    }
}
