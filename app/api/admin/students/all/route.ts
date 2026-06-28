import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { authOptions } from '../../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

// GET - All active, non-deleted students regardless of period.
// Used by the new-period curation flow and the in-period "add students" picker,
// where the admin needs to choose from the full pool of students (not just the
// active period's members).
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    if (!userRoles.includes(UserRole.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const students = await prisma.user.findMany({
      where: {
        role: UserRole.STUDENT,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        tutor: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    return NextResponse.json({ students }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching all students:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
