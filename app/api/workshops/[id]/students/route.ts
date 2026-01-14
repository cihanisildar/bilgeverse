    import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

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
        const { studentIds } = body;

        if (!studentIds || !Array.isArray(studentIds)) {
            return NextResponse.json({ error: 'Student IDs array is required' }, { status: 400 });
        }

        // Check permissions
        const isAdmin = session.user.role === UserRole.ADMIN;
        const isBoardMember = session.user.role === UserRole.BOARD_MEMBER;

        // Check if user is an assigned tutor for this workshop
        const assignment = await prisma.workshopAssignment.findUnique({
            where: {
                workshopId_userId: {
                    workshopId: params.id,
                    userId: session.user.id
                }
            }
        });

        if (!isAdmin && !isBoardMember && !assignment) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // If tutor, verify they only add their own students
        if (!isAdmin && !isBoardMember && assignment) {
            const students = await prisma.user.findMany({
                where: {
                    id: { in: studentIds },
                    tutorId: session.user.id
                },
                select: { id: true }
            });
            const validStudentIds = students.map(s => s.id);
            if (validStudentIds.length !== studentIds.length) {
                return NextResponse.json({ error: 'Forbidden: You can only add your own students' }, { status: 403 });
            }
        }

        // Bulk enrollment
        const enrollments = await Promise.all(studentIds.map(async (studentId) => {
            return prisma.workshopStudent.upsert({
                where: {
                    workshopId_studentId: {
                        workshopId: params.id,
                        studentId: studentId
                    }
                },
                update: {}, // No update needed if exists
                create: {
                    workshopId: params.id,
                    studentId: studentId
                }
            });
        }));

        return NextResponse.json({ success: true, count: enrollments.length });
    } catch (error) {
        console.error('Error in bulk student enrollment:', error);
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

        // Return users that are NOT yet in this workshop
        // but are eligible to join (STUDENT role)

        let whereClause: any = {
            role: UserRole.STUDENT,
            workshopMemberships: {
                none: {
                    workshopId: params.id
                }
            }
        };

        // If tutor, only show their students
        if (session.user.role === UserRole.TUTOR) {
            whereClause.tutorId = session.user.id;
        }

        const eligibleStudents = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                username: true
            },
            orderBy: { firstName: 'asc' }
        });

        return NextResponse.json(eligibleStudents);
    } catch (error) {
        console.error('Error fetching eligible students:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
        }

        // Check permissions
        const isAdmin = session.user.role === UserRole.ADMIN;
        const isBoardMember = session.user.role === UserRole.BOARD_MEMBER;

        const assignment = await prisma.workshopAssignment.findUnique({
            where: {
                workshopId_userId: {
                    workshopId: params.id,
                    userId: session.user.id
                }
            }
        });

        if (!isAdmin && !isBoardMember && !assignment) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // If tutor, verify they only remove their own students
        if (!isAdmin && !isBoardMember && assignment) {
            const student = await prisma.user.findUnique({
                where: { id: studentId },
                select: { tutorId: true }
            });

            if (!student || student.tutorId !== session.user.id) {
                return NextResponse.json({ error: 'Forbidden: You can only remove your own students' }, { status: 403 });
            }
        }

        await prisma.workshopStudent.delete({
            where: {
                workshopId_studentId: {
                    workshopId: params.id,
                    studentId: studentId
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing student from workshop:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
