'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { isPartLicensed, requirePartLicense } from '@/app/lib/permissions.server';
import prisma from '@/lib/prisma';
import {
    AthleteMetricType,
    AthleteTrainingType,
    AttendanceStatus,
    MembershipStatus,
    UserRole
} from '@prisma/client';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { hasRole } from '@/app/lib/auth-utils';
import { AGE_GROUPS } from '@/app/lib/sports';

/**
 * Kurumun Bilge Spor Kulübü paketi (part 9) + oturum.
 *
 * Paket yoksa null döner; çağıran taraftaki mevcut oturum/rol kontrolleri
 * isteği zaten reddeder. Sayfa katmanı ayrıca requireAuth({ partId: 9 })
 * ile kapılı — buradaki kapı, server action'ın doğrudan çağrılması hâlini kapatır.
 */
const LICENSED_PART = 9;

async function getLicensedSession() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;
    if (!(await isPartLicensed(session, LICENSED_PART))) return null;
    return session;
}

/** Oturuma bakmayan okuma uçları için yalnız paket kontrolü. */
async function requireLicense() {
    const gate = await requirePartLicense(LICENSED_PART);
    return { ok: !gate.error, error: gate.error };
}


// Sport Branch Actions
export async function getSportBranches() {
    const lic = await requireLicense();
    if (!lic.ok) return { error: lic.error, data: null };
    try {
        const branches = await prisma.sportBranch.findMany({
            where: { isActive: true },
            include: {
                _count: {
                    select: { athletes: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        return { error: null, data: branches };
    } catch (error) {
        console.error('Error fetching sport branches:', error);
        return { error: 'Spor branşları yüklenirken bir hata oluştu', data: null };
    }
}

export async function upsertSportBranch(data: { id?: string; name: string; description?: string }) {
    try {
        const session = await getLicensedSession();
        if (!hasRole(session, [UserRole.ADMIN])) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const branch = data.id
            ? await prisma.sportBranch.update({
                where: { id: data.id },
                data: { name: data.name, description: data.description }
            })
            : await prisma.sportBranch.create({
                data: { name: data.name, description: data.description }
            });

        revalidatePath('/dashboard/part9');
        return { error: null, data: branch };
    } catch (error) {
        console.error('Error upserting sport branch:', error);
        return { error: 'Spor branşı kaydedilirken bir hata oluştu', data: null };
    }
}

export async function deleteSportBranch(id: string) {
    try {
        const session = await getLicensedSession();
        if (!hasRole(session, [UserRole.ADMIN])) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        await prisma.sportBranch.delete({
            where: { id }
        });

        revalidatePath('/dashboard/part9');
        return { error: null, data: { success: true } };
    } catch (error) {
        console.error('Error deleting sport branch:', error);
        return { error: 'Spor branşı silinirken bir hata oluştu. Bağlı sporcular veya antrenmanlar olabilir.', data: null };
    }
}

// Athlete Actions
export async function getAthletes(branchId?: string) {
    const lic = await requireLicense();
    if (!lic.ok) return { error: lic.error, data: null };
    try {
        const athletes = await prisma.athleteProfile.findMany({
            where: branchId ? { branches: { some: { id: branchId } } } : undefined,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                        email: true,
                        avatarUrl: true
                    }
                },
                branches: true
            }
        });
        return { error: null, data: athletes };
    } catch (error) {
        console.error('Error fetching athletes:', error);
        return { error: 'Sporcular yüklenirken bir hata oluştu', data: null };
    }
}

export async function upsertAthleteProfile(data: {
    userId: string;
    branchIds: string[];
    healthReportExpiry?: Date | null;
    birthDate?: Date | null;
    phone?: string | null;
    parentName?: string | null;
    parentPhone?: string | null;
    membershipStatus?: MembershipStatus;
    ageGroup?: string | null;
    licenseNumber?: string | null;
    licenseExpiry?: Date | null;
    footballSchool?: boolean;
}) {
    try {
        const session = await getLicensedSession();
        if (!hasRole(session, [UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN])) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        // Ensure the user has the ATHLETE role
        const user = await prisma.user.findUnique({
            where: { id: data.userId },
            select: { roles: true }
        });

        if (!user) return { error: 'Kullanıcı bulunamadı', data: null };

        if (!user.roles.includes(UserRole.ATHLETE)) {
            await prisma.user.update({
                where: { id: data.userId },
                data: {
                    roles: {
                        set: [...user.roles, UserRole.ATHLETE]
                    }
                }
            });
        }

        const scalarData = {
            healthReportExpiry: data.healthReportExpiry,
            birthDate: data.birthDate,
            phone: data.phone,
            parentName: data.parentName,
            parentPhone: data.parentPhone,
            membershipStatus: data.membershipStatus,
            ageGroup: data.ageGroup,
            licenseNumber: data.licenseNumber,
            licenseExpiry: data.licenseExpiry,
            footballSchool: data.footballSchool,
        };

        const profile = await prisma.athleteProfile.upsert({
            where: { userId: data.userId },
            create: {
                userId: data.userId,
                ...scalarData,
                branches: {
                    connect: data.branchIds.map(id => ({ id }))
                }
            },
            update: {
                ...scalarData,
                branches: {
                    set: data.branchIds.map(id => ({ id }))
                }
            }
        });

        revalidatePath('/dashboard/part9');
        return { error: null, data: profile };
    } catch (error) {
        console.error('Error upserting athlete profile:', error);
        return { error: 'Sporcu profili kaydedilirken bir hata oluştu', data: null };
    }
}

// Training Actions
export async function getTrainings(params: { branchId?: string; startDate?: Date; endDate?: Date }) {
    const lic = await requireLicense();
    if (!lic.ok) return { error: lic.error, data: null };
    try {
        const trainings = await prisma.athleteTraining.findMany({
            where: {
                branchId: params.branchId,
                date: {
                    gte: params.startDate,
                    lte: params.endDate
                }
            },
            include: {
                branch: true,
                coach: {
                    select: { id: true, firstName: true, lastName: true, username: true }
                },
                _count: {
                    select: { attendances: true }
                }
            },
            orderBy: { date: 'asc' }
        });
        return { error: null, data: trainings };
    } catch (error) {
        console.error('Error fetching trainings:', error);
        return { error: 'Antrenmanlar yüklenirken bir hata oluştu', data: null };
    }
}

export async function createTraining(data: {
    branchId: string;
    title: string;
    description?: string;
    date: Date;
    startTime?: string;
    endTime?: string;
    location?: string;
    type: AthleteTrainingType;
    coachId?: string | null;
}) {
    try {
        const session = await getLicensedSession();
        if (!hasRole(session, [UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN])) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const training = await prisma.athleteTraining.create({
            data
        });

        revalidatePath('/dashboard/part9');
        return { error: null, data: training };
    } catch (error) {
        console.error('Error creating training:', error);
        return { error: 'Antrenman oluşturulurken bir hata oluştu', data: null };
    }
}

export async function deleteTraining(id: string) {
    try {
        const session = await getLicensedSession();
        if (!hasRole(session, [UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN])) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        // Attendances/performances cascade-delete via the schema relations
        await prisma.athleteTraining.delete({ where: { id } });

        revalidatePath('/dashboard/part9');
        return { error: null, data: { id } };
    } catch (error) {
        console.error('Error deleting training:', error);
        return { error: 'Antrenman silinirken bir hata oluştu', data: null };
    }
}

// Attendance and Performance Actions
export async function getTrainingDetails(trainingId: string) {
    const lic = await requireLicense();
    if (!lic.ok) return { error: lic.error, data: null };
    try {
        const training = await prisma.athleteTraining.findUnique({
            where: { id: trainingId },
            include: {
                branch: {
                    include: {
                        athletes: {
                            include: {
                                user: {
                                    select: { id: true, firstName: true, lastName: true, username: true }
                                }
                            }
                        }
                    }
                },
                attendances: true,
                performances: true
            }
        });
        return { error: null, data: training };
    } catch (error) {
        console.error('Error fetching training details:', error);
        return { error: 'Antrenman detayları yüklenirken bir hata oluştu', data: null };
    }
}

export async function recordAttendance(trainingId: string, attendances: { athleteId: string; status: AttendanceStatus }[]) {
    try {
        const session = await getLicensedSession();
        if (!hasRole(session, [UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN])) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const operations = attendances.map(a =>
            prisma.athleteAttendance.upsert({
                where: { trainingId_athleteId: { trainingId, athleteId: a.athleteId } },
                create: { trainingId, athleteId: a.athleteId, status: a.status },
                update: { status: a.status }
            })
        );

        await prisma.$transaction(operations);

        revalidatePath('/dashboard/part9');
        return { error: null, data: { success: true } };
    } catch (error) {
        console.error('Error recording attendance:', error);
        return { error: 'Katılım kaydedilirken bir hata oluştu', data: null };
    }
}

export async function recordPerformance(trainingId: string, performances: {
    athleteId: string;
    metricType: AthleteMetricType;
    value: string;
    notes?: string;
}[]) {
    try {
        const session = await getLicensedSession();
        if (!hasRole(session, [UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN])) {
            return { error: 'Yetkisiz erişim', data: null };
        }

        const athleteIds = [...new Set(performances.map(p => p.athleteId))];

        await prisma.athletePerformance.deleteMany({
            where: {
                trainingId,
                athleteId: { in: athleteIds }
            }
        });

        await prisma.athletePerformance.createMany({
            data: performances.map(p => ({
                trainingId,
                athleteId: p.athleteId,
                metricType: p.metricType,
                value: p.value,
                notes: p.notes
            }))
        });

        revalidatePath('/dashboard/part9');
        return { error: null, data: { success: true } };
    } catch (error) {
        console.error('Error recording performance:', error);
        return { error: 'Performans kaydedilirken bir hata oluştu', data: null };
    }
}

export async function getAthleteStats(athleteId: string) {
    const lic = await requireLicense();
    if (!lic.ok) return { error: lic.error, data: null };
    try {
        const performances = await prisma.athletePerformance.findMany({
            where: { athleteId },
            include: {
                training: {
                    select: { date: true, title: true }
                }
            },
            orderBy: { training: { date: 'asc' } }
        });

        const attendances = await prisma.athleteAttendance.findMany({
            where: { athleteId },
            include: {
                training: {
                    select: { date: true, title: true }
                }
            },
            orderBy: { training: { date: 'asc' } }
        });

        return { error: null, data: { performances, attendances } };
    } catch (error) {
        console.error('Error fetching athlete stats:', error);
        return { error: 'İstatistikler yüklenirken bir hata oluştu', data: null };
    }
}

export async function searchStudents(query: string) {
    const lic = await requireLicense();
    if (!lic.ok) return { error: lic.error, data: null };
    try {
        const students = await prisma.user.findMany({
            where: {
                AND: [
                    { isActive: true },
                    {
                        OR: [
                            { username: { contains: query, mode: 'insensitive' } },
                            { firstName: { contains: query, mode: 'insensitive' } },
                            { lastName: { contains: query, mode: 'insensitive' } },
                        ]
                    }
                ]
            },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                roles: true,
                avatarUrl: true
            },
            take: 10
        });
        return { error: null, data: students };
    } catch (error) {
        console.error('Error searching students:', error);
        return { error: 'Öğrenci araması yapılırken bir hata oluştu', data: null };
    }
}

export async function registerNewAthlete(data: {
    username: string;
    firstName: string;
    lastName: string;
    branchIds: string[];
    healthReportExpiry?: Date | null;
    birthDate?: Date | null;
    phone?: string | null;
    parentName?: string | null;
    parentPhone?: string | null;
    membershipStatus?: MembershipStatus;
    ageGroup?: string | null;
    licenseNumber?: string | null;
    licenseExpiry?: Date | null;
    footballSchool?: boolean;
}) {
    try {
        const session = await getLicensedSession();
        if (!hasRole(session, [UserRole.ADMIN, UserRole.TUTOR])) {
            return { error: 'Yeni kullanıcı kaydı için yetkiniz yok', data: null };
        }

        // Kullanıcı adı artık yalnızca kurum içinde benzersiz; findFirst kullanılır
        // (tenant extension sorguya organizationId ekler).
        const existingUser = await prisma.user.findFirst({
            where: { username: data.username.toLowerCase() }
        });

        if (existingUser) {
            return { error: 'Bu kullanıcı adı zaten alınmış', data: null };
        }

        const salt = await bcrypt.genSalt(10);
        // Default password is username
        const hashedPassword = await bcrypt.hash(data.username.toLowerCase(), salt);
        const email = `${data.username.toLowerCase()}@ogrtakip.com`;

        const result = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    username: data.username.toLowerCase(),
                    email: email,
                    password: hashedPassword,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    role: UserRole.ATHLETE,
                    roles: [UserRole.ATHLETE]
                }
            });

            const profile = await tx.athleteProfile.create({
                data: {
                    userId: newUser.id,
                    healthReportExpiry: data.healthReportExpiry,
                    birthDate: data.birthDate,
                    phone: data.phone,
                    parentName: data.parentName,
                    parentPhone: data.parentPhone,
                    membershipStatus: data.membershipStatus,
                    ageGroup: data.ageGroup,
                    licenseNumber: data.licenseNumber,
                    licenseExpiry: data.licenseExpiry,
                    footballSchool: data.footballSchool ?? false,
                    branches: {
                        connect: data.branchIds.map(id => ({ id }))
                    }
                }
            });

            return { user: newUser, profile };
        });

        revalidatePath('/dashboard/part9');
        return { error: null, data: result };
    } catch (error) {
        console.error('Error registering new athlete:', error);
        return { error: 'Sporcu kaydedilirken bir hata oluştu', data: null };
    }
}
export async function deleteAthleteProfile(userId: string) {
    try {
        const session = await getLicensedSession();
        if (!hasRole(session, [UserRole.ADMIN, UserRole.TUTOR])) {
            return { error: 'Sporcu profilini silmek için yetkiniz yok', data: null };
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { roles: true }
        });

        if (!user) return { error: 'Kullanıcı bulunamadı', data: null };

        await prisma.$transaction(async (tx) => {
            // Remove the profile
            await tx.athleteProfile.delete({
                where: { userId }
            });

            // Remove the ATHLETE role
            const newRoles = user.roles.filter(r => r !== UserRole.ATHLETE);
            await tx.user.update({
                where: { id: userId },
                data: {
                    roles: { set: newRoles }
                }
            });
        });

        revalidatePath('/dashboard/part9');
        return { error: null, data: { success: true } };
    } catch (error) {
        console.error('Error deleting athlete profile:', error);
        return { error: 'Sporcu profili silinirken bir hata oluştu', data: null };
    }
}

/** Coaches / staff who can be assigned as responsible for a training or match. */
export async function getCoaches() {
    const lic = await requireLicense();
    if (!lic.ok) return { error: lic.error, data: null };
    try {
        const coaches = await prisma.user.findMany({
            where: {
                isActive: true,
                roles: { hasSome: [UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN, UserRole.BOARD_MEMBER] }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
            },
            orderBy: { firstName: 'asc' }
        });
        return { error: null, data: coaches };
    } catch (error) {
        console.error('Error fetching coaches:', error);
        return { error: 'Antrenörler yüklenirken bir hata oluştu', data: null };
    }
}

/**
 * Season promotion: bumps every athlete up one age group (U12→U13 … U17→U18).
 * U18 athletes stay U18 (handled manually). No data is deleted — only the label
 * moves, so all history is preserved.
 */
export async function promoteAthleteAgeGroups() {
    try {
        const session = await getLicensedSession();
        if (!hasRole(session, [UserRole.ADMIN, UserRole.TUTOR])) {
            return { error: 'Terfi işlemi için yetkiniz yok', data: null };
        }

        let promoted = 0;
        // Promote from the top down so we never double-bump the same athlete.
        for (let i = AGE_GROUPS.length - 2; i >= 0; i--) {
            const from = AGE_GROUPS[i];
            const to = AGE_GROUPS[i + 1];
            const res = await prisma.athleteProfile.updateMany({
                where: { ageGroup: from },
                data: { ageGroup: to },
            });
            promoted += res.count;
        }

        revalidatePath('/dashboard/part9');
        return { error: null, data: { promoted } };
    } catch (error) {
        console.error('Error promoting athlete age groups:', error);
        return { error: 'Terfi işlemi sırasında bir hata oluştu', data: null };
    }
}

/** Set a single athlete's age group (manual, per-athlete change). */
export async function setAthleteAgeGroup(userId: string, ageGroup: string | null) {
    try {
        const session = await getLicensedSession();
        if (!hasRole(session, [UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN])) {
            return { error: 'Yetkisiz erişim', data: null };
        }
        await prisma.athleteProfile.update({
            where: { userId },
            data: { ageGroup },
        });
        revalidatePath('/dashboard/part9');
        return { error: null, data: { success: true } };
    } catch (error) {
        console.error('Error setting athlete age group:', error);
        return { error: 'Yaş grubu güncellenirken bir hata oluştu', data: null };
    }
}

/**
 * Read-only self-view for a logged-in athlete: their profile, branches, upcoming
 * trainings, their own attendance & performance, and relevant announcements.
 */
export async function getMyAthleteOverview() {
    try {
        const session = await getLicensedSession();
        if (!session?.user?.id) {
            return { error: 'Oturum bulunamadı', data: null };
        }

        const profile = await prisma.athleteProfile.findUnique({
            where: { userId: session.user.id },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, username: true } },
                branches: { select: { id: true, name: true } },
            },
        });

        if (!profile) {
            return { error: 'Sporcu profili bulunamadı', data: null };
        }

        const branchIds = profile.branches.map((b) => b.id);
        const now = new Date();

        const [upcomingTrainings, attendances, performances, announcements] = await Promise.all([
            branchIds.length
                ? prisma.athleteTraining.findMany({
                    where: { branchId: { in: branchIds }, date: { gte: now } },
                    include: { branch: { select: { name: true } } },
                    orderBy: { date: 'asc' },
                    take: 10,
                })
                : Promise.resolve([]),
            prisma.athleteAttendance.findMany({
                where: { athleteId: profile.id },
                include: { training: { select: { title: true, date: true, type: true } } },
                orderBy: { training: { date: 'desc' } },
                take: 30,
            }),
            prisma.athletePerformance.findMany({
                where: { athleteId: profile.id },
                include: { training: { select: { title: true, date: true } } },
                orderBy: { training: { date: 'desc' } },
                take: 30,
            }),
            prisma.sportAnnouncement.findMany({
                where: { OR: [{ branchId: null }, { branchId: { in: branchIds } }] },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
        ]);

        const attendedCount = attendances.filter((a) => a.status === 'YAPILDI').length;
        const totalMarked = attendances.length;
        const attendanceRate = totalMarked > 0 ? Math.round((attendedCount / totalMarked) * 100) : null;

        return {
            error: null,
            data: JSON.parse(JSON.stringify({
                profile,
                upcomingTrainings,
                attendances,
                performances,
                announcements,
                stats: { attendedCount, totalMarked, attendanceRate },
            })),
        };
    } catch (error) {
        console.error('Error fetching athlete overview:', error);
        return { error: 'Panel yüklenirken bir hata oluştu', data: null };
    }
}

/**
 * Sporcunun KENDİ disiplin bilgisi (salt okunur).
 *
 * Yönetim tarafındaki `getDisciplineRecords` tüm kulübü döndürüyor ve artık
 * yalnız yöneticilere açık; sporcu kendi kayıtlarını buradan görür. Yönetmelik
 * (DisciplineRule) herkese açık bilgi — sporcu hangi ihlalin hangi cezaya
 * karşılık geldiğini görebilsin diye kayıtlarla birlikte dönüyor.
 */
export async function getMyDisciplineOverview() {
    try {
        const session = await getLicensedSession();
        if (!session?.user?.id) {
            return { error: 'Oturum bulunamadı', data: null };
        }

        const profile = await prisma.athleteProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true },
        });

        if (!profile) {
            return { error: 'Sporcu profili bulunamadı', data: null };
        }

        const [records, rules] = await Promise.all([
            prisma.disciplineRecord.findMany({
                where: { athleteId: profile.id },
                include: { rule: { select: { code: true, offense: true, penalty: true } } },
                orderBy: { date: 'desc' },
            }),
            prisma.disciplineRule.findMany({
                where: { isActive: true },
                orderBy: { order: 'asc' },
            }),
        ]);

        return {
            error: null,
            data: JSON.parse(JSON.stringify({ records, rules })),
        };
    } catch (error) {
        console.error('Error fetching athlete discipline overview:', error);
        return { error: 'Disiplin bilgileri yüklenirken bir hata oluştu', data: null };
    }
}
