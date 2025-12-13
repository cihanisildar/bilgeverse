'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { NotificationType } from '@prisma/client';

export async function getNotifications() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to 50 most recent
    });

    return {
      error: null,
      data: notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { error: 'Bildirimler yüklenirken bir hata oluştu', data: null };
  }
}

export async function getUnreadNotificationCount() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    const count = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });

    return { error: null, data: count };
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return { error: 'Bildirim sayısı yüklenirken bir hata oluştu', data: null };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    await prisma.notification.update({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
      data: {
        isRead: true,
      },
    });

    return { error: null, data: { success: true } };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { error: 'Bildirim güncellenirken bir hata oluştu', data: null };
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { error: null, data: { success: true } };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { error: 'Bildirimler güncellenirken bir hata oluştu', data: null };
  }
}

export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data,
    });

    return {
      error: null,
      data: {
        ...notification,
        createdAt: notification.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { error: 'Bildirim oluşturulurken bir hata oluştu', data: null };
  }
}

// Check for students with 2+ weeks of absence and send notifications
export async function checkAndNotifyAbsentStudents() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    // Get all sessions from the last 4 weeks
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const recentSessions = await prisma.attendanceSession.findMany({
      where: {
        sessionDate: {
          gte: fourWeeksAgo,
        },
        status: {
          not: 'CANCELLED',
        },
      },
      include: {
        attendances: true,
        createdBy: true,
      },
      orderBy: {
        sessionDate: 'desc',
      },
    });

    // Get all students
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        isActive: true,
      },
      include: {
        tutor: true,
      },
    });

    const notificationsCreated = [];

    for (const student of students) {
      // Count how many sessions the student attended
      const studentAttendances = recentSessions.filter(session =>
        session.attendances.some(a => a.studentId === student.id)
      ).length;

      const totalSessions = recentSessions.length;
      const missedSessions = totalSessions - studentAttendances;

      // If student missed 2 or more consecutive weeks
      if (missedSessions >= 2 && student.tutorId) {
        // Check if we already sent a notification recently (within last 7 days)
        const recentNotification = await prisma.absenceNotification.findFirst({
          where: {
            studentId: student.id,
            tutorId: student.tutorId,
            notificationSent: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        });

        if (!recentNotification) {
          // Create absence notification record
          await prisma.absenceNotification.create({
            data: {
              studentId: student.id,
              tutorId: student.tutorId,
              weeksMissed: missedSessions,
            },
          });

          // Create in-app notification for tutor
          const notification = await createNotification({
            userId: student.tutorId,
            type: NotificationType.ABSENCE_ALERT,
            title: 'Öğrenci Devamsızlık Uyarısı',
            message: `${student.firstName} ${student.lastName} (${student.username}) son ${missedSessions} hafta derse katılmadı.`,
          });

          if (!notification.error) {
            notificationsCreated.push(notification.data);
          }
        }
      }
    }

    return {
      error: null,
      data: {
        notificationsCreated: notificationsCreated.length,
        notifications: notificationsCreated,
      },
    };
  } catch (error) {
    console.error('Error checking absent students:', error);
    return { error: 'Devamsızlık kontrolü yapılırken bir hata oluştu', data: null };
  }
}
