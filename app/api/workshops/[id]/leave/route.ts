import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';

/**
 * POST /api/workshops/[id]/leave
 * Remove student from workshop
 * Authorization: Students (for themselves)
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

        // Check if student is a member
        const membership = await prisma.workshopStudent.findUnique({
            where: {
                workshopId_studentId: {
                    workshopId,
                    studentId: userId,
                },
            },
        });

        if (!membership) {
            return NextResponse.json({ error: 'Not a member of this workshop' }, { status: 404 });
        }

        // Use a transaction to remove from workshop and clean up join requests
        await prisma.$transaction([
            prisma.workshopStudent.delete({
                where: {
                    workshopId_studentId: {
                        workshopId,
                        studentId: userId,
                    },
                },
            }),
            prisma.workshopJoinRequest.deleteMany({
                where: {
                    workshopId,
                    studentId: userId,
                },
            }),
        ]);

        return NextResponse.json({ success: true, message: 'Successfully left the workshop' });
    } catch (error) {
        console.error('Error leaving workshop:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
