'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole, CheckInMethod, AttendanceSessionStatus } from '@prisma/client';
import crypto from 'crypto';

export async function getAttendanceSessions() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    // For tutors, only show their sessions
    const where = session.user.role === UserRole.TUTOR
      ? { createdById: session.user.id }
      : {}; // Admins can see all

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
  sessionDate: Date;
  generateQR?: boolean;
}) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TUTOR)) {
      return { error: 'Yetkisiz erişim: Sadece öğretmenler ve yöneticiler oturum oluşturabilir', data: null };
    }

    let qrCodeToken = null;
    let qrCodeExpiresAt = null;

    if (data.generateQR) {
      qrCodeToken = crypto.randomBytes(32).toString('hex');
      // QR code expires 24 hours after session date
      qrCodeExpiresAt = new Date(data.sessionDate.getTime() + 24 * 60 * 60 * 1000);
    }

    const attendanceSession = await prisma.attendanceSession.create({
      data: {
        title: data.title,
        description: data.description,
        sessionDate: data.sessionDate,
        qrCodeToken,
        qrCodeExpiresAt,
        createdById: session.user.id,
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

    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TUTOR)) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    const attendanceSession = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data,
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

    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TUTOR)) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!attendanceSession) {
      return { error: 'Oturum bulunamadı', data: null };
    }

    const qrCodeToken = crypto.randomBytes(32).toString('hex');
    const qrCodeExpiresAt = new Date(attendanceSession.sessionDate.getTime() + 24 * 60 * 60 * 1000);

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

    // Create attendance record
    const attendance = await prisma.studentAttendance.create({
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

    return {
      error: null,
      data: {
        ...attendance,
        checkInTime: attendance.checkInTime.toISOString(),
        createdAt: attendance.createdAt.toISOString(),
        updatedAt: attendance.updatedAt.toISOString(),
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

    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TUTOR)) {
      return { error: 'Yetkisiz erişim: Sadece öğretmenler ve yöneticiler manuel giriş yapabilir', data: null };
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

    // Create attendance record
    const attendance = await prisma.studentAttendance.create({
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

    return {
      error: null,
      data: {
        ...attendance,
        checkInTime: attendance.checkInTime.toISOString(),
        createdAt: attendance.createdAt.toISOString(),
        updatedAt: attendance.updatedAt.toISOString(),
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

export async function deleteAttendanceSession(sessionId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.TUTOR)) {
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
