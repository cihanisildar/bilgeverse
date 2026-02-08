import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole, TutorPromotionStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.BOARD_MEMBER)) {
            return NextResponse.json(
                { error: 'Unauthorized: Only admin and board members can access this endpoint' },
                { status: 403 }
            );
        }

        const promotion = await prisma.tutorPromotion.findUnique({
            where: { id: params.id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        phone: true,
                        bio: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
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

        if (!promotion) {
            return NextResponse.json(
                { error: 'Promotion request not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ promotion }, { status: 200 });
    } catch (error: any) {
        console.error('Fetch tutor promotion error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.BOARD_MEMBER)) {
            return NextResponse.json(
                { error: 'Unauthorized: Only admin and board members can update promotion requests' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { status, notes, rejectionReason } = body;

        const promotion = await prisma.tutorPromotion.findUnique({
            where: { id: params.id },
            include: {
                user: true,
            },
        });

        if (!promotion) {
            return NextResponse.json(
                { error: 'Promotion request not found' },
                { status: 404 }
            );
        }

        if (promotion.status !== TutorPromotionStatus.PENDING) {
            return NextResponse.json(
                { error: 'Only pending promotion requests can be updated' },
                { status: 400 }
            );
        }

        // Start a transaction to update both promotion and user role
        const result = await prisma.$transaction(async (tx) => {
            let updatedPromotion;

            if (status === TutorPromotionStatus.APPROVED) {
                // Update user role
                await tx.user.update({
                    where: { id: promotion.userId },
                    data: {
                        role: promotion.requestedRole,
                        statusChangedAt: new Date(),
                        statusChangedBy: session.user.id,
                    },
                });

                // Update promotion status
                updatedPromotion = await tx.tutorPromotion.update({
                    where: { id: params.id },
                    data: {
                        status: TutorPromotionStatus.APPROVED,
                        notes,
                        reviewedById: session.user.id,
                        reviewedAt: new Date(),
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                role: true,
                            },
                        },
                        createdBy: {
                            select: {
                                id: true,
                                username: true,
                                firstName: true,
                                lastName: true,
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
            } else if (status === TutorPromotionStatus.REJECTED) {
                if (!rejectionReason) {
                    throw new Error('Rejection reason is required when rejecting a promotion');
                }

                updatedPromotion = await tx.tutorPromotion.update({
                    where: { id: params.id },
                    data: {
                        status: TutorPromotionStatus.REJECTED,
                        notes,
                        rejectionReason,
                        reviewedById: session.user.id,
                        reviewedAt: new Date(),
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                role: true,
                            },
                        },
                        createdBy: {
                            select: {
                                id: true,
                                username: true,
                                firstName: true,
                                lastName: true,
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
            } else {
                // Just update notes without changing status
                updatedPromotion = await tx.tutorPromotion.update({
                    where: { id: params.id },
                    data: { notes },
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                role: true,
                            },
                        },
                        createdBy: {
                            select: {
                                id: true,
                                username: true,
                                firstName: true,
                                lastName: true,
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
            }

            return updatedPromotion;
        });

        return NextResponse.json({ promotion: result }, { status: 200 });
    } catch (error: any) {
        console.error('Update tutor promotion error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Unauthorized: Only admin can delete promotion requests' },
                { status: 403 }
            );
        }

        await prisma.tutorPromotion.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: 'Promotion request deleted' }, { status: 200 });
    } catch (error: any) {
        console.error('Delete tutor promotion error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
