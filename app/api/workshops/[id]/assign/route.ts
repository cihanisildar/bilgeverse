import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);
        const isBoardMember = userRoles.includes(UserRole.BOARD_MEMBER);

        if (!isAdmin && !isBoardMember) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { userId, userIds, role } = body;

        if (!userId && (!userIds || !Array.isArray(userIds))) {
            return NextResponse.json({ error: 'User ID or User IDs array is required' }, { status: 400 });
        }

        const idsToAssign = userId ? [userId] : userIds;

        // Get users to determine their roles if role not explicitly provided
        const users = await prisma.user.findMany({
            where: { id: { in: idsToAssign } },
            select: { id: true, role: true, roles: true }
        });

        // Validation: Only ADMIN can assign ADMIN or BOARD_MEMBER roles
        if (!isAdmin) {
            const hasHighLevelRole = users.some(u => {
                const roles = u.roles || [u.role];
                return roles.includes(UserRole.ADMIN) || roles.includes(UserRole.BOARD_MEMBER);
            });
            if (hasHighLevelRole) {
                return NextResponse.json({
                    error: 'Only administrators can assign Admin or Board Member roles.'
                }, { status: 403 });
            }
        }

        const results = await Promise.all(users.map(async (user) => {
            return prisma.workshopAssignment.upsert({
                where: {
                    workshopId_userId: {
                        workshopId: params.id,
                        userId: user.id,
                    },
                },
                update: {
                    role: role || user.role,
                },
                create: {
                    workshopId: params.id,
                    userId: user.id,
                    role: role || user.role,
                },
            });
        }));

        return NextResponse.json(results);
    } catch (error: unknown) {
        console.error('Error assigning members:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
        const isAdmin = userRoles.includes(UserRole.ADMIN);
        const isBoardMember = userRoles.includes(UserRole.BOARD_MEMBER);

        if (!isAdmin && !isBoardMember) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        await prisma.workshopAssignment.delete({
            where: {
                workshopId_userId: {
                    workshopId: params.id,
                    userId: userId,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Error removing assignment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
