'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

interface GroupLeader {
    id: string;
    name: string;
    avatarUrl?: string;
    attendanceCount: number;
    participationCount: number;
    participationRate: number;
}

interface IsolatedStudent {
    id: string;
    name: string;
    avatarUrl?: string;
    attendanceCount: number;
    participationCount: number;
    lastActivityDate?: string;
}

interface FriendGroup {
    students: {
        id: string;
        name: string;
        avatarUrl?: string;
    }[];
    commonActivities: number;
    activityNames: string[];
}

interface ActivityStats {
    totalActivities: number;
    totalParticipations: number;
    averageParticipationRate: number;
    mostPopularActivity?: string;
    leastPopularActivity?: string;
    weeklyTrend: { week: string; count: number }[];
}

export async function getSociometricData(classroomId: string) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            throw new Error('Unauthorized');
        }

        // Check if user has access to this classroom
        const isAdmin = session.user.role === 'ADMIN';
        const isTutor = session.user.role === 'TUTOR';

        if (!isAdmin && !isTutor) {
            throw new Error('Unauthorized');
        }

        // If tutor, verify they own this classroom
        if (isTutor) {
            const classroom = await prisma.classroom.findFirst({
                where: {
                    id: classroomId,
                    tutorId: session.user.id,
                },
            });

            if (!classroom) {
                throw new Error('Unauthorized - not your classroom');
            }
        }

        // Get classroom info
        const classroom = await prisma.classroom.findUnique({
            where: { id: classroomId },
            include: {
                tutor: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
                students: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    },
                    where: {
                        role: 'STUDENT',
                    },
                },
            },
        });

        if (!classroom) {
            throw new Error('Classroom not found');
        }

        const studentIds = classroom.students.map(s => s.id);

        // Get all Part2 events and participations for this classroom's students
        const events = await prisma.part2Event.findMany({
            where: {
                status: {
                    in: ['TAMAMLANDI', 'DEVAM_EDIYOR'],
                },
                participants: {
                    some: {
                        studentId: {
                            in: studentIds,
                        },
                    },
                },
            },
            include: {
                participants: {
                    where: {
                        studentId: {
                            in: studentIds,
                        },
                        status: 'ATTENDED',
                    },
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                eventType: true,
            },
            orderBy: {
                eventDate: 'desc',
            },
        });

        // Get attendance sessions for these students
        const attendanceSessions = await prisma.attendanceSession.findMany({
            where: {
                status: 'COMPLETED',
                attendances: {
                    some: {
                        studentId: {
                            in: studentIds,
                        },
                    },
                },
            },
            include: {
                attendances: {
                    where: {
                        studentId: {
                            in: studentIds,
                        },
                    },
                },
            },
            orderBy: {
                sessionDate: 'desc',
            },
        });

        // Calculate metrics for each student
        const studentMetrics = classroom.students.map(student => {
            const participations = events.reduce((count, event) => {
                return count + (event.participants.some(p => p.studentId === student.id) ? 1 : 0);
            }, 0);

            const attendances = attendanceSessions.reduce((count, session) => {
                return count + (session.attendances.some(a => a.studentId === student.id) ? 1 : 0);
            }, 0);

            return {
                id: student.id,
                name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'İsimsiz',
                avatarUrl: student.avatarUrl || undefined,
                participationCount: participations,
                attendanceCount: attendances,
                participationRate: events.length > 0 ? (participations / events.length) * 100 : 0,
            };
        });

        // Find group leaders (top 5 students by participation)
        const groupLeaders: GroupLeader[] = studentMetrics
            .filter(s => s.participationCount > 0)
            .sort((a, b) => b.participationCount - a.participationCount)
            .slice(0, 5)
            .map(s => ({
                id: s.id,
                name: s.name,
                avatarUrl: s.avatarUrl,
                attendanceCount: s.attendanceCount,
                participationCount: s.participationCount,
                participationRate: s.participationRate,
            }));

        // Find isolated students (attended sessions but minimal event participation)
        const isolatedStudents: IsolatedStudent[] = studentMetrics
            .filter(s => s.attendanceCount >= 3 && s.participationCount <= 1)
            .map(s => ({
                id: s.id,
                name: s.name,
                avatarUrl: s.avatarUrl,
                attendanceCount: s.attendanceCount,
                participationCount: s.participationCount,
            }));

        // Find friend groups (students who frequently attend events together)
        const friendGroups: FriendGroup[] = [];
        const processedPairs = new Set<string>();

        for (const event of events) {
            if (event.participants.length >= 2) {
                const participants = event.participants.map(p => p.studentId);

                // Create pairs
                for (let i = 0; i < participants.length; i++) {
                    for (let j = i + 1; j < participants.length; j++) {
                        const pairKey = [participants[i], participants[j]].sort().join('-');
                        processedPairs.add(pairKey);
                    }
                }
            }
        }

        // Group students by common activities
        const pairCounts = new Map<string, number>();
        const pairEvents = new Map<string, Set<string>>();

        for (const event of events) {
            if (event.participants.length >= 2) {
                const participants = event.participants.map(p => p.studentId);

                for (let i = 0; i < participants.length; i++) {
                    for (let j = i + 1; j < participants.length; j++) {
                        const pairKey = [participants[i], participants[j]].sort().join('-');
                        pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);

                        if (!pairEvents.has(pairKey)) {
                            pairEvents.set(pairKey, new Set());
                        }
                        pairEvents.get(pairKey)!.add(event.title);
                    }
                }
            }
        }

        // Create groups from pairs with high co-occurrence (3+ common events)
        const strongPairs = Array.from(pairCounts.entries())
            .filter(([_, count]) => count >= 3)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        for (const [pairKey, count] of strongPairs) {
            const [id1, id2] = pairKey.split('-');
            const student1 = classroom.students.find(s => s.id === id1);
            const student2 = classroom.students.find(s => s.id === id2);

            if (student1 && student2) {
                const eventNames = Array.from(pairEvents.get(pairKey) || []);

                friendGroups.push({
                    students: [
                        {
                            id: student1.id,
                            name: `${student1.firstName || ''} ${student1.lastName || ''}`.trim(),
                            avatarUrl: student1.avatarUrl || undefined,
                        },
                        {
                            id: student2.id,
                            name: `${student2.firstName || ''} ${student2.lastName || ''}`.trim(),
                            avatarUrl: student2.avatarUrl || undefined,
                        },
                    ],
                    commonActivities: count,
                    activityNames: eventNames,
                });
            }
        }

        // Calculate activity statistics
        const totalParticipations = events.reduce((sum, event) => sum + event.participants.length, 0);
        const averageParticipationRate =
            events.length > 0 && classroom.students.length > 0
                ? (totalParticipations / (events.length * classroom.students.length)) * 100
                : 0;

        // Find most and least popular activities
        const eventTypeStats = events.reduce((stats, event) => {
            const typeName = event.eventType.name;
            if (!stats[typeName]) {
                stats[typeName] = 0;
            }
            stats[typeName] += event.participants.length;
            return stats;
        }, {} as Record<string, number>);

        const sortedTypes = Object.entries(eventTypeStats).sort((a, b) => b[1] - a[1]);
        const mostPopularActivity = sortedTypes[0]?.[0];
        const leastPopularActivity = sortedTypes[sortedTypes.length - 1]?.[0];

        // Weekly trend (last 8 weeks)
        const weeklyTrend = events.slice(0, 8).map(event => ({
            week: new Date(event.eventDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
            count: event.participants.length,
        })).reverse();

        const activityStats: ActivityStats = {
            totalActivities: events.length,
            totalParticipations,
            averageParticipationRate,
            mostPopularActivity,
            leastPopularActivity,
            weeklyTrend,
        };

        return {
            groupLeaders,
            isolatedStudents,
            friendGroups,
            activityStats,
            classroomInfo: {
                name: classroom.name,
                totalStudents: classroom.students.length,
                tutorName: `${classroom.tutor.firstName || ''} ${classroom.tutor.lastName || ''}`.trim(),
            },
        };
    } catch (error) {
        console.error('Error in getSociometricData:', error);
        throw error;
    }
}
