import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole, CheckInMethod } from '@prisma/client';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { studentId, qrToken, method = CheckInMethod.MANUAL } = body;

        const activity = await prisma.workshopActivity.findUnique({
            where: { id: params.id },
            include: { workshop: true }
        });

        if (!activity) {
            return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
        }

        // QR Check-in Logic
        if (method === CheckInMethod.QR) {
            if (qrToken !== activity.qrCodeToken) {
                return NextResponse.json({ error: 'Invalid QR token' }, { status: 400 });
            }
            // If student is checking themselves in
            const finalStudentId = studentId || session.user.id;

            // Verify student is enrolled in the workshop
            const enrollment = await prisma.workshopStudent.findUnique({
                where: {
                    workshopId_studentId: {
                        workshopId: activity.workshopId,
                        studentId: finalStudentId,
                    },
                },
            });

            if (!enrollment) {
                return NextResponse.json({
                    error: 'Not enrolled in this workshop. Please request to join the workshop first.'
                }, { status: 403 });
            }

            const attendance = await prisma.workshopAttendance.upsert({
                where: {
                    activityId_studentId: {
                        activityId: params.id,
                        studentId: finalStudentId,
                    },
                },
                update: {
                    status: true,
                    checkInMethod: CheckInMethod.QR,
                    checkInTime: new Date(),
                },
                create: {
                    activityId: params.id,
                    studentId: finalStudentId,
                    status: true,
                    checkInMethod: CheckInMethod.QR,
                    checkInTime: new Date(),
                },
            });
            return NextResponse.json(attendance);
        }

        // Manual Check-in Logic (Requires Tutor/Board/Admin)
        const isAuthorized = session.user.role === UserRole.ADMIN || session.user.role === UserRole.BOARD_MEMBER;

        if (!isAuthorized) {
            const assignment = await prisma.workshopAssignment.findUnique({
                where: {
                    workshopId_userId: {
                        workshopId: activity.workshopId,
                        userId: session.user.id,
                    },
                },
            });
            if (!assignment || assignment.role !== UserRole.TUTOR) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        if (!studentId) {
            return NextResponse.json({ error: 'Student ID is required for manual check-in' }, { status: 400 });
        }

        const attendance = await prisma.workshopAttendance.upsert({
            where: {
                activityId_studentId: {
                    activityId: params.id,
                    studentId: studentId,
                },
            },
            update: {
                status: body.status !== undefined ? body.status : true,
                checkInMethod: CheckInMethod.MANUAL,
                checkInTime: new Date(),
            },
            create: {
                activityId: params.id,
                studentId: studentId,
                status: body.status !== undefined ? body.status : true,
                checkInMethod: CheckInMethod.MANUAL,
                checkInTime: new Date(),
            },
        });

        return NextResponse.json(attendance);
    } catch (error) {
        console.error('Error marking attendance:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const activity = await prisma.workshopActivity.findUnique({
            where: { id: params.id },
            select: { workshopId: true }
        });

        if (!activity) {
            return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
        }

        // Get all students enrolled in the workshop
        const workshopStudents = await prisma.workshopStudent.findMany({
            where: { workshopId: activity.workshopId },
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
        });

        // Get existing attendance for this activity
        const attendances = await prisma.workshopAttendance.findMany({
            where: { activityId: params.id },
        });

        // Map students with their attendance status
        const results = workshopStudents.map(ws => {
            const attendance = attendances.find(a => a.studentId === ws.studentId);
            return {
                student: ws.student,
                studentId: ws.studentId,
                status: attendance ? attendance.status : false,
                checkInMethod: attendance?.checkInMethod || null,
                checkInTime: attendance?.checkInTime || null,
            };
        });

        return NextResponse.json(results);
    } catch (error) {
        console.error('Error fetching attendances:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
