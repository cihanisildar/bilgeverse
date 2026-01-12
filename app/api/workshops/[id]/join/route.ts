import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only students can join (or admin can force join, but here we focus on self-join)
        const userId = session.user.id;

        // Check if already joined
        const existing = await prisma.workshopStudent.findUnique({
            where: {
                workshopId_studentId: {
                    workshopId: params.id,
                    studentId: userId,
                },
            },
        });

        if (existing) {
            // Toggle: Leave if already joined
            await prisma.workshopStudent.delete({
                where: {
                    workshopId_studentId: {
                        workshopId: params.id,
                        studentId: userId,
                    },
                },
            });
            return NextResponse.json({ joined: false });
        } else {
            // Join
            await prisma.workshopStudent.create({
                data: {
                    workshopId: params.id,
                    studentId: userId,
                },
            });
            return NextResponse.json({ joined: true });
        }
    } catch (error) {
        console.error('Error joining/leaving workshop:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
