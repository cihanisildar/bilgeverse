import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';

// GET /api/tag-templates/[id] - Get a specific template
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

        const template = await prisma.tagTemplate.findUnique({
            where: { id },
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
        });

        if (!template) {
            return NextResponse.json({ error: 'Şablon bulunamadı' }, { status: 404 });
        }

        return NextResponse.json({ template }, { status: 200 });
    } catch (error) {
        console.error('Error fetching tag template:', error);
        return NextResponse.json(
            { error: 'Şablon yüklenirken bir hata oluştu' },
            { status: 500 }
        );
    }
}

// PATCH /api/tag-templates/[id] - Update a template (Admin only)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Sadece yöneticiler şablon güncelleyebilir' },
                { status: 403 }
            );
        }

        const existingTemplate = await prisma.tagTemplate.findUnique({
            where: { id },
        });

        if (!existingTemplate) {
            return NextResponse.json({ error: 'Şablon bulunamadı' }, { status: 404 });
        }

        const body = await request.json();
        const { name, color, description, icon, isActive } = body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim();
        if (color !== undefined) updateData.color = color;
        if (description !== undefined) updateData.description = description?.trim() || null;
        if (icon !== undefined) updateData.icon = icon;
        if (isActive !== undefined) updateData.isActive = isActive;

        const template = await prisma.tagTemplate.update({
            where: { id },
            data: updateData,
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

        return NextResponse.json({ template }, { status: 200 });
    } catch (error) {
        console.error('Error updating tag template:', error);
        return NextResponse.json(
            { error: 'Şablon güncellenirken bir hata oluştu' },
            { status: 500 }
        );
    }
}

// DELETE /api/tag-templates/[id] - Delete a template (Admin only)
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

        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Sadece yöneticiler şablon silebilir' },
                { status: 403 }
            );
        }

        const existingTemplate = await prisma.tagTemplate.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        studentTags: true,
                    },
                },
            },
        });

        if (!existingTemplate) {
            return NextResponse.json({ error: 'Şablon bulunamadı' }, { status: 404 });
        }

        // Check if template is in use
        if (existingTemplate._count.studentTags > 0) {
            // Instead of deleting, deactivate
            await prisma.tagTemplate.update({
                where: { id },
                data: { isActive: false },
            });
            return NextResponse.json(
                { message: 'Şablon kullanımda olduğu için pasif duruma alındı', deactivated: true },
                { status: 200 }
            );
        }

        await prisma.tagTemplate.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Şablon silindi' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting tag template:', error);
        return NextResponse.json(
            { error: 'Şablon silinirken bir hata oluştu' },
            { status: 500 }
        );
    }
}
