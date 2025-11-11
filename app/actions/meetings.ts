'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { createMeetingSchema, updateMeetingSchema } from '@/lib/validations/meetings';
import { UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';

export async function getMeetings() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    const meetings = await prisma.managerMeeting.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            attendees: true,
            decisions: true,
          },
        },
      },
      orderBy: {
        meetingDate: 'desc',
      },
    });

    // Serialize Date objects to ISO strings and ensure plain objects
    return {
      error: null,
      data: meetings.map((meeting) => ({
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        meetingDate: meeting.meetingDate.toISOString(),
        location: meeting.location,
        status: meeting.status,
        qrCodeToken: meeting.qrCodeToken,
        qrCodeExpiresAt: meeting.qrCodeExpiresAt?.toISOString() || null,
        createdAt: meeting.createdAt.toISOString(),
        updatedAt: meeting.updatedAt.toISOString(),
        createdBy: {
          id: meeting.createdBy.id,
          username: meeting.createdBy.username,
          firstName: meeting.createdBy.firstName,
          lastName: meeting.createdBy.lastName,
        },
        _count: {
          attendees: meeting._count.attendees,
          decisions: meeting._count.decisions,
        },
      })),
    };
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return { error: 'Toplantılar yüklenirken bir hata oluştu', data: null };
  }
}

export async function getMeetingById(id: string) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    const meeting = await prisma.managerMeeting.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            attendees: true,
            decisions: true,
          },
        },
      },
    });

    if (!meeting) {
      return { error: 'Toplantı bulunamadı', data: null };
    }

    // Serialize Date objects to ISO strings and ensure plain objects
    return {
      error: null,
      data: {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        meetingDate: meeting.meetingDate.toISOString(),
        location: meeting.location,
        status: meeting.status,
        qrCodeToken: meeting.qrCodeToken,
        qrCodeExpiresAt: meeting.qrCodeExpiresAt?.toISOString() || null,
        createdAt: meeting.createdAt.toISOString(),
        updatedAt: meeting.updatedAt.toISOString(),
        createdBy: {
          id: meeting.createdBy.id,
          username: meeting.createdBy.username,
          firstName: meeting.createdBy.firstName,
          lastName: meeting.createdBy.lastName,
        },
        _count: {
          attendees: meeting._count.attendees,
          decisions: meeting._count.decisions,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return { error: 'Toplantı yüklenirken bir hata oluştu', data: null };
  }
}

export async function createMeeting(data: unknown) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return { error: 'Yetkisiz erişim: Sadece yöneticiler toplantı oluşturabilir', data: null };
    }

    const validated = createMeetingSchema.parse(data);
    
    const meeting = await prisma.managerMeeting.create({
      data: {
        title: validated.title,
        description: validated.description || null,
        meetingDate: new Date(validated.meetingDate),
        location: validated.location,
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

    // Serialize Date objects to ISO strings and ensure plain objects
    return {
      error: null,
      data: {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        meetingDate: meeting.meetingDate.toISOString(),
        location: meeting.location,
        status: meeting.status,
        qrCodeToken: meeting.qrCodeToken,
        qrCodeExpiresAt: meeting.qrCodeExpiresAt?.toISOString() || null,
        createdAt: meeting.createdAt.toISOString(),
        updatedAt: meeting.updatedAt.toISOString(),
        createdBy: {
          id: meeting.createdBy.id,
          username: meeting.createdBy.username,
          firstName: meeting.createdBy.firstName,
          lastName: meeting.createdBy.lastName,
        },
        _count: {
          attendees: 0,
          decisions: 0,
        },
      },
    };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { error: error.errors[0].message, data: null };
    }
    console.error('Error creating meeting:', error);
    return { error: 'Toplantı oluşturulurken bir hata oluştu', data: null };
  }
}

export async function updateMeeting(id: string, data: unknown) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return { error: 'Yetkisiz erişim: Sadece yöneticiler toplantı güncelleyebilir', data: null };
    }

    const validated = updateMeetingSchema.parse(data);
    
    const updateData: any = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description || null;
    if (validated.meetingDate !== undefined) {
      updateData.meetingDate = validated.meetingDate ? new Date(validated.meetingDate) : null;
    }
    if (validated.location !== undefined) updateData.location = validated.location;
    if (validated.status !== undefined) updateData.status = validated.status;

    const meeting = await prisma.managerMeeting.update({
      where: { id },
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

    // Serialize Date objects to ISO strings and ensure plain objects
    return {
      error: null,
      data: {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        meetingDate: meeting.meetingDate.toISOString(),
        location: meeting.location,
        status: meeting.status,
        qrCodeToken: meeting.qrCodeToken,
        qrCodeExpiresAt: meeting.qrCodeExpiresAt?.toISOString() || null,
        createdAt: meeting.createdAt.toISOString(),
        updatedAt: meeting.updatedAt.toISOString(),
        createdBy: {
          id: meeting.createdBy.id,
          username: meeting.createdBy.username,
          firstName: meeting.createdBy.firstName,
          lastName: meeting.createdBy.lastName,
        },
        _count: {
          attendees: 0,
          decisions: 0,
        },
      },
    };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { error: error.errors[0].message, data: null };
    }
    console.error('Error updating meeting:', error);
    return { error: 'Toplantı güncellenirken bir hata oluştu', data: null };
  }
}

export async function deleteMeeting(id: string) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return { error: 'Yetkisiz erişim: Sadece yöneticiler toplantı silebilir', data: null };
    }

    if (!id || typeof id !== 'string') {
      return { error: 'Geçersiz toplantı ID', data: null };
    }

    // Check if meeting exists first
    const meeting = await prisma.managerMeeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      return { error: 'Toplantı bulunamadı', data: null };
    }

    await prisma.managerMeeting.delete({
      where: { id },
    });

    return { error: null, data: { success: true } };
  } catch (error: any) {
    console.error('Error deleting meeting:', error);
    
    // Provide more specific error messages
    if (error?.code === 'P2025') {
      return { error: 'Toplantı bulunamadı', data: null };
    }
    
    if (error?.code === 'P2003') {
      return { error: 'Bu toplantıya bağlı kayıtlar silinemedi', data: null };
    }
    
    const errorMessage = error?.message || 'Toplantı silinirken bir hata oluştu';
    return { error: errorMessage, data: null };
  }
}

export async function generateQRCode(meetingId: string) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return { error: 'Yetkisiz erişim: Sadece yöneticiler QR kod oluşturabilir', data: null };
    }

    // Check if meeting exists
    const meeting = await prisma.managerMeeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      return { error: 'Toplantı bulunamadı', data: null };
    }

    // Generate secure random token
    const token = randomBytes(32).toString('hex');
    
    // Set expiration to meeting date + 1 day
    const expiresAt = new Date(meeting.meetingDate);
    expiresAt.setDate(expiresAt.getDate() + 1);

    const updated = await prisma.managerMeeting.update({
      where: { id: meetingId },
      data: {
        qrCodeToken: token,
        qrCodeExpiresAt: expiresAt,
      },
    });

    return {
      error: null,
      data: {
        token,
        expiresAt: updated.qrCodeExpiresAt?.toISOString() || null,
      },
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    return { error: 'QR kod oluşturulurken bir hata oluştu', data: null };
  }
}

