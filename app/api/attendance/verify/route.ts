export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { requireApiPartLicense } from '@/app/lib/permissions.server';

export async function GET(req: NextRequest) {
    // Kurum paketi kapısı — Beceri Atölyeleri (part 4)
    const licenseGate = await requireApiPartLicense(4);
    if (licenseGate.errorResponse) return licenseGate.errorResponse;

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Token required' }, { status: 400 });
        }

        // Find the activity by QR code token
        const activity = await prisma.workshopActivity.findFirst({
            where: { qrCodeToken: token },
            include: {
                workshop: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!activity) {
            return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş QR kod' }, { status: 404 });
        }

        // Return activity information
        return NextResponse.json({
            id: activity.id,
            title: activity.title,
            description: activity.description,
            workshopName: activity.workshop.name,
            date: activity.date,
        });
    } catch (error) {
        console.error('Error verifying attendance token:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
