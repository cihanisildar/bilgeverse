export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user as any;
        const userRoles = user.roles || [user.role].filter(Boolean) as string[];
        const isAdmin = userRoles.includes('ADMIN');
        const isTutor = userRoles.includes('TUTOR');

        if (!isAdmin && !isTutor) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Get classrooms based on user role
        const classrooms = await prisma.classroom.findMany({
            where: isAdmin ? {} : { tutorId: session.user.id },
            include: {
                tutor: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: {
                        students: true,
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });

        const formattedClassrooms = classrooms.map(classroom => ({
            id: classroom.id,
            name: classroom.name,
            tutorName: `${classroom.tutor.firstName || ''} ${classroom.tutor.lastName || ''}`.trim(),
            studentCount: classroom._count.students,
        }));

        return NextResponse.json({ classrooms: formattedClassrooms });
    } catch (error) {
        console.error('Error fetching classrooms:', error);
        return NextResponse.json(
            { error: 'Failed to fetch classrooms' },
            { status: 500 }
        );
    }
}
