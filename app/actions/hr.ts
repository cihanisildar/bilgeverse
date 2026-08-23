'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole, Prisma } from '@prisma/client';
import { hasRole } from '@/app/lib/auth-utils';
import { requirePartLicense } from '@/app/lib/permissions.server';
import { revalidatePath } from 'next/cache';

const MANAGE_ROLES = [UserRole.ADMIN, UserRole.BOARD_MEMBER];

/**
 * Bu dosyadaki işlemler İKİ ayrı modüle dağılıyor, o yüzden paket kapısı
 * fonksiyon başına veriliyor:
 *   HR_PART     — mezunlar, burslular, rehber adayları, eğitim takibi (İnsan Kaynağı)
 *   GROUPS_PART — Değerler Halkası grupları ve rehber durumu (sayfa part2'ye taşındı)
 */
const HR_PART = 3;
const GROUPS_PART = 2;

/** Yalnız kurum paketi aranır — okuma uçları için. */
async function requireLicense(partId: number) {
    const gate = await requirePartLicense(partId);
    return gate.error ? { ok: false as const, error: gate.error } : { ok: true as const, error: null };
}

async function requireManager(partId: number) {
    const gate = await requirePartLicense(partId);
    if (gate.error) return { ok: false as const, error: gate.error, userId: null };
    if (!hasRole(gate.session, MANAGE_ROLES)) {
        return { ok: false as const, error: 'Bu işlem için yetkiniz yok', userId: null };
    }
    return { ok: true as const, error: null, userId: (gate.session!.user as any).id as string };
}

const serialize = <T>(v: T): T => JSON.parse(JSON.stringify(v));

// ---------------- Mezun Öğrenciler ----------------

export async function getGraduatedStudents() {
    const lic = await requireLicense(HR_PART);
    if (!lic.ok) return { error: lic.error, data: null };
    try {
        const data = await prisma.graduatedStudent.findMany({
            orderBy: [{ graduationDate: 'desc' }, { createdAt: 'desc' }],
        });
        return { error: null, data: serialize(data) };
    } catch (error) {
        console.error('Error fetching graduated students:', error);
        return { error: 'Mezun öğrenciler yüklenirken bir hata oluştu', data: null };
    }
}

export async function upsertGraduatedStudent(data: {
    id?: string;
    firstName: string;
    lastName: string;
    graduationDate?: string | null;
    school?: string | null;
    notes?: string | null;
}) {
    const auth = await requireManager(HR_PART);
    if (!auth.ok) return { error: auth.error, data: null };
    try {
        if (!data.firstName?.trim() || !data.lastName?.trim()) {
            return { error: 'Ad ve soyad zorunludur', data: null };
        }
        const payload = {
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            graduationDate: data.graduationDate ? new Date(data.graduationDate) : null,
            school: data.school?.trim() || null,
            notes: data.notes?.trim() || null,
        };
        const record = data.id
            ? await prisma.graduatedStudent.update({ where: { id: data.id }, data: payload })
            : await prisma.graduatedStudent.create({ data: payload });
        revalidatePath('/dashboard/part3/graduates');
        return { error: null, data: serialize(record) };
    } catch (error) {
        console.error('Error saving graduated student:', error);
        return { error: 'Kayıt sırasında bir hata oluştu', data: null };
    }
}

export async function deleteGraduatedStudent(id: string) {
    const auth = await requireManager(HR_PART);
    if (!auth.ok) return { error: auth.error, data: null };
    try {
        await prisma.graduatedStudent.delete({ where: { id } });
        revalidatePath('/dashboard/part3/graduates');
        return { error: null, data: { id } };
    } catch (error) {
        console.error('Error deleting graduated student:', error);
        return { error: 'Silme sırasında bir hata oluştu', data: null };
    }
}

// ---------------- Burslu Öğrenciler ----------------

export async function getScholarshipStudents() {
    const lic = await requireLicense(HR_PART);
    if (!lic.ok) return { error: lic.error, data: null };
    try {
        const data = await prisma.scholarshipStudent.findMany({
            orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
        });
        return { error: null, data: serialize(data) };
    } catch (error) {
        console.error('Error fetching scholarship students:', error);
        return { error: 'Burslu öğrenciler yüklenirken bir hata oluştu', data: null };
    }
}

export async function upsertScholarshipStudent(data: {
    id?: string;
    firstName: string;
    lastName: string;
    school?: string | null;
    amount?: number | null;
    startDate?: string | null;
    isActive?: boolean;
    notes?: string | null;
}) {
    const auth = await requireManager(HR_PART);
    if (!auth.ok) return { error: auth.error, data: null };
    try {
        if (!data.firstName?.trim() || !data.lastName?.trim()) {
            return { error: 'Ad ve soyad zorunludur', data: null };
        }
        const payload = {
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            school: data.school?.trim() || null,
            amount: data.amount != null ? new Prisma.Decimal(data.amount) : null,
            startDate: data.startDate ? new Date(data.startDate) : null,
            isActive: data.isActive ?? true,
            notes: data.notes?.trim() || null,
        };
        const record = data.id
            ? await prisma.scholarshipStudent.update({ where: { id: data.id }, data: payload })
            : await prisma.scholarshipStudent.create({ data: payload });
        revalidatePath('/dashboard/part3/scholarships');
        return { error: null, data: serialize(record) };
    } catch (error) {
        console.error('Error saving scholarship student:', error);
        return { error: 'Kayıt sırasında bir hata oluştu', data: null };
    }
}

export async function deleteScholarshipStudent(id: string) {
    const auth = await requireManager(HR_PART);
    if (!auth.ok) return { error: auth.error, data: null };
    try {
        await prisma.scholarshipStudent.delete({ where: { id } });
        revalidatePath('/dashboard/part3/scholarships');
        return { error: null, data: { id } };
    } catch (error) {
        console.error('Error deleting scholarship student:', error);
        return { error: 'Silme sırasında bir hata oluştu', data: null };
    }
}

// ---------------- Rehber Adayları ----------------

export async function getTutorCandidates() {
    const lic = await requireLicense(HR_PART);
    if (!lic.ok) return { error: lic.error, data: null };
    try {
        const data = await prisma.tutorCandidate.findMany({ orderBy: { createdAt: 'desc' } });
        return { error: null, data: serialize(data) };
    } catch (error) {
        console.error('Error fetching tutor candidates:', error);
        return { error: 'Rehber adayları yüklenirken bir hata oluştu', data: null };
    }
}

export async function upsertTutorCandidate(data: {
    id?: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    status?: string;
    decision?: string | null;
    notes?: string | null;
}) {
    const auth = await requireManager(HR_PART);
    if (!auth.ok) return { error: auth.error, data: null };
    try {
        if (!data.firstName?.trim() || !data.lastName?.trim()) {
            return { error: 'Ad ve soyad zorunludur', data: null };
        }
        const payload = {
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            phone: data.phone?.trim() || null,
            status: data.status || 'CONSIDERING',
            decision: data.decision?.trim() || null,
            notes: data.notes?.trim() || null,
        };
        const record = data.id
            ? await prisma.tutorCandidate.update({ where: { id: data.id }, data: payload })
            : await prisma.tutorCandidate.create({ data: payload });
        revalidatePath('/dashboard/part3/tutor-candidates');
        return { error: null, data: serialize(record) };
    } catch (error) {
        console.error('Error saving tutor candidate:', error);
        return { error: 'Kayıt sırasında bir hata oluştu', data: null };
    }
}

export async function deleteTutorCandidate(id: string) {
    const auth = await requireManager(HR_PART);
    if (!auth.ok) return { error: auth.error, data: null };
    try {
        await prisma.tutorCandidate.delete({ where: { id } });
        revalidatePath('/dashboard/part3/tutor-candidates');
        return { error: null, data: { id } };
    } catch (error) {
        console.error('Error deleting tutor candidate:', error);
        return { error: 'Silme sırasında bir hata oluştu', data: null };
    }
}

// ---------------- Rehber Eğitim Takibi ----------------

export async function upsertTrainingProgram(data: { id?: string; name: string; description?: string | null; orderIndex?: number }) {
    const auth = await requireManager(HR_PART);
    if (!auth.ok) return { error: auth.error, data: null };
    try {
        if (!data.name?.trim()) return { error: 'Eğitim adı zorunludur', data: null };
        const payload = { name: data.name.trim(), description: data.description?.trim() || null, orderIndex: data.orderIndex ?? 0 };
        const record = data.id
            ? await prisma.tutorTrainingProgram.update({ where: { id: data.id }, data: payload })
            : await prisma.tutorTrainingProgram.create({ data: payload });
        revalidatePath('/dashboard/part3/tutor-training');
        return { error: null, data: serialize(record) };
    } catch (error) {
        console.error('Error saving training program:', error);
        return { error: 'Eğitim kaydedilirken bir hata oluştu', data: null };
    }
}

export async function deleteTrainingProgram(id: string) {
    const auth = await requireManager(HR_PART);
    if (!auth.ok) return { error: auth.error, data: null };
    try {
        await prisma.tutorTrainingProgram.delete({ where: { id } });
        revalidatePath('/dashboard/part3/tutor-training');
        return { error: null, data: { id } };
    } catch (error) {
        console.error('Error deleting training program:', error);
        return { error: 'Eğitim silinirken bir hata oluştu', data: null };
    }
}

/** Returns the tutor × training matrix: all tutors, all programs, and the records. */
export async function getTutorTrainingMatrix() {
    const lic = await requireLicense(HR_PART);
    if (!lic.ok) return { error: lic.error, data: null };
    try {
        const [tutors, programs, records] = await Promise.all([
            prisma.user.findMany({
                where: { roles: { has: UserRole.TUTOR }, deletedAt: null },
                select: { id: true, firstName: true, lastName: true, username: true },
                orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
            }),
            prisma.tutorTrainingProgram.findMany({ orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }] }),
            prisma.tutorTrainingRecord.findMany(),
        ]);
        return { error: null, data: serialize({ tutors, programs, records }) };
    } catch (error) {
        console.error('Error fetching training matrix:', error);
        return { error: 'Eğitim takibi yüklenirken bir hata oluştu', data: null };
    }
}

// ---------------- Değerler Halkası Grup / Rehber Durum Takibi ----------------

const TUTOR_STATUSES = ['ACTIVE', 'STANDBY', 'PASSIVE', 'LEAVING'];

export async function getCharacterGroupsOverview() {
    const lic = await requireLicense(GROUPS_PART);
    if (!lic.ok) return { error: lic.error, data: null };
    try {
        const [groups, tutors] = await Promise.all([
            prisma.characterGroup.findMany({
                include: { tutor: { select: { id: true, firstName: true, lastName: true, username: true, isActive: true, tutorStatus: true } } },
                orderBy: [{ locationType: 'asc' }, { name: 'asc' }],
            }),
            prisma.user.findMany({
                where: { roles: { has: UserRole.TUTOR }, deletedAt: null },
                select: {
                    id: true, firstName: true, lastName: true, username: true, isActive: true, tutorStatus: true,
                    _count: { select: { characterGroups: true } },
                },
                orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
            }),
        ]);
        return { error: null, data: serialize({ groups, tutors }) };
    } catch (error) {
        console.error('Error fetching character groups overview:', error);
        return { error: 'Gruplar yüklenirken bir hata oluştu', data: null };
    }
}

export async function upsertCharacterGroup(data: {
    id?: string;
    name: string;
    locationType: string;
    locationName?: string | null;
    tutorId?: string | null;
    isActive?: boolean;
    notes?: string | null;
}) {
    const auth = await requireManager(GROUPS_PART);
    if (!auth.ok) return { error: auth.error, data: null };
    try {
        if (!data.name?.trim()) return { error: 'Grup adı zorunludur', data: null };
        const payload = {
            name: data.name.trim(),
            locationType: data.locationType === 'SCHOOL' ? 'SCHOOL' : 'CENTER',
            locationName: data.locationName?.trim() || null,
            tutorId: data.tutorId || null,
            isActive: data.isActive ?? true,
            notes: data.notes?.trim() || null,
        };
        const record = data.id
            ? await prisma.characterGroup.update({ where: { id: data.id }, data: payload })
            : await prisma.characterGroup.create({ data: payload });
        revalidatePath('/dashboard/part2/character-groups');
        return { error: null, data: serialize(record) };
    } catch (error) {
        console.error('Error saving character group:', error);
        return { error: 'Kayıt sırasında bir hata oluştu', data: null };
    }
}

export async function deleteCharacterGroup(id: string) {
    const auth = await requireManager(GROUPS_PART);
    if (!auth.ok) return { error: auth.error, data: null };
    try {
        await prisma.characterGroup.delete({ where: { id } });
        revalidatePath('/dashboard/part2/character-groups');
        return { error: null, data: { id } };
    } catch (error) {
        console.error('Error deleting character group:', error);
        return { error: 'Silme sırasında bir hata oluştu', data: null };
    }
}

/**
 * Set a rehber's HR status (ACTIVE / STANDBY / PASSIVE / LEAVING).
 * Two-way synced with Kullanıcı Yönetimi's active/passive (User.isActive):
 * marking PASSIVE here also deactivates the account (blocks login); any other
 * status keeps the account active. The reverse (toggling isActive from the user
 * management screen) is handled in PATCH /api/users/[id].
 */
export async function setTutorStatus(tutorId: string, status: string) {
    const auth = await requireManager(GROUPS_PART);
    if (!auth.ok) return { error: auth.error, data: null };
    try {
        const value = TUTOR_STATUSES.includes(status) ? status : 'ACTIVE';
        const isActive = value !== 'PASSIVE';
        await prisma.user.update({
            where: { id: tutorId },
            data: {
                tutorStatus: value,
                isActive,
                statusChangedAt: new Date(),
                statusChangedBy: auth.userId,
            },
        });
        revalidatePath('/dashboard/part2/character-groups');
        return { error: null, data: { tutorId, status: value, isActive } };
    } catch (error) {
        console.error('Error setting tutor status:', error);
        return { error: 'Durum güncellenirken bir hata oluştu', data: null };
    }
}

export async function setTutorTrainingRecord(data: { programId: string; tutorId: string; completed: boolean; notes?: string | null }) {
    const auth = await requireManager(HR_PART);
    if (!auth.ok) return { error: auth.error, data: null };
    try {
        const record = await prisma.tutorTrainingRecord.upsert({
            where: { programId_tutorId: { programId: data.programId, tutorId: data.tutorId } },
            create: {
                programId: data.programId,
                tutorId: data.tutorId,
                completed: data.completed,
                completedAt: data.completed ? new Date() : null,
                notes: data.notes?.trim() || null,
            },
            update: {
                completed: data.completed,
                completedAt: data.completed ? new Date() : null,
                notes: data.notes?.trim() || null,
            },
        });
        revalidatePath('/dashboard/part3/tutor-training');
        return { error: null, data: serialize(record) };
    } catch (error) {
        console.error('Error setting training record:', error);
        return { error: 'Kayıt sırasında bir hata oluştu', data: null };
    }
}
