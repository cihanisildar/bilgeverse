'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@prisma/client';
import { requireActionAuth } from '@/app/lib/auth-utils';
import { AcademyLesson, ActionResult } from '@/types/academy';

// Temporary type shim for Prisma models that haven't been generated yet
// This avoids using 'any' everywhere while bypassing the missing type errors
type TypedPrisma = typeof prisma & {
    academyLesson: any;
    academyAssignment: any;
    academyStudent: any;
    academySyllabus: any;
    academySyllabusItem: any;
    academySession: any;
    academyAttendance: any;
};

const p = prisma as unknown as TypedPrisma;

/**
 * Standardized error logger
 */
function handleError<T>(message: string, error: unknown): ActionResult<T> {
    console.error(`[Academy Action Error] ${message}:`, error);
    return { error: message, data: null };
}

/**
 * Creates a new Academy Lesson.
 * Requires ADMIN or BOARD_MEMBER role.
 */
export async function createAcademyLesson(data: {
    name: string;
    description?: string;
    imageUrl?: string;
}): Promise<ActionResult<AcademyLesson>> {
    const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.BOARD_MEMBER]);
    if (error) return { error, data: null };

    try {
        const lesson = await p.academyLesson.create({ data });
        revalidatePath('/dashboard/part11');
        return JSON.parse(JSON.stringify({ error: null, data: lesson }));
    } catch (err) {
        return handleError('Ders oluşturulurken bir hata oluştu.', err);
    }
}

/**
 * Updates an existing Academy Lesson.
 */
export async function updateAcademyLesson(id: string, data: {
    name?: string;
    description?: string;
    imageUrl?: string;
}): Promise<ActionResult<AcademyLesson>> {
    const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.BOARD_MEMBER]);
    if (error) return { error, data: null };

    try {
        const lesson = await p.academyLesson.update({
            where: { id },
            data,
        });
        revalidatePath('/dashboard/part11');
        revalidatePath(`/dashboard/part11/lesson/${id}`);
        return JSON.parse(JSON.stringify({ error: null, data: lesson }));
    } catch (err) {
        return handleError('Ders güncellenirken bir hata oluştu.', err);
    }
}

/**
 * Deletes an Academy Lesson.
 */
export async function deleteAcademyLesson(id: string): Promise<ActionResult<{ success: boolean }>> {
    const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.BOARD_MEMBER]);
    if (error) return { error, data: null };

    try {
        await p.academyLesson.delete({ where: { id } });
        revalidatePath('/dashboard/part11');
        return { error: null, data: { success: true } };
    } catch (err) {
        return handleError('Ders silinirken bir hata oluştu.', err);
    }
}

/**
 * Assigns a tutor or assistant to a lesson.
 */
export async function assignToAcademyLesson(lessonId: string, userId: string, role: UserRole): Promise<ActionResult> {
    const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.BOARD_MEMBER]);
    if (error) return { error, data: null };

    try {
        const assignment = await p.academyAssignment.upsert({
            where: { lessonId_userId: { lessonId, userId } },
            update: { role },
            create: { lessonId, userId, role },
        });
        revalidatePath(`/dashboard/part11/lesson/${lessonId}`);
        return JSON.parse(JSON.stringify({ error: null, data: assignment }));
    } catch (err) {
        return handleError('Görevli atanırken bir hata oluştu.', err);
    }
}

/**
 * Removes assignment
 */
export async function removeAssignmentFromAcademyLesson(lessonId: string, userId: string): Promise<ActionResult<{ success: boolean }>> {
    const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.BOARD_MEMBER]);
    if (error) return { error, data: null };

    try {
        await p.academyAssignment.delete({
            where: { lessonId_userId: { lessonId, userId } },
        });
        revalidatePath(`/dashboard/part11/lesson/${lessonId}`);
        return JSON.parse(JSON.stringify({ error: null, data: { success: true } }));
    } catch (err) {
        return handleError('Görevli kaldırılırken bir hata oluştu.', err);
    }
}

/**
 * Student enrollment
 */
export async function enrollStudentInAcademyLesson(lessonId: string, studentId: string): Promise<ActionResult> {
    const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.BOARD_MEMBER, UserRole.TUTOR, UserRole.ASISTAN]);
    if (error) return { error, data: null };

    try {
        const enrollment = await p.academyStudent.create({
            data: { lessonId, studentId },
        });
        revalidatePath(`/dashboard/part11/lesson/${lessonId}`);
        return JSON.parse(JSON.stringify({ error: null, data: enrollment }));
    } catch (err) {
        return handleError('Öğrenci kaydedilirken bir hata oluştu.', err);
    }
}

/**
 * Student unenrollment
 */
export async function unenrollStudentFromAcademyLesson(lessonId: string, studentId: string): Promise<ActionResult<{ success: boolean }>> {
    const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.BOARD_MEMBER, UserRole.TUTOR, UserRole.ASISTAN]);
    if (error) return { error, data: null };

    try {
        await p.academyStudent.delete({
            where: { lessonId_studentId: { lessonId, studentId } },
        });
        revalidatePath(`/dashboard/part11/lesson/${lessonId}`);
        return JSON.parse(JSON.stringify({ error: null, data: { success: true } }));
    } catch (err) {
        return handleError('Öğrenci kaydı silinirken bir hata oluştu.', err);
    }
}

/**
 * Syllabus update
 */
export async function updateAcademySyllabus(lessonId: string, items: {
    title: string;
    description?: string;
    orderIndex: number;
}[]): Promise<ActionResult<{ success: boolean }>> {
    const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.BOARD_MEMBER, UserRole.TUTOR, UserRole.ASISTAN]);
    if (error) return { error, data: null };

    try {
        return await p.$transaction(async (tx: any) => {
            const syllabus = await tx.academySyllabus.upsert({
                where: { lessonId },
                update: { updatedAt: new Date() },
                create: { lessonId },
            });

            await tx.academySyllabusItem.deleteMany({
                where: { syllabusId: syllabus.id },
            });

            if (items.length > 0) {
                await tx.academySyllabusItem.createMany({
                    data: items.map(item => ({
                        ...item,
                        syllabusId: syllabus.id,
                    })),
                });
            }

            revalidatePath(`/dashboard/part11/lesson/${lessonId}`);
            return JSON.parse(JSON.stringify({ error: null, data: { success: true } }));
        });
    } catch (err) {
        return handleError('Müfredat güncellenirken bir hata oluştu.', err);
    }
}

/**
 * Session creation
 */
export async function createAcademySession(data: {
    lessonId: string;
    tutorId: string;
    title: string;
    description?: string;
    date: string;
    startTime?: string;
    endTime?: string;
}): Promise<ActionResult> {
    const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.BOARD_MEMBER, UserRole.TUTOR, UserRole.ASISTAN]);
    if (error) return { error, data: null };

    try {
        const formattedData = {
            ...data,
            date: new Date(data.date)
        };
        const session = await p.academySession.create({ data: formattedData });
        revalidatePath(`/dashboard/part11/lesson/${data.lessonId}`);
        return JSON.parse(JSON.stringify({ error: null, data: session }));
    } catch (err) {
        return handleError('Oturum oluşturulurken bir hata oluştu.', err);
    }
}

/**
 * Attendance recording
 */
export async function recordAcademyAttendance(sessionId: string, attendances: {
    studentId: string;
    status: boolean;
}[]): Promise<ActionResult<{ success: boolean }>> {
    const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.BOARD_MEMBER, UserRole.TUTOR, UserRole.ASISTAN]);
    if (error) return { error, data: null };

    try {
        const ops = attendances.map(att => p.academyAttendance.upsert({
            where: { sessionId_studentId: { sessionId, studentId: att.studentId } },
            update: { status: att.status, checkInTime: att.status ? new Date() : null },
            create: { sessionId, studentId: att.studentId, status: att.status, checkInTime: att.status ? new Date() : null },
        }));

        await p.$transaction(ops);

        const session = await p.academySession.findUnique({
            where: { id: sessionId },
            select: { lessonId: true },
        });

        if (session) {
            revalidatePath(`/dashboard/part11/lesson/${session.lessonId}`);
        }
        return JSON.parse(JSON.stringify({ error: null, data: { success: true } }));
    } catch (err) {
        return handleError('Yoklama kaydedilirken bir hata oluştu.', err);
    }
}

/**
 * Fetch lessons
 */
export async function getAcademyLessons(): Promise<ActionResult<AcademyLesson[]>> {
    try {
        const lessons = await p.academyLesson.findMany({
            include: {
                assignments: { include: { user: true } },
                _count: { select: { students: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return JSON.parse(JSON.stringify({ error: null, data: lessons }));
    } catch (err) {
        return handleError('Dersler yüklenirken bir hata oluştu.', err);
    }
}

/**
 * Fetch lesson details
 */
export async function getAcademyLessonDetails(id: string): Promise<ActionResult<AcademyLesson>> {
    try {
        const lesson = await p.academyLesson.findUnique({
            where: { id },
            include: {
                assignments: { include: { user: true } },
                students: { include: { student: true } },
                syllabus: {
                    include: { items: { orderBy: { orderIndex: 'asc' } } },
                },
                sessions: {
                    include: { attendances: true },
                    orderBy: { date: 'desc' },
                },
            },
        });
        if (!lesson) return { error: 'Ders bulunamadı.', data: null };
        return JSON.parse(JSON.stringify({ error: null, data: lesson }));
    } catch (err) {
        return handleError('Ders detayları yüklenirken bir hata oluştu.', err);
    }
}
