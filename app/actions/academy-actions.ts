'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { UserRole, TransactionType } from '@prisma/client';
import { requireActionAuth } from '@/app/lib/auth-utils';
import { requireActivePeriod } from '@/lib/periods';
import { deleteFromS3 } from '@/lib/s3';
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
    academyMaterial: any;
    academyStudentNote: any;
    academyTask: any;
    academyTaskCompletion: any;
    pointsTransaction: any;
};

const p = prisma as unknown as TypedPrisma;

// Roles allowed to manage academy content (create/edit lessons content, materials, tasks, notes)
const MANAGE_ROLES = [UserRole.ADMIN, UserRole.BOARD_MEMBER, UserRole.TUTOR, UserRole.ASISTAN];

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
    startDate?: string | null;
    capacity?: number | null;
}): Promise<ActionResult<AcademyLesson>> {
    const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.BOARD_MEMBER]);
    if (error) return { error, data: null };

    try {
        const { startDate, capacity, ...rest } = data;
        const lesson = await p.academyLesson.create({
            data: {
                ...rest,
                startDate: startDate ? new Date(startDate) : null,
                capacity: capacity ?? null,
            },
        });
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
    startDate?: string | null;
    capacity?: number | null;
}): Promise<ActionResult<AcademyLesson>> {
    const { error } = await requireActionAuth([UserRole.ADMIN, UserRole.BOARD_MEMBER]);
    if (error) return { error, data: null };

    try {
        const { startDate, capacity, ...rest } = data;
        const updateData: any = { ...rest };
        if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
        if (capacity !== undefined) updateData.capacity = capacity;
        const lesson = await p.academyLesson.update({
            where: { id },
            data: updateData,
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
        // Enforce capacity (kontenjan) before enrolling
        const lesson = await p.academyLesson.findUnique({
            where: { id: lessonId },
            select: { capacity: true, _count: { select: { students: true } } },
        });
        if (lesson?.capacity != null && lesson._count.students >= lesson.capacity) {
            return { error: 'Bu dersin kontenjanı dolu.', data: null };
        }

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
                materials: {
                    include: { uploadedBy: { select: { id: true, firstName: true, lastName: true, username: true } } },
                    orderBy: { createdAt: 'desc' },
                },
                tasks: {
                    include: { completions: true },
                    orderBy: { createdAt: 'desc' },
                },
                notes: {
                    include: {
                        author: { select: { id: true, firstName: true, lastName: true, username: true } },
                        student: { select: { id: true, firstName: true, lastName: true, username: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!lesson) return { error: 'Ders bulunamadı.', data: null };
        return JSON.parse(JSON.stringify({ error: null, data: lesson }));
    } catch (err) {
        return handleError('Ders detayları yüklenirken bir hata oluştu.', err);
    }
}

/* -------------------------------------------------------------------------- */
/*  Materials (#5)                                                            */
/* -------------------------------------------------------------------------- */

export async function createAcademyMaterial(data: {
    lessonId: string;
    title: string;
    description?: string;
    type: 'PDF' | 'VIDEO' | 'DOCUMENT' | 'LINK';
    url: string;
    fileKey?: string;
}): Promise<ActionResult> {
    const { session, error } = await requireActionAuth(MANAGE_ROLES);
    if (error || !session) return { error: error || 'Yetkisiz', data: null };

    try {
        const material = await p.academyMaterial.create({
            data: {
                lessonId: data.lessonId,
                title: data.title,
                description: data.description || null,
                type: data.type,
                url: data.url,
                fileKey: data.fileKey || null,
                uploadedById: session.user.id,
            },
        });
        revalidatePath(`/dashboard/part11/lesson/${data.lessonId}`);
        return JSON.parse(JSON.stringify({ error: null, data: material }));
    } catch (err) {
        return handleError('Materyal eklenirken bir hata oluştu.', err);
    }
}

export async function deleteAcademyMaterial(id: string): Promise<ActionResult<{ success: boolean }>> {
    const { error } = await requireActionAuth(MANAGE_ROLES);
    if (error) return { error, data: null };

    try {
        const material = await p.academyMaterial.findUnique({ where: { id } });
        if (!material) return { error: 'Materyal bulunamadı.', data: null };

        if (material.fileKey) {
            try {
                await deleteFromS3(material.fileKey);
            } catch (s3Err) {
                console.error('[Academy] S3 delete failed:', s3Err);
            }
        }

        await p.academyMaterial.delete({ where: { id } });
        revalidatePath(`/dashboard/part11/lesson/${material.lessonId}`);
        return { error: null, data: { success: true } };
    } catch (err) {
        return handleError('Materyal silinirken bir hata oluştu.', err);
    }
}

/* -------------------------------------------------------------------------- */
/*  Student notes / evaluations / observations (#7)                          */
/* -------------------------------------------------------------------------- */

export async function createAcademyStudentNote(data: {
    lessonId: string;
    studentId: string;
    type: 'NOTE' | 'EVALUATION' | 'OBSERVATION';
    content: string;
}): Promise<ActionResult> {
    const { session, error } = await requireActionAuth(MANAGE_ROLES);
    if (error || !session) return { error: error || 'Yetkisiz', data: null };

    try {
        const note = await p.academyStudentNote.create({
            data: {
                lessonId: data.lessonId,
                studentId: data.studentId,
                authorId: session.user.id,
                type: data.type,
                content: data.content,
            },
        });
        revalidatePath(`/dashboard/part11/lesson/${data.lessonId}`);
        return JSON.parse(JSON.stringify({ error: null, data: note }));
    } catch (err) {
        return handleError('Değerlendirme eklenirken bir hata oluştu.', err);
    }
}

export async function updateAcademyStudentNote(id: string, data: {
    type?: 'NOTE' | 'EVALUATION' | 'OBSERVATION';
    content?: string;
}): Promise<ActionResult> {
    const { error } = await requireActionAuth(MANAGE_ROLES);
    if (error) return { error, data: null };

    try {
        const note = await p.academyStudentNote.update({ where: { id }, data });
        revalidatePath(`/dashboard/part11/lesson/${note.lessonId}`);
        return JSON.parse(JSON.stringify({ error: null, data: note }));
    } catch (err) {
        return handleError('Değerlendirme güncellenirken bir hata oluştu.', err);
    }
}

export async function deleteAcademyStudentNote(id: string): Promise<ActionResult<{ success: boolean }>> {
    const { error } = await requireActionAuth(MANAGE_ROLES);
    if (error) return { error, data: null };

    try {
        const note = await p.academyStudentNote.delete({ where: { id } });
        revalidatePath(`/dashboard/part11/lesson/${note.lessonId}`);
        return { error: null, data: { success: true } };
    } catch (err) {
        return handleError('Değerlendirme silinirken bir hata oluştu.', err);
    }
}

/* -------------------------------------------------------------------------- */
/*  Tasks + Bilge Para rewards (#8)                                          */
/* -------------------------------------------------------------------------- */

export async function createAcademyTask(data: {
    lessonId: string;
    title: string;
    description?: string;
    points: number;
    dueDate?: string | null;
}): Promise<ActionResult> {
    const { session, error } = await requireActionAuth(MANAGE_ROLES);
    if (error || !session) return { error: error || 'Yetkisiz', data: null };

    try {
        const task = await p.academyTask.create({
            data: {
                lessonId: data.lessonId,
                title: data.title,
                description: data.description || null,
                points: data.points || 0,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                createdById: session.user.id,
            },
        });
        revalidatePath(`/dashboard/part11/lesson/${data.lessonId}`);
        return JSON.parse(JSON.stringify({ error: null, data: task }));
    } catch (err) {
        return handleError('Görev oluşturulurken bir hata oluştu.', err);
    }
}

export async function updateAcademyTask(id: string, data: {
    title?: string;
    description?: string;
    points?: number;
    dueDate?: string | null;
}): Promise<ActionResult> {
    const { error } = await requireActionAuth(MANAGE_ROLES);
    if (error) return { error, data: null };

    try {
        const { dueDate, ...rest } = data;
        const updateData: any = { ...rest };
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
        const task = await p.academyTask.update({ where: { id }, data: updateData });
        revalidatePath(`/dashboard/part11/lesson/${task.lessonId}`);
        return JSON.parse(JSON.stringify({ error: null, data: task }));
    } catch (err) {
        return handleError('Görev güncellenirken bir hata oluştu.', err);
    }
}

export async function deleteAcademyTask(id: string): Promise<ActionResult<{ success: boolean }>> {
    const { error } = await requireActionAuth(MANAGE_ROLES);
    if (error) return { error, data: null };

    try {
        const task = await p.academyTask.delete({ where: { id } });
        revalidatePath(`/dashboard/part11/lesson/${task.lessonId}`);
        return { error: null, data: { success: true } };
    } catch (err) {
        return handleError('Görev silinirken bir hata oluştu.', err);
    }
}

/**
 * Marks a task complete for a student and awards Bilge Para (points)
 * through the standard period-aware PointsTransaction system.
 */
export async function completeAcademyTask(taskId: string, studentId: string): Promise<ActionResult> {
    const { session, error } = await requireActionAuth(MANAGE_ROLES);
    if (error || !session) return { error: error || 'Yetkisiz', data: null };

    try {
        const task = await p.academyTask.findUnique({ where: { id: taskId } });
        if (!task) return { error: 'Görev bulunamadı.', data: null };

        // Idempotency: don't double-award
        const existing = await p.academyTaskCompletion.findUnique({
            where: { taskId_studentId: { taskId, studentId } },
        });
        if (existing) return JSON.parse(JSON.stringify({ error: null, data: existing }));

        const activePeriod = await requireActivePeriod();

        const result = await prisma.$transaction(async (tx: any) => {
            let pointsTransactionId: string | null = null;

            if (task.points > 0) {
                const pt = await tx.pointsTransaction.create({
                    data: {
                        studentId,
                        tutorId: session.user.id,
                        points: task.points,
                        type: TransactionType.AWARD,
                        reason: `Akademi Görevi: ${task.title}`,
                        periodId: activePeriod.id,
                    },
                });
                pointsTransactionId = pt.id;
            }

            return tx.academyTaskCompletion.create({
                data: {
                    taskId,
                    studentId,
                    awardedById: session.user.id,
                    pointsTransactionId,
                },
            });
        });

        revalidatePath(`/dashboard/part11/lesson/${task.lessonId}`);
        return JSON.parse(JSON.stringify({ error: null, data: result }));
    } catch (err) {
        return handleError('Görev tamamlanırken bir hata oluştu.', err);
    }
}

/**
 * Reverses a task completion: removes the completion and rolls back
 * the awarded points transaction.
 */
export async function uncompleteAcademyTask(taskId: string, studentId: string): Promise<ActionResult<{ success: boolean }>> {
    const { error } = await requireActionAuth(MANAGE_ROLES);
    if (error) return { error, data: null };

    try {
        const completion = await p.academyTaskCompletion.findUnique({
            where: { taskId_studentId: { taskId, studentId } },
            include: { task: { select: { lessonId: true } } },
        });
        if (!completion) return { error: 'Tamamlama kaydı bulunamadı.', data: null };

        await prisma.$transaction(async (tx: any) => {
            if (completion.pointsTransactionId) {
                await tx.pointsTransaction.update({
                    where: { id: completion.pointsTransactionId },
                    data: { rolledBack: true },
                });
            }
            await tx.academyTaskCompletion.delete({
                where: { taskId_studentId: { taskId, studentId } },
            });
        });

        revalidatePath(`/dashboard/part11/lesson/${completion.task.lessonId}`);
        return { error: null, data: { success: true } };
    } catch (err) {
        return handleError('Görev tamamlaması geri alınırken bir hata oluştu.', err);
    }
}

/* -------------------------------------------------------------------------- */
/*  Activity report (#9)                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Computes an on-demand activity report for a lesson:
 * per-student attendance rate, absences, completed tasks, and Bilge Para earned.
 */
export async function getAcademyLessonReport(lessonId: string): Promise<ActionResult> {
    const { error } = await requireActionAuth(MANAGE_ROLES);
    if (error) return { error, data: null };

    try {
        const lesson = await p.academyLesson.findUnique({
            where: { id: lessonId },
            include: {
                students: {
                    include: { student: { select: { id: true, firstName: true, lastName: true, username: true } } },
                },
                sessions: { include: { attendances: true } },
                tasks: { include: { completions: true } },
            },
        });
        if (!lesson) return { error: 'Ders bulunamadı.', data: null };

        const totalSessions: number = lesson.sessions.length;
        const totalTasks: number = lesson.tasks.length;

        const studentReports = lesson.students.map((enrollment: any) => {
            const studentId = enrollment.studentId;

            const attendedSessions = lesson.sessions.filter((s: any) =>
                s.attendances.some((a: any) => a.studentId === studentId && a.status === true)
            ).length;
            const absentSessions = totalSessions - attendedSessions;
            const attendanceRate = totalSessions > 0
                ? Math.round((attendedSessions / totalSessions) * 100)
                : 0;

            const completedTasks = lesson.tasks.filter((t: any) =>
                t.completions.some((c: any) => c.studentId === studentId)
            );
            const earnedPoints = lesson.tasks.reduce((sum: number, t: any) => {
                const done = t.completions.some((c: any) => c.studentId === studentId);
                return sum + (done ? t.points : 0);
            }, 0);

            return {
                studentId,
                student: enrollment.student,
                attendedSessions,
                absentSessions,
                attendanceRate,
                completedTasks: completedTasks.length,
                earnedPoints,
            };
        });

        const summary = {
            lessonName: lesson.name,
            totalStudents: lesson.students.length,
            totalSessions,
            totalTasks,
            averageAttendanceRate: studentReports.length > 0
                ? Math.round(studentReports.reduce((s: number, r: any) => s + r.attendanceRate, 0) / studentReports.length)
                : 0,
            totalPointsAwarded: studentReports.reduce((s: number, r: any) => s + r.earnedPoints, 0),
            generatedAt: new Date().toISOString(),
        };

        return JSON.parse(JSON.stringify({ error: null, data: { summary, studentReports } }));
    } catch (err) {
        return handleError('Rapor oluşturulurken bir hata oluştu.', err);
    }
}
