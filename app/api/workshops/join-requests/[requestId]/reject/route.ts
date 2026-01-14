import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole, WorkshopJoinRequestStatus } from '@prisma/client';

/**
 * POST /api/workshops/join-requests/[requestId]/reject
 * Reject a workshop join request
 * Authorization: Workshop assigned tutors, Admin, Board Member
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { requestId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const requestId = params.requestId;

        // Fetch the join request
        const joinRequest = await prisma.workshopJoinRequest.findUnique({
            where: { id: requestId },
        });

        if (!joinRequest) {
            return NextResponse.json({ error: 'Join request not found' }, { status: 404 });
        }

        if (joinRequest.status !== WorkshopJoinRequestStatus.PENDING) {
            return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
        }

        // Check authorization
        const isPrivileged = ([UserRole.ADMIN, UserRole.BOARD_MEMBER] as UserRole[]).includes(session.user.role as UserRole);

        if (!isPrivileged) {
            // Check if user is assigned to this workshop
            const assignment = await prisma.workshopAssignment.findUnique({
                where: {
                    workshopId_userId: {
                        workshopId: joinRequest.workshopId,
                        userId: session.user.id,
                    },
                },
            });

            if (!assignment) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        // Update join request status
        const updatedRequest = await prisma.workshopJoinRequest.update({
            where: { id: requestId },
            data: {
                status: WorkshopJoinRequestStatus.REJECTED,
                reviewedBy: session.user.id,
                reviewedAt: new Date(),
            },
        });

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error('Error rejecting join request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
