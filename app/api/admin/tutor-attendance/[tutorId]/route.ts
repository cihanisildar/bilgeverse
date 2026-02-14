import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET(
    request: Request,
    { params }: { params: { tutorId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);

        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { tutorId } = params;

        // Get tutor information
        const tutor = await prisma.user.findUnique({
            where: {
                id: tutorId,
                roles: { hasSome: [UserRole.TUTOR, UserRole.ASISTAN] }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                students: {
                    where: {
                        isActive: true,
                        roles: { has: UserRole.STUDENT },
                    },
                    select: {
                        id: true,
                    }
                }
            }
        });

        if (!tutor) {
            return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
        }

        // Get all attendance sessions created by this tutor
        const sessions = await prisma.attendanceSession.findMany({
            where: {
                createdById: tutorId,
            },
            include: {
                attendances: {
                    select: {
                        studentId: true,
                    }
                }
            },
            orderBy: {
                sessionDate: 'desc'
            }
        });

        const totalStudents = tutor.students.length;

        // Calculate stats for each session
        const sessionDetails = sessions.map(session => {
            const attendedStudents = session.attendances.length;
            const absentStudents = totalStudents - attendedStudents;
            const attendanceRate = totalStudents > 0
                ? Math.round((attendedStudents / totalStudents) * 100)
                : 0;

            return {
                id: session.id,
                title: session.title,
                sessionDate: session.sessionDate.toISOString(),
                totalStudents,
                attendedStudents,
                absentStudents,
                attendanceRate,
                qrCodeToken: session.qrCodeToken,
            };
        });

        // Calculate overall attendance rate
        const totalAttendances = sessions.reduce((sum, s) => sum + s.attendances.length, 0);
        const totalPossibleAttendances = sessions.length * totalStudents;
        const overallAttendanceRate = totalPossibleAttendances > 0
            ? Math.round((totalAttendances / totalPossibleAttendances) * 100)
            : 0;

        return NextResponse.json({
            success: true,
            tutor: {
                tutorId: tutor.id,
                tutorName: `${tutor.firstName} ${tutor.lastName}`,
                totalStudents,
                sessions: sessionDetails,
                overallAttendanceRate,
                totalSessions: sessions.length,
            }
        });

    } catch (error: unknown) {
        console.error('Error fetching tutor attendance detail:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tutor attendance detail' },
            { status: 500 }
        );
    }
}
