import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import logger from '@/lib/logger';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

// Get all ingredients
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const ingredients = await prisma.contentIngredient.findMany({
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
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ ingredients }, { status: 200 });
    } catch (error: any) {
        logger.error('Error fetching ingredients:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// Create a new ingredient
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, content, type } = body;

        if (!title || !content || !type) {
            return NextResponse.json(
                { error: 'Title, content, and type are required' },
                { status: 400 }
            );
        }

        const ingredient = await prisma.contentIngredient.create({
            data: {
                title,
                content,
                type,
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

        return NextResponse.json(
            { message: 'Ingredient created successfully', ingredient },
            { status: 201 }
        );
    } catch (error: any) {
        logger.error('Error creating ingredient:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// Update an ingredient
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, title, content, type } = body;

        if (!id) {
            return NextResponse.json({ error: 'Ingredient ID is required' }, { status: 400 });
        }

        const existingIngredient = await prisma.contentIngredient.findUnique({
            where: { id },
        });

        if (!existingIngredient) {
            return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 });
        }

        // Check permissions: only creator or admin can update
        if (existingIngredient.createdById !== session.user.id && session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized to update this ingredient' }, { status: 403 });
        }

        const updatedIngredient = await prisma.contentIngredient.update({
            where: { id },
            data: {
                title: title || undefined,
                content: content || undefined,
                type: type || undefined,
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

        return NextResponse.json(
            { message: 'Ingredient updated successfully', ingredient: updatedIngredient },
            { status: 200 }
        );
    } catch (error: any) {
        logger.error('Error updating ingredient:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// Delete an ingredient
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Ingredient ID is required' }, { status: 400 });
        }

        const existingIngredient = await prisma.contentIngredient.findUnique({
            where: { id },
        });

        if (!existingIngredient) {
            return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 });
        }

        // Check permissions: only creator or admin can delete
        if (existingIngredient.createdById !== session.user.id && session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized to delete this ingredient' }, { status: 403 });
        }

        await prisma.contentIngredient.delete({
            where: { id },
        });

        return NextResponse.json(
            { message: 'Ingredient deleted successfully' },
            { status: 200 }
        );
    } catch (error: any) {
        logger.error('Error deleting ingredient:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
