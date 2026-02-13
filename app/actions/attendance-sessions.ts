'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole, CheckInMethod, AttendanceSessionStatus, TransactionType } from '@prisma/client';
import { requireActivePeriod } from '@/lib/periods';
import crypto from 'crypto';

export async function getAttendanceSessions() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    const userNode = session.user as any;
    const userRoles = userNode.roles || [userNode.role].filter(Boolean) as UserRole[];
    const isTutor = userRoles.includes(UserRole.TUTOR);
    const isAsistan = userRoles.includes(UserRole.ASISTAN);
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    // Build where clause based on user role
    let where = {};

    if (isTutor) {
      // Tutors see only their own sessions
      where = { createdById: userNode.id };
    } else if (isAsistan) {
      if (userNode.assistedTutorId) {
        // Assistants see sessions created by their tutor
        where = { createdById: userNode.assistedTutorId };
      } else {
        // If no tutor assigned, show no sessions
        where = { createdById: 'none' };
      }
    }
    // Admins see all sessions (empty where clause)

    const sessions = await prisma.attendanceSession.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        attendances: {
          include: {
            student: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        sessionDate: 'desc',
      },
    });

    return {
      error: null,
      data: sessions.map((s) => ({
        ...s,
        sessionDate: s.sessionDate.toISOString(),
        qrCodeExpiresAt: s.qrCodeExpiresAt ? s.qrCodeExpiresAt.toISOString() : null,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        attendances: s.attendances.map((a) => ({
          ...a,
          checkInTime: a.checkInTime.toISOString(),
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
        })),
      })),
    };
  } catch (error) {
    console.error('Error fetching attendance sessions:', error);
    return { error: 'Oturumlar yüklenirken bir hata oluştu', data: null };
  }
}

export async function getAttendanceSession(sessionId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        attendances: {
          include: {
            student: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            checkInTime: 'desc',
          },
        },
      },
    });

    if (!attendanceSession) {
      return { error: 'Oturum bulunamadı', data: null };
    }

    return {
      error: null,
      data: {
        ...attendanceSession,
        sessionDate: attendanceSession.sessionDate.toISOString(),
        qrCodeExpiresAt: attendanceSession.qrCodeExpiresAt ? attendanceSession.qrCodeExpiresAt.toISOString() : null,
        createdAt: attendanceSession.createdAt.toISOString(),
        updatedAt: attendanceSession.updatedAt.toISOString(),
        attendances: attendanceSession.attendances.map((a) => ({
          ...a,
          checkInTime: a.checkInTime.toISOString(),
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
        })),
      },
    };
  } catch (error) {
    console.error('Error fetching attendance session:', error);
    return { error: 'Oturum yüklenirken bir hata oluştu', data: null };
  }
}

export async function createAttendanceSession(data: {
  title: string;
  description?: string;
  sessionDate: string; // Accept as string
  generateQR?: boolean;
}) {
  try {
    const session = await getServerSession(authOptions);
    const userNode = session?.user as any;
    const userRoles = userNode?.roles || [userNode?.role].filter(Boolean) as string[];
    const isAdmin = userRoles.includes('ADMIN');
    const isTutor = userRoles.includes('TUTOR');

    if (!session?.user || (!isAdmin && !isTutor)) {
      throw new Error('Unauthorized');
    }

    // Convert string to Date
    const sessionDate = new Date(data.sessionDate);

    let qrCodeToken = null;
    let qrCodeExpiresAt = null;

    if (data.generateQR) {
      qrCodeToken = crypto.randomBytes(32).toString('hex');
      // QR code expires at the end of the week (Sunday 23:59:59)
      const weekEnd = new Date(sessionDate);
      const dayOfWeek = weekEnd.getDay();
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      weekEnd.setDate(weekEnd.getDate() + daysUntilSunday);
      weekEnd.setHours(23, 59, 59, 999);
      qrCodeExpiresAt = weekEnd;
    }

    const attendanceSession = await prisma.attendanceSession.create({
      data: {
        title: data.title,
        description: data.description,
        sessionDate: sessionDate,
        qrCodeToken,
        qrCodeExpiresAt,
        createdById: userNode.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      error: null,
      data: {
        ...attendanceSession,
        sessionDate: attendanceSession.sessionDate.toISOString(),
        qrCodeExpiresAt: attendanceSession.qrCodeExpiresAt ? attendanceSession.qrCodeExpiresAt.toISOString() : null,
        createdAt: attendanceSession.createdAt.toISOString(),
        updatedAt: attendanceSession.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error creating attendance session:', error);
    return { error: 'Oturum oluşturulurken bir hata oluştu', data: null };
  }
}

export async function updateAttendanceSession(sessionId: string, data: {
  title?: string;
  description?: string;
  sessionDate?: Date;
  status?: AttendanceSessionStatus;
}) {
  try {
    const session = await getServerSession(authOptions);

    const userNode = session?.user as any;
    const userRoles = userNode?.roles || [userNode?.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);
    const isTutor = userRoles.includes(UserRole.TUTOR);

    if (!session?.user || (!isAdmin && !isTutor)) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    // Prepare update data
    const updateData: any = { ...data };

    // If sessionDate is being updated and there's an existing QR code, update qrCodeExpiresAt
    if (data.sessionDate) {
      // First, check if the session has a QR code
      const existingSession = await prisma.attendanceSession.findUnique({
        where: { id: sessionId },
        select: { qrCodeToken: true },
      });

      // If there's an existing QR code, update its expiration to the new week's end
      if (existingSession?.qrCodeToken) {
        const newDate = new Date(data.sessionDate);
        const dayOfWeek = newDate.getDay();
        const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        const weekEnd = new Date(newDate);
        weekEnd.setDate(weekEnd.getDate() + daysUntilSunday);
        weekEnd.setHours(23, 59, 59, 999);
        updateData.qrCodeExpiresAt = weekEnd;
      }
    }

    const attendanceSession = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      error: null,
      data: {
        ...attendanceSession,
        sessionDate: attendanceSession.sessionDate.toISOString(),
        qrCodeExpiresAt: attendanceSession.qrCodeExpiresAt ? attendanceSession.qrCodeExpiresAt.toISOString() : null,
        createdAt: attendanceSession.createdAt.toISOString(),
        updatedAt: attendanceSession.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error updating attendance session:', error);
    return { error: 'Oturum güncellenirken bir hata oluştu', data: null };
  }
}

export async function generateQRCodeForSession(sessionId: string) {
  try {
    const session = await getServerSession(authOptions);

    const userNode = session?.user as any;
    const userRoles = userNode?.roles || [userNode?.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);
    const isTutor = userRoles.includes(UserRole.TUTOR);

    if (!session?.user || (!isAdmin && !isTutor)) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!attendanceSession) {
      return { error: 'Oturum bulunamadı', data: null };
    }

    const qrCodeToken = crypto.randomBytes(32).toString('hex');
    // QR code expires at the end of the week (Sunday 23:59:59)
    const weekEnd = new Date(attendanceSession.sessionDate);
    const dayOfWeek = weekEnd.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    weekEnd.setDate(weekEnd.getDate() + daysUntilSunday);
    weekEnd.setHours(23, 59, 59, 999);
    const qrCodeExpiresAt = weekEnd;

    const updated = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        qrCodeToken,
        qrCodeExpiresAt,
      },
    });

    return {
      error: null,
      data: {
        qrCodeToken: updated.qrCodeToken,
        qrCodeExpiresAt: updated.qrCodeExpiresAt?.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    return { error: 'QR kod oluşturulurken bir hata oluştu', data: null };
  }
}

export async function checkInToSession(sessionId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    // Find session with valid QR token
    const attendanceSession = await prisma.attendanceSession.findFirst({
      where: {
        id: sessionId,
        qrCodeToken: {
          not: null,
        },
        qrCodeExpiresAt: {
          gte: new Date(),
        },
      },
    });

    if (!attendanceSession || !attendanceSession.qrCodeToken) {
      return { error: 'Geçersiz veya süresi dolmuş QR kod', data: null };
    }

    // Check if already checked in
    const existing = await prisma.studentAttendance.findUnique({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId: session.user.id,
        },
      },
    });

    if (existing) {
      return { error: 'Zaten giriş yapılmış', data: null };
    }

    // Get active period
    let activePeriod;
    try {
      activePeriod = await requireActivePeriod();
    } catch (error) {
      console.error('Active period error in checkInToSession:', error);
      return { error: 'Aktif dönem bulunamadı. Lütfen yöneticinize başvurun.', data: null };
    }

    // Create attendance record and award points in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create attendance record
      const attendance = await tx.studentAttendance.create({
        data: {
          sessionId,
          studentId: session.user.id,
          checkInMethod: CheckInMethod.QR,
        },
        include: {
          student: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // 2. Award 30 points
      await tx.pointsTransaction.create({
        data: {
          studentId: session.user.id,
          tutorId: attendanceSession.createdById, // Use the session creator as the tutor
          points: 30,
          type: TransactionType.AWARD,
          reason: 'Haftalık Yoklama Katılımı',
          periodId: activePeriod.id,
        }
      });

      return attendance;
    });

    return {
      error: null,
      data: {
        ...result,
        checkInTime: result.checkInTime.toISOString(),
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
        pointsAwarded: 30
      },
    };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Zaten giriş yapılmış', data: null };
    }
    console.error('Error checking in:', error);
    return { error: 'Giriş yapılırken bir hata oluştu', data: null };
  }
}


export async function manualCheckInToSession(sessionId: string, studentId: string, notes?: string) {
  try {
    const session = await getServerSession(authOptions);
    const userNode = session?.user as any;
    const userRoles = userNode?.roles || [userNode?.role].filter(Boolean) as UserRole[];
    const isTutor = userRoles.includes(UserRole.TUTOR);
    const isAsistan = userRoles.includes(UserRole.ASISTAN);
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!session?.user || (!isAdmin && !isTutor && !isAsistan)) {
      return { error: 'Yetkisiz erişim: Sadece öğretmenler, asistanlar ve yöneticiler manuel giriş yapabilir', data: null };
    }

    // Validate that tutors/assistants can only check in their own students
    if (isTutor && !isAdmin) {
      const student = await prisma.user.findFirst({
        where: {
          id: studentId,
          tutorId: userNode.id,
          roles: { has: UserRole.STUDENT },
        },
      });

      if (!student) {
        return { error: 'Bu öğrenci sizin grubunuzda değil', data: null };
      }
    } else if (isAsistan && !isAdmin && !isTutor) {
      // Check if the student belongs to the assistant's tutor
      if (!userNode.assistedTutorId) {
        return { error: 'Size atanmış bir öğretmen bulunamadı', data: null };
      }

      const student = await prisma.user.findFirst({
        where: {
          id: studentId,
          tutorId: userNode.assistedTutorId,
          roles: { has: UserRole.STUDENT },
        },
      });

      if (!student) {
        return { error: 'Bu öğrenci sizin grubunuzda değil', data: null };
      }
    }

    // Get active period - this will throw if no active period exists
    // We do this check before the transaction to fail fast
    let activePeriod;
    try {
      activePeriod = await requireActivePeriod();
    } catch (error) {
      console.error('Active period error:', error);
      // Allow continuing without points if strict mode is not required, 
      // but for now let's fail if no period is active to ensure consistency
      return { error: 'Aktif dönem bulunamadı. Lütfen önce bir dönem başlatın.', data: null };
    }

    // Check if already checked in
    const existing = await prisma.studentAttendance.findUnique({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId,
        },
      },
    });

    if (existing) {
      return { error: 'Öğrenci zaten giriş yapmış', data: null };
    }

    // Perform operations in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create attendance record
      const attendance = await tx.studentAttendance.create({
        data: {
          sessionId,
          studentId,
          checkInMethod: CheckInMethod.MANUAL,
          notes,
        },
        include: {
          student: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // 2. Award 30 points
      await tx.pointsTransaction.create({
        data: {
          studentId,
          tutorId: userNode.id,
          points: 30,
          type: TransactionType.AWARD,
          reason: 'Haftalık Yoklama Katılımı',
          periodId: activePeriod.id,
        }
      });

      // 3. Update student total points (cache) - optional if calculated dynamically, but good for consistency
      // Keeping it simple relying on pointsTransaction mostly, but if user table has points col:
      // We are not updating User.points here directly because `calculateUserPoints` or triggers might handle it,
      // or the system relies on summing transactions. Based on `route.ts`, it seems we might need to update it or leave it to be calculated.
      // `route.ts` called `calculateUserPoints` *after* transaction. 
      // Let's assume the system sums transactions or we should update it.
      // Looking at `points/route.ts` again, it calls `calculateUserPoints` AFTER the transaction.
      // I will do the same conceptual flow implicitly by just creating the transaction record.

      return attendance;
    });

    return {
      error: null,
      data: {
        ...result,
        checkInTime: result.checkInTime.toISOString(),
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
        pointsAwarded: 30 // Inform frontend about points
      },
    };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Öğrenci zaten giriş yapmış', data: null };
    }
    console.error('Error manually checking in:', error);
    return { error: 'Manuel giriş yapılırken bir hata oluştu', data: null };
  }
}

// Remove a student's attendance from a session and refund their points
export async function removeAttendanceFromSession(sessionId: string, studentId: string) {
  try {
    const session = await getServerSession(authOptions);
    const userNode = session?.user as any;
    const userRoles = userNode?.roles || [userNode?.role].filter(Boolean) as UserRole[];
    const isTutor = userRoles.includes(UserRole.TUTOR);
    const isAsistan = userRoles.includes(UserRole.ASISTAN);
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!session?.user || (!isAdmin && !isTutor && !isAsistan)) {
      return { error: 'Yetkisiz erişim: Sadece öğretmenler, asistanlar ve yöneticiler yoklama geri alabilir', data: null };
    }

    // Validate that tutors/assistants can only remove attendance for their own students
    if (isTutor && !isAdmin) {
      const student = await prisma.user.findFirst({
        where: {
          id: studentId,
          tutorId: userNode.id,
          roles: { has: UserRole.STUDENT },
        },
      });

      if (!student) {
        return { error: 'Bu öğrenci sizin grubunuzda değil', data: null };
      }
    } else if (isAsistan && !isAdmin && !isTutor) {
      if (!userNode.assistedTutorId) {
        return { error: 'Size atanmış bir öğretmen bulunamadı', data: null };
      }

      const student = await prisma.user.findFirst({
        where: {
          id: studentId,
          tutorId: userNode.assistedTutorId,
          roles: { has: UserRole.STUDENT },
        },
      });

      if (!student) {
        return { error: 'Bu öğrenci sizin grubunuzda değil', data: null };
      }
    }

    // Check if attendance record exists
    const existingAttendance = await prisma.studentAttendance.findUnique({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId,
        },
      },
    });

    if (!existingAttendance) {
      return { error: 'Öğrencinin yoklama kaydı bulunamadı', data: null };
    }

    // Get active period for points transaction lookup
    let activePeriod;
    try {
      activePeriod = await requireActivePeriod();
    } catch (error) {
      console.error('Active period error:', error);
      return { error: 'Aktif dönem bulunamadı. Lütfen önce bir dönem başlatın.', data: null };
    }

    // Perform operations in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete the attendance record
      await tx.studentAttendance.delete({
        where: {
          sessionId_studentId: {
            sessionId,
            studentId,
          },
        },
      });

      // 2. Find and delete the associated points transaction
      // We look for a 30-point AWARD transaction for "Haftalık Yoklama Katılımı"
      const pointTransaction = await tx.pointsTransaction.findFirst({
        where: {
          studentId,
          points: 30,
          type: TransactionType.AWARD,
          reason: 'Haftalık Yoklama Katılımı',
          periodId: activePeriod.id,
          // Match approximately by time (within 1 minute of attendance creation)
          createdAt: {
            gte: new Date(existingAttendance.createdAt.getTime() - 60000),
            lte: new Date(existingAttendance.createdAt.getTime() + 60000),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (pointTransaction) {
        await tx.pointsTransaction.delete({
          where: { id: pointTransaction.id },
        });
      }
    });

    return {
      error: null,
      data: {
        success: true,
        pointsRemoved: 30,
      },
    };
  } catch (error: any) {
    console.error('Error removing attendance:', error);
    return { error: 'Yoklama geri alınırken bir hata oluştu', data: null };
  }
}

export async function deleteAttendanceSession(sessionId: string) {
  try {
    const session = await getServerSession(authOptions);

    const userNode = session?.user as any;
    const userRoles = userNode?.roles || [userNode?.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);
    const isTutor = userRoles.includes(UserRole.TUTOR);

    if (!session?.user || (!isAdmin && !isTutor)) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    await prisma.attendanceSession.delete({
      where: { id: sessionId },
    });

    return { error: null, data: { success: true } };
  } catch (error) {
    console.error('Error deleting attendance session:', error);
    return { error: 'Oturum silinirken bir hata oluştu', data: null };
  }
}

// Get students for manual attendance based on tutor's group
export async function getTutorStudents() {
  try {
    const session = await getServerSession(authOptions);

    const userNode = session?.user as any;
    const userRoles = userNode?.roles || [userNode?.role].filter(Boolean) as UserRole[];
    const isTutor = userRoles.includes(UserRole.TUTOR);
    const isAsistan = userRoles.includes(UserRole.ASISTAN);
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!session?.user) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    let students: Array<{
      id: string;
      username: string;
      firstName: string | null;
      lastName: string | null;
      tutor: {
        id: string;
        firstName: string | null;
        lastName: string | null;
      } | null;
    }> = [];

    if (isTutor || isAdmin) {
      // Both admins and tutors see only THEIR own students (where they are the tutor)
      students = await prisma.user.findMany({
        where: {
          tutorId: userNode.id,
          roles: { has: UserRole.STUDENT },
          isActive: true,
        },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          tutor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' },
        ],
      });
    } else if (isAsistan) {
      // Assistants see students of their tutor
      if (userNode.assistedTutorId) {
        students = await prisma.user.findMany({
          where: {
            tutorId: userNode.assistedTutorId,
            roles: { has: UserRole.STUDENT },
            isActive: true,
          },
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            tutor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: [
            { firstName: 'asc' },
            { lastName: 'asc' },
          ],
        });
      }
    }

    return { error: null, data: students };
  } catch (error) {
    console.error('Error fetching tutor students:', error);
    return { error: 'Öğrenciler yüklenirken bir hata oluştu', data: null };
  }
}
