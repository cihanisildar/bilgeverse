import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole, WorkshopJoinRequestStatus } from '@prisma/client';

/**
 * GET /api/workshops/[id]/join-requests
 * Fetch pending join requests for a workshop
 * Authorization: Workshop assigned tutors, Admin, Board Member
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const workshopId = params.id;

        // Check authorization: Admin/Board or assigned tutor
        const isPrivileged = ([UserRole.ADMIN, UserRole.BOARD_MEMBER] as UserRole[]).includes(session.user.role as UserRole);

        if (!isPrivileged) {
            // Check if user is assigned to this workshop
            const assignment = await prisma.workshopAssignment.findUnique({
                where: {
                    workshopId_userId: {
                        workshopId,
                        userId: session.user.id,
                    },
                },
            });

            if (!assignment) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        // Fetch join requests with student info
        const requests = await prisma.workshopJoinRequest.findMany({
            where: {
                workshopId,
                status: WorkshopJoinRequestStatus.PENDING,
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatarUrl: true,
                        username: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error('Error fetching join requests:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * POST /api/workshops/[id]/join-requests
 * Create a join request for a workshop
 * Authorization: Students only (for themselves)
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const workshopId = params.id;
        const userId = session.user.id;
        const body = await req.json();
        const { message } = body;

        // Verify workshop exists
        const workshop = await prisma.workshop.findUnique({
            where: { id: workshopId },
        });

        if (!workshop) {
            return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });
        }

        // Check if already a member
        const existingMembership = await prisma.workshopStudent.findUnique({
            where: {
                workshopId_studentId: {
                    workshopId,
                    studentId: userId,
                },
            },
        });

        if (existingMembership) {
            return NextResponse.json({ error: 'Already a member of this workshop' }, { status: 400 });
        }

        // Check if already has a pending request
        const existingRequest = await prisma.workshopJoinRequest.findUnique({
            where: {
                workshopId_studentId: {
                    workshopId,
                    studentId: userId,
                },
            },
        });

        if (existingRequest) {
            if (existingRequest.status === WorkshopJoinRequestStatus.PENDING) {
                return NextResponse.json({ error: 'Join request already pending' }, { status: 400 });
            }

            // If previously rejected OR approved (but student is not a member now), allow creating a new request by resetting to pending
            if (existingRequest.status === WorkshopJoinRequestStatus.REJECTED || existingRequest.status === WorkshopJoinRequestStatus.APPROVED) {
                const updatedRequest = await prisma.workshopJoinRequest.update({
                    where: { id: existingRequest.id },
                    data: {
                        status: WorkshopJoinRequestStatus.PENDING,
                        message: message || null,
                        reviewedBy: null,
                        reviewedAt: null,
                    },
                });
                return NextResponse.json(updatedRequest, { status: 201 });
            }
        }

        // Create new join request
        const joinRequest = await prisma.workshopJoinRequest.create({
            data: {
                workshopId,
                studentId: userId,
                message: message || null,
            },
        });

        return NextResponse.json(joinRequest, { status: 201 });
    } catch (error) {
        console.error('Error creating join request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
