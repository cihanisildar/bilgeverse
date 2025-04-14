import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, isAuthenticated, isTutor } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!isTutor(currentUser)) {
      return NextResponse.json(
        { error: 'Only tutors can access their store items' },
        { status: 403 }
      );
    }

    const items = await prisma.storeItem.findMany({
      where: {
        tutorId: currentUser.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Fetch tutor store items error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 