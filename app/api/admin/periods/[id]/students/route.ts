import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { authOptions } from '../../../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
  }
  const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
  if (!userRoles.includes(UserRole.ADMIN)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

const STUDENT_SELECT = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  tutor: { select: { id: true, firstName: true, lastName: true, username: true } },
} as const;

// GET - members of this period + students who can still be added (non-members)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const period = await prisma.period.findUnique({ where: { id: params.id } });
    if (!period) {
      return NextResponse.json({ error: 'Period not found' }, { status: 404 });
    }

    // Members of this period (exclude soft-deleted from the manageable list)
    const memberships = await prisma.periodStudent.findMany({
      where: { periodId: params.id, student: { deletedAt: null } },
      select: { joinedAt: true, student: { select: STUDENT_SELECT } },
      orderBy: { student: { firstName: 'asc' } },
    });
    const members = memberships.map((m) => ({ ...m.student, joinedAt: m.joinedAt }));

    // Students not yet in this period (active, non-deleted) — addable
    const nonMembers = await prisma.user.findMany({
      where: {
        role: UserRole.STUDENT,
        isActive: true,
        deletedAt: null,
        studentPeriods: { none: { periodId: params.id } },
      },
      select: STUDENT_SELECT,
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    return NextResponse.json({
      period: { id: period.id, name: period.name, status: period.status },
      members,
      nonMembers,
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching period students:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - add students to this period
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const period = await prisma.period.findUnique({ where: { id: params.id } });
    if (!period) {
      return NextResponse.json({ error: 'Period not found' }, { status: 404 });
    }

    const { studentIds } = await request.json();
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'studentIds array is required' }, { status: 400 });
    }

    // Only add valid, non-deleted students
    const validStudents = await prisma.user.findMany({
      where: { id: { in: studentIds }, role: UserRole.STUDENT, deletedAt: null },
      select: { id: true },
    });

    const result = await prisma.periodStudent.createMany({
      data: validStudents.map((s) => ({ periodId: params.id, studentId: s.id })),
      skipDuplicates: true,
    });

    return NextResponse.json({ added: result.count }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error adding period students:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE - remove students from this period.
// Only the period membership is removed; the student account and all of their
// historical data (including data from this and other periods) stay intact.
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { studentIds } = await request.json();
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'studentIds array is required' }, { status: 400 });
    }

    const result = await prisma.periodStudent.deleteMany({
      where: { periodId: params.id, studentId: { in: studentIds } },
    });

    return NextResponse.json({ removed: result.count }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error removing period students:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
