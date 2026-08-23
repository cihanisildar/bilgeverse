import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth.config';
import { requireApiPartLicense } from '@/app/lib/permissions.server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    // Kurum paketi kapısı — Etkinlik türleri Etkinlikler'e (part 2) ait
    const licenseGate = await requireApiPartLicense(2);
    if (licenseGate.errorResponse) return licenseGate.errorResponse;

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