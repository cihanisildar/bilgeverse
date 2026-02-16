'use server';

import prisma from '@/lib/prisma';
import { OrientationDecision, OrientationStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { hasRole } from '@/app/lib/auth-utils';

export async function createStudentManual(formData: any) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, [UserRole.ADMIN, UserRole.BOARD_MEMBER])) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const {
            username,
            password,
            firstName,
            lastName,
            tutorId,
            firstImpressionNotes
        } = formData;

        const email = `${username.toLowerCase()}@ogrtakip.com`;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await prisma.$transaction(async (tx) => {
            // 1. Find or create tutor's classroom
            let classroomId = undefined;
            const tutorClassroom = await tx.classroom.findUnique({
                where: { tutorId: tutorId }
            });

            if (tutorClassroom) {
                classroomId = tutorClassroom.id;
            } else {
                const tutor = await tx.user.findUnique({
                    where: { id: tutorId },
                    select: { firstName: true, lastName: true, username: true }
                });

                if (tutor) {
                    const classroomName = tutor.firstName && tutor.lastName
                        ? `${tutor.firstName} ${tutor.lastName} Sınıfı`
                        : `${tutor.username} Sınıfı`;

                    const newClassroom = await tx.classroom.create({
                        data: {
                            name: classroomName,
                            tutorId: tutorId,
                        }
                    });
                    classroomId = newClassroom.id;
                }
            }

            // 2. Create the user
            const newUser = await tx.user.create({
                data: {
                    username: username.toLowerCase(),
                    email: email,
                    password: hashedPassword,
                    role: UserRole.STUDENT,
                    roles: [UserRole.STUDENT],
                    tutorId,
                    studentClassroomId: classroomId,
                    firstName,
                    lastName,
                    firstImpressionNotes,
                    orientationStatus: OrientationStatus.ONGOING,
                }
            });

            // 3. Initialize OrientationProcess
            await tx.orientationProcess.create({
                data: {
                    studentId: newUser.id,
                    status: OrientationStatus.ONGOING,
                }
            });

            return newUser;
        });

        revalidatePath('/dashboard/part10/admin');
        return { error: null, data: { ...result } };
    } catch (error: any) {
        console.error('Error creating student manually:', error);
        return { error: error.message || 'Öğrenci oluşturulurken bir hata oluştu', data: null };
    }
}

export async function updateOrientationNotes(studentId: string, week: 1 | 2 | 3, notes: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, [UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN, UserRole.BOARD_MEMBER])) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const field = week === 1 ? 'week1Notes' : week === 2 ? 'week2Notes' : 'week3Notes';

        const updated = await prisma.orientationProcess.update({
            where: { studentId },
            data: { [field]: notes }
        });

        revalidatePath(`/dashboard/part10/admin/orientation/${studentId}`);
        return { error: null, data: { ...updated } };
    } catch (error: any) {
        console.error('Error updating orientation notes:', error);
        return { error: error.message || 'Not güncellenirken bir hata oluştu', data: null };
    }
}

export async function finalizeOrientation(
    studentId: string,
    decision: OrientationDecision,
    notes: string,
    adminId: string
) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, [UserRole.ADMIN, UserRole.BOARD_MEMBER])) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const result = await prisma.$transaction(async (tx) => {
            // Update OrientationProcess
            await tx.orientationProcess.update({
                where: { studentId },
                data: {
                    status: OrientationStatus.COMPLETED,
                    decision: decision,
                    decisionNotes: notes,
                    decisionDate: new Date(),
                    decidedById: adminId
                }
            });

            // Update User orientation status
            const updatedUser = await tx.user.update({
                where: { id: studentId },
                data: {
                    orientationStatus: OrientationStatus.COMPLETED,
                    isActive: decision === OrientationDecision.ACCEPTED
                }
            });

            return updatedUser;
        });

        revalidatePath('/dashboard/part10/admin');
        revalidatePath(`/dashboard/part10/admin/orientation/${studentId}`);
        return { error: null, data: { ...result } };
    } catch (error: any) {
        console.error('Error finalizing orientation:', error);
        return { error: error.message || 'Karar kaydedilirken bir hata oluştu', data: null };
    }
}

export async function expelStudent(
    studentId: string,
    reason: string,
    adminId: string,
    notes?: string
) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, [UserRole.ADMIN, UserRole.BOARD_MEMBER])) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const student = await prisma.user.findUnique({
            where: { id: studentId }
        });

        if (!student) throw new Error('Öğrenci bulunamadı');

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create ExpulsionRecord (persist even if user is de-activated)
            const record = await tx.expulsionRecord.create({
                data: {
                    studentName: student.firstName || '',
                    studentSurname: student.lastName || '',
                    username: student.username,
                    email: student.email,
                    phone: student.phone,
                    responsibleId: adminId,
                    reason: reason,
                    notes: notes,
                }
            });

            // 2. Deactivate student
            await tx.user.update({
                where: { id: studentId },
                data: {
                    isActive: false,
                    orientationStatus: OrientationStatus.COMPLETED // Force complete if kicked out during orientation
                }
            });

            return record;
        });

        revalidatePath('/dashboard/part10/admin');
        revalidatePath('/dashboard/part10/admin/expulsions');
        return { error: null, data: { ...result } };
    } catch (error: any) {
        console.error('Error expelling student:', error);
        return { error: error.message || 'İhraç kaydı oluşturulurken bir hata oluştu', data: null };
    }
}

// --- Getter Actions for TanStack Query ---

export async function getOrientationStudents() {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, [UserRole.ADMIN, UserRole.BOARD_MEMBER, UserRole.TUTOR, UserRole.ASISTAN])) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const students = await prisma.user.findMany({
            where: {
                role: UserRole.STUDENT,
                orientationStatus: OrientationStatus.ONGOING,
            },
            include: {
                orientationProcess: true,
                tutor: {
                    select: {
                        firstName: true,
                        lastName: true,
                        username: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return { error: null, data: students };
    } catch (error) {
        console.error('Error fetching orientation students:', error);
        return { error: 'Oryantasyon sürecindeki öğrenciler yüklenemedi', data: null };
    }
}

export async function getExpulsionRecords() {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, [UserRole.ADMIN, UserRole.BOARD_MEMBER])) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const records = await prisma.expulsionRecord.findMany({
            include: {
                responsible: {
                    select: {
                        firstName: true,
                        lastName: true,
                        username: true
                    }
                }
            },
            orderBy: {
                expulsionDate: 'desc'
            }
        });

        return { error: null, data: records };
    } catch (error) {
        console.error('Error fetching expulsion records:', error);
        return { error: 'İhraç kayıtları yüklenemedi', data: null };
    }
}

export async function getStudentDetail(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, [UserRole.ADMIN, UserRole.BOARD_MEMBER, UserRole.TUTOR, UserRole.ASISTAN])) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const student = await prisma.user.findUnique({
            where: { id },
            include: {
                orientationProcess: true,
                tutor: {
                    select: {
                        firstName: true,
                        lastName: true,
                        username: true
                    }
                }
            }
        });

        return { error: null, data: student };
    } catch (error) {
        console.error('Error fetching student detail:', error);
        return { error: 'Öğrenci detayları yüklenemedi', data: null };
    }
}

export async function getTutors() {
    try {
        const tutors = await prisma.user.findMany({
            where: {
                OR: [
                    { role: UserRole.TUTOR },
                    { role: UserRole.ASISTAN },
                    { roles: { hasSome: [UserRole.TUTOR, UserRole.ASISTAN] } }
                ]
            },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
            },
            orderBy: {
                firstName: 'asc'
            }
        });

        return { error: null, data: tutors };
    } catch (error) {
        console.error('Error fetching tutors:', error);
        return { error: 'Rehberler yüklenemedi', data: null };
    }
}
