import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { requireApiPartLicense } from '@/app/lib/permissions.server';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    // Kurum paketi kapısı — Beceri Atölyeleri (part 4)
    const licenseGate = await requireApiPartLicense(4);
    if (licenseGate.errorResponse) return licenseGate.errorResponse;

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the student's attendance for this activity
        const attendance = await prisma.workshopAttendance.findUnique({
            where: {
                activityId_studentId: {
                    activityId: params.id,
                    studentId: session.user.id,
                },
            },
        });

        return NextResponse.json({
            attended: attendance ? attendance.status : false,
            checkInMethod: attendance?.checkInMethod || null,
            checkInTime: attendance?.checkInTime || null,
        });
    } catch (error) {
        console.error('Error fetching student attendance:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
