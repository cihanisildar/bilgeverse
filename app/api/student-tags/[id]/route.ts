import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';

// GET /api/student-tags/[id] - Get a specific tag
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tag = await prisma.studentTag.findUnique({
            where: { id },
            include: {
                student: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    },
                },
                tutor: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                template: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                        description: true,
                        icon: true,
                    },
                },
            },
        });

        if (!tag) {
            return NextResponse.json({ error: 'Etiket bulunamadı' }, { status: 404 });
        }

        // Check access rights
        if (session.user.role === 'TUTOR' && tag.tutorId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json({ tag }, { status: 200 });
    } catch (error) {
        console.error('Error fetching student tag:', error);
        return NextResponse.json(
            { error: 'Etiket yüklenirken bir hata oluştu' },
            { status: 500 }
        );
    }
}

// DELETE /api/student-tags/[id] - Remove a tag from student
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const existingTag = await prisma.studentTag.findUnique({
            where: { id },
        });

        if (!existingTag) {
            return NextResponse.json({ error: 'Etiket bulunamadı' }, { status: 404 });
        }

        // Check access rights
        if (session.user.role === 'TUTOR' && existingTag.tutorId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await prisma.studentTag.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Etiket kaldırıldı' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting student tag:', error);
        return NextResponse.json(
            { error: 'Etiket silinirken bir hata oluştu' },
            { status: 500 }
        );
    }
}
