import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                bio: true,
                roles: true,
                role: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
        console.error('Get profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { firstName, lastName, phone, bio } = body;

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                ...(firstName !== undefined && { firstName }),
                ...(lastName !== undefined && { lastName }),
                ...(phone !== undefined && { phone }),
                ...(bio !== undefined && { bio }),
            },
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                bio: true,
            }
        });

        return NextResponse.json({
            message: 'Profile updated successfully',
            user: updatedUser
        }, { status: 200 });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
