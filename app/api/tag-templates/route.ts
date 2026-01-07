import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';

// GET /api/tag-templates - Get all active tag templates
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const includeInactive = searchParams.get('includeInactive') === 'true';

        // Only admins can see inactive templates
        const whereClause: any = {};
        if (!includeInactive || session.user.role !== 'ADMIN') {
            whereClause.isActive = true;
        }

        const templates = await prisma.tagTemplate.findMany({
            where: whereClause,
            include: {
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                _count: {
                    select: {
                        studentTags: true,
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json({ templates }, { status: 200 });
    } catch (error) {
        console.error('Error fetching tag templates:', error);
        return NextResponse.json(
            { error: 'Etiket şablonları yüklenirken bir hata oluştu' },
            { status: 500 }
        );
    }
}

// POST /api/tag-templates - Create a new tag template (Admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only admins can create templates
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Sadece yöneticiler etiket şablonu oluşturabilir' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, color, description, icon } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Etiket adı gereklidir' },
                { status: 400 }
            );
        }

        // Check if template with same name already exists
        const existingTemplate = await prisma.tagTemplate.findUnique({
            where: { name: name.trim() },
        });

        if (existingTemplate) {
            return NextResponse.json(
                { error: 'Bu isimde bir etiket şablonu zaten mevcut' },
                { status: 400 }
            );
        }

        const template = await prisma.tagTemplate.create({
            data: {
                name: name.trim(),
                color: color || '#6366f1',
                description: description?.trim() || null,
                icon: icon || null,
                createdById: session.user.id,
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        return NextResponse.json({ template }, { status: 201 });
    } catch (error) {
        console.error('Error creating tag template:', error);
        return NextResponse.json(
            { error: 'Etiket şablonu oluşturulurken bir hata oluştu' },
            { status: 500 }
        );
    }
}
