'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getAdminPdfs(partId?: number) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return { error: 'Unauthorized' };

        const userNode = session.user as any;
        const userRoles = userNode.roles || [userNode.role].filter(Boolean) as string[];
        const isAdmin = userRoles.includes('ADMIN');

        if (!isAdmin) {
            return { error: 'Unauthorized: Only admin can view all PDFs' };
        }

        const where = partId !== undefined ? { partId } : {};

        const pdfs = await prisma.partPdf.findMany({
            where,
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return { data: pdfs };
    } catch (error: any) {
        console.error('Error fetching PDFs:', error);
        return { error: error.message || 'Failed to fetch PDFs' };
    }
}

export async function createAdminPdf(data: {
    partId: number;
    title: string;
    description?: string | null;
    driveLink: string;
    contentType?: string | null;
    isActive?: boolean;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { error: 'Unauthorized: Only admin can create PDF entries' };
        }

        const userNode = session.user as any;
        const userRoles = userNode.roles || [userNode.role].filter(Boolean) as string[];
        const isAdmin = userRoles.includes('ADMIN');

        if (!isAdmin) {
            return { error: 'Unauthorized: Only admin can create PDF entries' };
        }

        const pdf = await prisma.partPdf.create({
            data: {
                ...data,
                uploadedById: userNode.id,
            },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        revalidatePath('/dashboard/pdfs');
        return { data: pdf, message: 'Belge başarıyla eklendi' };
    } catch (error: any) {
        console.error('PDF creation error:', error);
        return { error: error.message || 'Failed to create PDF entry' };
    }
}

export async function updateAdminPdf(id: string, data: {
    title?: string;
    description?: string | null;
    driveLink?: string;
    contentType?: string | null;
    isActive?: boolean;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { error: 'Unauthorized: Only admin can update PDF entries' };
        }

        const userNode = session.user as any;
        const userRoles = userNode.roles || [userNode.role].filter(Boolean) as string[];
        const isAdmin = userRoles.includes('ADMIN');

        if (!isAdmin) {
            return { error: 'Unauthorized: Only admin can update PDF entries' };
        }

        const pdf = await prisma.partPdf.update({
            where: { id },
            data,
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        revalidatePath('/dashboard/pdfs');
        return { data: pdf, message: 'Belge başarıyla güncellendi' };
    } catch (error: any) {
        console.error('Edit error:', error);
        return { error: error.message || 'Failed to update PDF entry' };
    }
}

export async function deleteAdminPdf(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { error: 'Unauthorized: Only admin can delete PDF entries' };
        }

        const userNode = session.user as any;
        const userRoles = userNode.roles || [userNode.role].filter(Boolean) as string[];
        const isAdmin = userRoles.includes('ADMIN');

        if (!isAdmin) {
            return { error: 'Unauthorized: Only admin can delete PDF entries' };
        }

        await prisma.partPdf.delete({ where: { id } });

        revalidatePath('/dashboard/pdfs');
        return { message: 'Belge başarıyla silindi' };
    } catch (error: any) {
        console.error('Delete error:', error);
        return { error: error.message || 'Failed to delete PDF entry' };
    }
}
