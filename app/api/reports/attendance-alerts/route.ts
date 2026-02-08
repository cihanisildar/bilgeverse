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
        const threshold = searchParams.get('threshold') ? parseInt(searchParams.get('threshold')!) : 70;

        // Get all students with their attendance records
        const students = await prisma.user.findMany({
            where: {
                role: UserRole.STUDENT,
            },
            include: {
                studentAttendances: {
                    include: {
                        session: {
                            select: {
                                sessionDate: true,
                            },
                        },
                    },
                },
                tutor: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        // Get total number of sessions
        const totalSessions = await prisma.attendanceSession.count();

        // Calculate attendance percentage for each student
        const lowAttendanceStudents = students
            .map((student) => {
                const attendanceCount = student.studentAttendances.length;
                const attendancePercentage = totalSessions > 0 ? (attendanceCount / totalSessions) * 100 : 0;

                return {
                    id: student.id,
                    username: student.username,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    email: student.email,
                    phone: student.phone,
                    tutor: student.tutor,
                    attendanceCount,
                    totalSessions,
                    attendancePercentage: Math.round(attendancePercentage * 10) / 10,
                };
            })
            .filter((student) => student.attendancePercentage < threshold)
            .sort((a, b) => a.attendancePercentage - b.attendancePercentage);

        return NextResponse.json({
            students: lowAttendanceStudents,
            threshold,
            totalSessions,
        }, { status: 200 });
    } catch (error: any) {
        console.error('Attendance alerts report error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
