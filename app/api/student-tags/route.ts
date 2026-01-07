import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';

// GET /api/student-tags - Get all tags for students (filtered by tutor)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        // Build query based on user role
        const whereClause: any = {};

        if (session.user.role === 'TUTOR') {
            whereClause.tutorId = session.user.id;
        } else if (session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (studentId) {
            whereClause.studentId = studentId;
        }

        const tags = await prisma.studentTag.findMany({
            where: whereClause,
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
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ tags }, { status: 200 });
    } catch (error) {
        console.error('Error fetching student tags:', error);
        return NextResponse.json(
            { error: 'Etiketler yüklenirken bir hata oluştu' },
            { status: 500 }
        );
    }
}

// POST /api/student-tags - Assign a tag template to a student
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role !== 'TUTOR' && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { studentId, templateId } = body;

        if (!studentId || !templateId) {
            return NextResponse.json(
                { error: 'Öğrenci ID ve etiket şablonu ID gereklidir' },
                { status: 400 }
            );
        }

        // Check if template exists and is active
        const template = await prisma.tagTemplate.findUnique({
            where: { id: templateId },
        });

        if (!template || !template.isActive) {
            return NextResponse.json(
                { error: 'Etiket şablonu bulunamadı veya aktif değil' },
                { status: 404 }
            );
        }

        // Check if student exists and belongs to this tutor (for TUTOR role)
        if (session.user.role === 'TUTOR') {
            const student = await prisma.user.findFirst({
                where: {
                    id: studentId,
                    tutorId: session.user.id,
                },
            });

            if (!student) {
                return NextResponse.json(
                    { error: 'Öğrenci bulunamadı veya bu öğrenci size ait değil' },
                    { status: 404 }
                );
            }
        }

        // Check if tag already exists for this student
        const existingTag = await prisma.studentTag.findFirst({
            where: {
                studentId,
                templateId,
                tutorId: session.user.id,
            },
        });

        if (existingTag) {
            return NextResponse.json(
                { error: 'Bu etiket zaten bu öğrenci için mevcut' },
                { status: 400 }
            );
        }

        const tag = await prisma.studentTag.create({
            data: {
                studentId,
                tutorId: session.user.id,
                templateId,
            },
            include: {
                student: {
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

        return NextResponse.json({ tag }, { status: 201 });
    } catch (error) {
        console.error('Error creating student tag:', error);
        return NextResponse.json(
            { error: 'Etiket eklenirken bir hata oluştu' },
            { status: 500 }
        );
    }
}
