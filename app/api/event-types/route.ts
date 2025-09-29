import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 403 }
      );
    }

    // Get only active event types
    const eventTypes = await prisma.eventType.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        description: true
      }
    });

    return NextResponse.json({ eventTypes }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching event types:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}