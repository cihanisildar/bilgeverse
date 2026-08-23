import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/auth.config';
import { requireApiPartLicense } from '@/app/lib/permissions.server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Kurum paketi kapısı — Etkinlikler Değerler Halkası'na (part 2) ait
  const licenseGate = await requireApiPartLicense(2);
  if (licenseGate.errorResponse) return licenseGate.errorResponse;

  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const eventId = params.id;

    // Check if user is a participant
    const participant = await prisma.eventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: session.user.id
        }
      }
    });

    return NextResponse.json({
      hasJoined: !!participant
    });
  } catch (error: any) {
    console.error('Error checking participation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 