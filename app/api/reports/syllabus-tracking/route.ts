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

        // Get all syllabi with their progress
        const syllabi = await prisma.syllabus.findMany({
            include: {
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                lessons: {
                    orderBy: {
                        orderIndex: 'asc',
                    },
                },
                classroomProgress: {
                    include: {
                        classroom: {
                            select: {
                                id: true,
                                name: true,
                                tutorId: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const report = syllabi.map((syllabus) => {
            const totalLessons = syllabus.lessons.length;
            const taughtLessons = syllabus.classroomProgress.filter((p) => p.isTaught).length;
            const progressPercentage = totalLessons > 0 ? (taughtLessons / totalLessons) * 100 : 0;

            return {
                syllabus: {
                    id: syllabus.id,
                    title: syllabus.title,
                    isGlobal: syllabus.isGlobal,
                },
                tutor: syllabus.createdBy,
                totalLessons,
                taughtLessons,
                progressPercentage: Math.round(progressPercentage),
                classrooms: syllabus.classroomProgress.map((p) => ({
                    classroomId: p.classroom.id,
                    classroomName: p.classroom.name,
                    isTaught: p.isTaught,
                    taughtDate: p.taughtDate,
                })),
            };
        });

        return NextResponse.json({ report }, { status: 200 });
    } catch (error: any) {
        console.error('Syllabus tracking report error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
