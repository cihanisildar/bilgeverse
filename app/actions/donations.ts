'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import {
    Donor,
    Donation,
    DonorDetails,
    DonorActionResponse,
    CreateDonorData,
    UpdateDonorData,
    AddDonationData
} from '@/types/donations';

async function checkAuth() {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.ASISTAN)) {
        throw new Error('Unauthorized');
    }
    return session;
}

export async function getDonors(search?: string): Promise<DonorActionResponse<Donor[]>> {
    try {
        await checkAuth();

        const donors = await prisma.donor.findMany({
            where: search ? {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            } : undefined,
            include: {
                donations: {
                    orderBy: {
                        donationDate: 'desc',
                    },
                    take: 1,
                },
                _count: {
                    select: { donations: true },
                },
            },
            orderBy: {
                lastName: 'asc',
            },
        });

        // Calculate total amount and activity status
        const formattedDonors: Donor[] = await Promise.all(donors.map(async (donor) => {
            const aggregates = await prisma.donation.aggregate({
                where: { donorId: donor.id },
                _sum: { amount: true },
            });

            const lastDonationDate = donor.donations[0]?.donationDate || null;
            const isInactive = lastDonationDate
                ? new Date().getTime() - new Date(lastDonationDate).getTime() > 1000 * 60 * 60 * 24 * 60 // 60 days
                : true;

            const { _count, ...donorData } = donor;

            return {
                ...donorData,
                donations: donor.donations.map(d => ({
                    ...d,
                    amount: d.amount.toNumber()
                })),
                totalDonated: aggregates._sum.amount?.toNumber() || 0,
                lastDonationDate,
                isInactive,
            };
        }));

        return { error: null, data: formattedDonors };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch donors';
        console.error('Error fetching donors:', error);
        return { error: message, data: null };
    }
}

export async function getDonorDetails(id: string): Promise<DonorActionResponse<DonorDetails>> {
    try {
        await checkAuth();

        const donor = await prisma.donor.findUnique({
            where: { id },
            include: {
                donations: {
                    orderBy: {
                        donationDate: 'desc',
                    },
                },
                user: {
                    select: {
                        id: true,
                        username: true,
                        role: true,
                    }
                }
            },
        });

        if (!donor) return { error: 'Donor not found', data: null };

        const totalDonated = donor.donations.reduce((acc, curr) => acc + curr.amount.toNumber(), 0);
        const lastDonationDate = donor.donations[0]?.donationDate || null;
        const isInactive = lastDonationDate
            ? new Date().getTime() - new Date(lastDonationDate).getTime() > 1000 * 60 * 60 * 24 * 60
            : true;

        const formattedDonor: DonorDetails = {
            ...donor,
            totalDonated,
            lastDonationDate,
            isInactive,
            donations: donor.donations.map(d => ({
                ...d,
                amount: d.amount.toNumber()
            }))
        };

        return {
            error: null,
            data: formattedDonor
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch donor details';
        console.error('Error fetching donor details:', error);
        return { error: message, data: null };
    }
}

export async function createDonor(data: CreateDonorData): Promise<DonorActionResponse<Donor>> {
    try {
        await checkAuth();

        const donorData = {
            ...data,
            email: data.email?.trim() || null,
            phone: data.phone?.trim() || null,
        };

        const donor = await prisma.donor.create({
            data: donorData,
        });

        revalidatePath('/dashboard/part8');
        return {
            error: null,
            data: {
                id: donor.id,
                firstName: donor.firstName,
                lastName: donor.lastName,
                email: donor.email,
                phone: donor.phone,
                address: donor.address,
                notes: donor.notes,
                createdAt: donor.createdAt,
                updatedAt: donor.updatedAt,
                totalDonated: 0,
                lastDonationDate: null,
                isInactive: true,
            }
        };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { error: 'Bu e-posta adresi zaten başka bir bağışçı tarafından kullanılıyor.', data: null };
        }
        const message = error instanceof Error ? error.message : 'Bağışçı oluşturulamadı';
        console.error('Error creating donor:', error);
        return { error: message, data: null };
    }
}

export async function updateDonor(id: string, data: UpdateDonorData): Promise<DonorActionResponse<Donor>> {
    try {
        await checkAuth();

        const donorData = {
            ...data,
            email: data.email === "" ? null : data.email?.trim(),
            phone: data.phone === "" ? null : data.phone?.trim(),
        };

        const donor = await prisma.donor.update({
            where: { id },
            data: donorData,
        });

        revalidatePath('/dashboard/part8');
        // Note: totalDonated/lastDonationDate would need recalculation, but usually we just re-fetch in UI
        return {
            error: null,
            data: {
                id: donor.id,
                firstName: donor.firstName,
                lastName: donor.lastName,
                email: donor.email,
                phone: donor.phone,
                address: donor.address,
                notes: donor.notes,
                createdAt: donor.createdAt,
                updatedAt: donor.updatedAt,
                totalDonated: 0,
                lastDonationDate: null,
                isInactive: true,
            }
        };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { error: 'Bu e-posta adresi zaten başka bir bağışçı tarafından kullanılıyor.', data: null };
        }
        const message = error instanceof Error ? error.message : 'Bağışçı güncellenemedi';
        console.error('Error updating donor:', error);
        return { error: message, data: null };
    }
}

export async function addDonation(data: AddDonationData): Promise<DonorActionResponse<Donation>> {
    try {
        await checkAuth();

        const donation = await prisma.donation.create({
            data: {
                ...data,
                amount: data.amount,
            },
        });

        revalidatePath('/dashboard/part8');
        return {
            error: null,
            data: {
                ...donation,
                amount: donation.amount.toNumber()
            }
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add donation';
        console.error('Error adding donation:', error);
        return { error: message, data: null };
    }
}

export async function deleteDonation(id: string): Promise<{ error: string | null; success: boolean }> {
    try {
        await checkAuth();

        await prisma.donation.delete({
            where: { id },
        });

        revalidatePath('/dashboard/part8');
        return { error: null, success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete donation';
        console.error('Error deleting donation:', error);
        return { error: message, success: false };
    }
}

export async function deleteDonor(id: string): Promise<{ error: string | null; success: boolean }> {
    try {
        await checkAuth();

        await prisma.donor.delete({
            where: { id },
        });

        revalidatePath('/dashboard/part8');
        return { error: null, success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete donor';
        console.error('Error deleting donor:', error);
        return { error: message, success: false };
    }
}
