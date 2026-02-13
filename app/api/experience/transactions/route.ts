import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/auth.config';
import { requireActivePeriod } from '@/lib/periods';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    const userRoles = user?.roles || [user?.role].filter(Boolean) as UserRole[];
    const isTutor = userRoles.includes(UserRole.TUTOR);
    const isAsistan = userRoles.includes(UserRole.ASISTAN);
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!session?.user || (!isTutor && !isAsistan && !isAdmin)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors, asistans and admins can access this endpoint' },
        { status: 403 }
      );
    }

    // Get active period
    const activePeriod = await requireActivePeriod();

    // Get experience transactions based on role
    let whereClause: any = {
      rolledBack: false,
      periodId: activePeriod.id
    };

    if (isAdmin) {
      // Admins see all for now or filter by query (impl if needed)
    } else if (isTutor) {
      // For tutors, get transactions for their students
      whereClause.tutorId = user.id;
    } else if (isAsistan) {
      // For asistans, get transactions for students in the assisted tutor's classroom
      const asistan = await prisma.user.findUnique({
        where: { id: user.id },
        select: { assistedTutorId: true }
      });

      if (!asistan?.assistedTutorId) {
        return NextResponse.json(
          { error: 'Asistan not assigned to any tutor' },
          { status: 403 }
        );
      }

      // Get the assisted tutor's classroom
      const assistedTutor = await prisma.user.findUnique({
        where: { id: asistan.assistedTutorId },
        select: { classroom: { select: { id: true } } }
      });

      if (!assistedTutor?.classroom) {
        return NextResponse.json(
          { error: 'Assisted tutor has no classroom' },
          { status: 403 }
        );
      }

      // Get transactions for students in the classroom
      whereClause.student = {
        studentClassroomId: assistedTutor.classroom.id,
        role: UserRole.STUDENT
      };
    }

    const transactions = await prisma.experienceTransaction.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        tutor: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 25 // Limit to last 25 transactions
    });

    return NextResponse.json({ transactions }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching experience transactions:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    const userRoles = user?.roles || [user?.role].filter(Boolean) as UserRole[];
    const isTutor = userRoles.includes(UserRole.TUTOR);
    const isAsistan = userRoles.includes(UserRole.ASISTAN);
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!session?.user || (!isTutor && !isAsistan && !isAdmin)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors, asistans and admins can create experience transactions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentId, amount } = body;

    if (!studentId || amount === undefined) {
      return NextResponse.json(
        { error: 'Student ID and amount are required' },
        { status: 400 }
      );
    }

    // Verify the student authorization based on role
    let student;

    if (isAdmin) {
      // Admins can do anything
      student = await prisma.user.findFirst({
        where: {
          id: studentId,
          roles: { has: UserRole.STUDENT }
        }
      });
    } else if (isTutor) {
      // For tutors, check if student is assigned to them
      student = await prisma.user.findFirst({
        where: {
          id: studentId,
          tutorId: user.id,
          roles: { has: UserRole.STUDENT }
        }
      });

      if (!student) {
        return NextResponse.json(
          { error: 'Student not found or not assigned to you' },
          { status: 404 }
        );
      }
    } else if (isAsistan) {
      // For asistans, check if student is in the same classroom as assisted tutor
      const asistan = await prisma.user.findUnique({
        where: { id: user.id },
        select: { assistedTutorId: true }
      });

      if (!asistan?.assistedTutorId) {
        return NextResponse.json(
          { error: 'Asistan not assigned to any tutor' },
          { status: 403 }
        );
      }

      // Get the assisted tutor's classroom
      const assistedTutor = await prisma.user.findUnique({
        where: { id: asistan.assistedTutorId },
        select: { classroom: { select: { id: true } } }
      });

      if (!assistedTutor?.classroom) {
        return NextResponse.json(
          { error: 'Assisted tutor has no classroom' },
          { status: 403 }
        );
      }

      // Check if student is in the same classroom
      student = await prisma.user.findFirst({
        where: {
          id: studentId,
          studentClassroomId: assistedTutor.classroom.id,
          roles: { has: UserRole.STUDENT }
        }
      });

      if (!student) {
        return NextResponse.json(
          { error: 'Student not found or not in the assisted tutor\'s classroom' },
          { status: 404 }
        );
      }
    }

    // Get active period
    const activePeriod = await requireActivePeriod();

    // Create the transaction
    const transaction = await prisma.experienceTransaction.create({
      data: {
        amount,
        studentId,
        tutorId: user.id,
        periodId: activePeriod.id
      },
      include: {
        student: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Calculate new experience balance from period-aware transactions
    const { calculateUserExperience } = await import('@/lib/points');
    const newExperienceBalance = await calculateUserExperience(studentId, activePeriod.id);

    return NextResponse.json({
      transaction,
      newExperienceBalance
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating experience transaction:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 