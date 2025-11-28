'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole, CheckInMethod } from '@prisma/client';

export async function getMeetingAttendance(meetingId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    const attendance = await prisma.meetingAttendance.findMany({
      where: { meetingId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            boardMember: {
              select: {
                title: true,
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: {
        checkInTime: 'desc',
      },
    });

    // Serialize Date objects to ISO strings and ensure plain objects
    return {
      error: null,
      data: attendance.map((a) => ({
        id: a.id,
        checkInMethod: a.checkInMethod,
        checkInTime: a.checkInTime.toISOString(),
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        meetingId: a.meetingId,
        userId: a.userId,
        user: {
          id: a.user.id,
          username: a.user.username,
          firstName: a.user.firstName,
          lastName: a.user.lastName,
          boardMemberTitle: a.user.boardMember?.title || null,
        },
      })),
    };
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return { error: 'Katılım listesi yüklenirken bir hata oluştu', data: null };
  }
}

export async function checkInWithQR(meetingId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    // Find meeting with valid QR token (token is stored in meeting, not passed as parameter)
    const meeting = await prisma.managerMeeting.findFirst({
      where: {
        id: meetingId,
        qrCodeToken: {
          not: null,
        },
        qrCodeExpiresAt: {
          gte: new Date(),
        },
      },
    });

    if (!meeting || !meeting.qrCodeToken) {
      return { error: 'Geçersiz veya süresi dolmuş QR kod', data: null };
    }

    // Check if already checked in
    const existing = await prisma.meetingAttendance.findUnique({
      where: {
        meetingId_userId: {
          meetingId,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      return { error: 'Zaten giriş yapılmış', data: null };
    }

    // Create attendance record
    const attendance = await prisma.meetingAttendance.create({
      data: {
        meetingId,
        userId: session.user.id,
        checkInMethod: CheckInMethod.QR,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Serialize Date objects to ISO strings and ensure plain objects
    return {
      error: null,
      data: {
        id: attendance.id,
        checkInMethod: attendance.checkInMethod,
        checkInTime: attendance.checkInTime.toISOString(),
        createdAt: attendance.createdAt.toISOString(),
        updatedAt: attendance.updatedAt.toISOString(),
        meetingId: attendance.meetingId,
        userId: attendance.userId,
        user: {
          id: attendance.user.id,
          username: attendance.user.username,
          firstName: attendance.user.firstName,
          lastName: attendance.user.lastName,
        },
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

export async function manualCheckIn(meetingId: string, userId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return { error: 'Yetkisiz erişim: Sadece yöneticiler manuel giriş yapabilir', data: null };
    }

    // Check if already checked in
    const existing = await prisma.meetingAttendance.findUnique({
      where: {
        meetingId_userId: {
          meetingId,
          userId,
        },
      },
    });

    if (existing) {
      return { error: 'Kullanıcı zaten giriş yapmış', data: null };
    }

    // Create attendance record
    const attendance = await prisma.meetingAttendance.create({
      data: {
        meetingId,
        userId,
        checkInMethod: CheckInMethod.MANUAL,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Serialize Date objects to ISO strings and ensure plain objects
    return {
      error: null,
      data: {
        id: attendance.id,
        checkInMethod: attendance.checkInMethod,
        checkInTime: attendance.checkInTime.toISOString(),
        createdAt: attendance.createdAt.toISOString(),
        updatedAt: attendance.updatedAt.toISOString(),
        meetingId: attendance.meetingId,
        userId: attendance.userId,
        user: {
          id: attendance.user.id,
          username: attendance.user.username,
          firstName: attendance.user.firstName,
          lastName: attendance.user.lastName,
        },
      },
    };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Kullanıcı zaten giriş yapmış', data: null };
    }
    console.error('Error manually checking in:', error);
    return { error: 'Manuel giriş yapılırken bir hata oluştu', data: null };
  }
}

export async function removeAttendance(attendanceId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return { error: 'Yetkisiz erişim: Sadece yöneticiler katılım kaydını silebilir', data: null };
    }

    await prisma.meetingAttendance.delete({
      where: { id: attendanceId },
    });

    return { error: null, data: { success: true } };
  } catch (error) {
    console.error('Error removing attendance:', error);
    return { error: 'Katılım kaydı silinirken bir hata oluştu', data: null };
  }
}

