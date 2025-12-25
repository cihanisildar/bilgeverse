import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only admins can delete syllabi
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const syllabusId = params.id;

        // Delete the syllabus (cascade will handle related records)
        await prisma.syllabus.delete({
            where: { id: syllabusId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting syllabus:', error);
        return NextResponse.json(
            { error: 'Failed to delete syllabus' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only admins can edit syllabi
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
        }

        const syllabusId = params.id;
        const body = await request.json();

        const { title, description, driveLink, isPublished, lessons } = body;

        // Update syllabus and lessons in a transaction
        const updatedSyllabus = await prisma.$transaction(async (tx) => {
            // Update syllabus basic info
            const syllabus = await tx.syllabus.update({
                where: { id: syllabusId },
                data: {
                    title,
                    description,
                    driveLink,
                    isPublished,
                },
            });

            // Handle lessons if provided
            if (lessons && Array.isArray(lessons)) {
                // Get existing lessons
                const existingLessons = await tx.syllabusLesson.findMany({
                    where: { syllabusId },
                });

                const existingLessonIds = existingLessons.map(l => l.id);
                const incomingLessonIds = lessons.filter(l => l.id).map(l => l.id);

                // Delete lessons that are not in the incoming list
                const lessonsToDelete = existingLessonIds.filter(id => !incomingLessonIds.includes(id));
                if (lessonsToDelete.length > 0) {
                    await tx.syllabusLesson.deleteMany({
                        where: {
                            id: { in: lessonsToDelete },
                        },
                    });
                }

                // Update or create lessons
                for (const lesson of lessons) {
                    if (lesson.id) {
                        // Update existing lesson
                        await tx.syllabusLesson.update({
                            where: { id: lesson.id },
                            data: {
                                title: lesson.title,
                                description: lesson.description,
                                driveLink: lesson.driveLink,
                                orderIndex: lesson.orderIndex,
                            },
                        });
                    } else {
                        // Create new lesson
                        await tx.syllabusLesson.create({
                            data: {
                                syllabusId,
                                title: lesson.title,
                                description: lesson.description,
                                driveLink: lesson.driveLink,
                                orderIndex: lesson.orderIndex,
                            },
                        });
                    }
                }
            }

            return syllabus;
        });

        return NextResponse.json(updatedSyllabus);
    } catch (error) {
        console.error('Error updating syllabus:', error);
        return NextResponse.json(
            { error: 'Failed to update syllabus' },
            { status: 500 }
        );
    }
}
