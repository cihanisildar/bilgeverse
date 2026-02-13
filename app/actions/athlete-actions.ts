'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import {
    AthleteMetricType,
    AthleteTrainingType,
    AttendanceStatus,
    UserRole
} from '@prisma/client';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

// Sport Branch Actions
export async function getSportBranches() {
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
        const session = await getServerSession(authOptions);
        const userRole = session?.user?.role as UserRole;
        if (userRole !== UserRole.ADMIN) {
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
        const session = await getServerSession(authOptions);
        const userRole = session?.user?.role as UserRole;
        if (userRole !== UserRole.ADMIN) {
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
    healthReportExpiry?: Date;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!([UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN] as UserRole[]).includes(session?.user?.role as UserRole)) {
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

        const profile = await prisma.athleteProfile.upsert({
            where: { userId: data.userId },
            create: {
                userId: data.userId,
                healthReportExpiry: data.healthReportExpiry,
                branches: {
                    connect: data.branchIds.map(id => ({ id }))
                }
            },
            update: {
                healthReportExpiry: data.healthReportExpiry,
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
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!([UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN] as UserRole[]).includes(session?.user?.role as UserRole)) {
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

// Attendance and Performance Actions
export async function getTrainingDetails(trainingId: string) {
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
        const session = await getServerSession(authOptions);
        if (!([UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN] as UserRole[]).includes(session?.user?.role as UserRole)) {
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
        const session = await getServerSession(authOptions);
        if (!([UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN] as UserRole[]).includes(session?.user?.role as UserRole)) {
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
    healthReportExpiry?: Date;
}) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = session?.user?.role as UserRole;
        if (userRole !== UserRole.ADMIN && userRole !== UserRole.TUTOR) {
            return { error: 'Yeni kullanıcı kaydı için yetkiniz yok', data: null };
        }

        const existingUser = await prisma.user.findUnique({
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
