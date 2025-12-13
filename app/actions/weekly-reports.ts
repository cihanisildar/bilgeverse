'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Get all weekly reports for the current user (based on role)
export async function getWeeklyReports() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { error: 'Unauthorized', data: null };
    }

    try {
        const where: any = {};

        // Admin sees all reports
        if (session.user.role !== 'ADMIN') {
            where.userId = session.user.id;
        }

        const reports = await prisma.weeklyReport.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
                period: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                reviewedBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: [
                { weekNumber: 'desc' },
                { createdAt: 'desc' },
            ],
        });

        return { data: reports, error: null };
    } catch (error) {
        console.error('Error fetching weekly reports:', error);
        return { error: 'Failed to fetch weekly reports', data: null };
    }
}

// Get a single weekly report by ID
export async function getWeeklyReportById(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { error: 'Unauthorized', data: null };
    }

    try {
        const report = await prisma.weeklyReport.findUnique({
            where: { id },
            select: {
                id: true,
                weekNumber: true,
                status: true,
                submissionDate: true,
                reviewDate: true,
                reviewNotes: true,
                pointsAwarded: true,
                comments: true,
                createdAt: true,
                updatedAt: true,
                fixedCriteria: true,
                variableCriteria: true,
                userId: true,
                periodId: true,
                reviewedById: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
                period: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                reviewedBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                questionResponses: {
                    include: {
                        question: true,
                    },
                    orderBy: {
                        question: {
                            orderIndex: 'asc',
                        },
                    },
                },
            },
        });

        if (!report) {
            return { error: 'Report not found', data: null };
        }

        // Check authorization
        if (session.user.role !== 'ADMIN' && report.userId !== session.user.id) {
            return { error: 'Unauthorized access', data: null };
        }

        return { data: report, error: null };
    } catch (error) {
        console.error('Error fetching weekly report:', error);
        return { error: 'Failed to fetch weekly report', data: null };
    }
}

// Update a weekly report
export async function updateWeeklyReport(
    id: string,
    data: {
        status?: string;
        fixedCriteria?: Record<string, string>;
        variableCriteria?: Record<string, string>;
        comments?: string;
        reviewNotes?: string;
        pointsAwarded?: number;
    }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { error: 'Unauthorized', data: null };
    }

    try {
        // Fetch existing report to check ownership
        const existingReport = await prisma.weeklyReport.findUnique({
            where: { id },
        });

        if (!existingReport) {
            return { error: 'Report not found', data: null };
        }

        // Check authorization
        const isAdmin = session.user.role === 'ADMIN';
        const isOwner = existingReport.userId === session.user.id;

        if (!isAdmin && !isOwner) {
            return { error: 'Unauthorized to update this report', data: null };
        }

        const updateData: any = {
            ...data,
        };

        // Set submission date if status is being changed to SUBMITTED
        if (data.status === 'SUBMITTED' && existingReport.status !== 'SUBMITTED') {
            updateData.submissionDate = new Date();
        }

        // Set review date and reviewer if admin is approving/rejecting
        if (isAdmin && (data.status === 'APPROVED' || data.status === 'REJECTED')) {
            updateData.reviewDate = new Date();
            updateData.reviewedById = session.user.id;
        }

        const report = await prisma.weeklyReport.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
                period: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                reviewedBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        return { data: report, error: null };
    } catch (error) {
        console.error('Error updating weekly report:', error);
        return { error: 'Failed to update weekly report', data: null };
    }
}

// Delete a weekly report
export async function deleteWeeklyReport(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { error: 'Unauthorized', data: null };
    }

    try {
        const report = await prisma.weeklyReport.findUnique({
            where: { id },
        });

        if (!report) {
            return { error: 'Report not found', data: null };
        }

        // Only admin or owner can delete
        const isAdmin = session.user.role === 'ADMIN';
        const isOwner = report.userId === session.user.id;

        if (!isAdmin && !isOwner) {
            return { error: 'Unauthorized to delete this report', data: null };
        }

        await prisma.weeklyReport.delete({
            where: { id },
        });

        return { data: { success: true }, error: null };
    } catch (error) {
        console.error('Error deleting weekly report:', error);
        return { error: 'Failed to delete weekly report', data: null };
    }
}

// Get active period
export async function getActivePeriod() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { error: 'Unauthorized', data: null };
    }

    try {
        const period = await prisma.period.findFirst({
            where: { status: 'ACTIVE' },
        });

        return { data: period, error: null };
    } catch (error) {
        console.error('Error fetching active period:', error);
        return { error: 'Failed to fetch active period', data: null };
    }
}
