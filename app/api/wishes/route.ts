import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/auth.config';
import { requireActivePeriod } from '@/lib/periods';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.STUDENT) {
      return NextResponse.json({ error: 'Unauthorized: Only students can view wishes' }, { status: 403 });
    }

    const wishes = await prisma.wish.findMany({
      where: {
        studentId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ wishes });
  } catch (error) {
    console.error('Error fetching wishes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.STUDENT) {
      return NextResponse.json({ error: 'Unauthorized: Only students can create wishes' }, { status: 403 });
    }

    const { title, description } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const activePeriod = await requireActivePeriod();

    const wish = await prisma.wish.create({
      data: {
        title,
        description,
        studentId: session.user.id,
        periodId: activePeriod.id,
      },
    });

    return NextResponse.json({ wish }, { status: 201 });
  } catch (error) {
    console.error('Error creating wish:', error);
    return NextResponse.json(
      { error: 'Failed to create wish' },
      { status: 500 }
    );
  }
} 