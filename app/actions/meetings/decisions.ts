'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { createDecisionSchema, updateDecisionSchema } from '@/lib/validations/decisions';
import { UserRole, DecisionStatus } from '@prisma/client';

export async function getMeetingDecisions(meetingId: string) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    const decisions = await prisma.meetingDecision.findMany({
      where: { meetingId },
      include: {
        responsibleUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Serialize Date objects to ISO strings and ensure plain objects
    return {
      error: null,
      data: decisions.map((decision) => ({
        id: decision.id,
        title: decision.title,
        description: decision.description,
        targetDate: decision.targetDate?.toISOString() || null,
        status: decision.status,
        meetingId: decision.meetingId,
        responsibleUserId: decision.responsibleUserId,
        createdAt: decision.createdAt.toISOString(),
        updatedAt: decision.updatedAt.toISOString(),
        responsibleUser: decision.responsibleUser ? {
          id: decision.responsibleUser.id,
          username: decision.responsibleUser.username,
          firstName: decision.responsibleUser.firstName,
          lastName: decision.responsibleUser.lastName,
        } : null,
      })),
    };
  } catch (error) {
    console.error('Error fetching decisions:', error);
    return { error: 'Kararlar yüklenirken bir hata oluştu', data: null };
  }
}

export async function createDecision(meetingId: string, data: unknown) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return { error: 'Yetkisiz erişim: Sadece yöneticiler karar oluşturabilir', data: null };
    }

    const validated = createDecisionSchema.parse(data);
    
    const decision = await prisma.meetingDecision.create({
      data: {
        meetingId,
        title: validated.title,
        description: validated.description || null,
        responsibleUserId: validated.responsibleUserId || null,
        targetDate: validated.targetDate ? new Date(validated.targetDate) : null,
      },
      include: {
        responsibleUser: {
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
        id: decision.id,
        title: decision.title,
        description: decision.description,
        targetDate: decision.targetDate?.toISOString() || null,
        status: decision.status,
        meetingId: decision.meetingId,
        responsibleUserId: decision.responsibleUserId,
        createdAt: decision.createdAt.toISOString(),
        updatedAt: decision.updatedAt.toISOString(),
        responsibleUser: decision.responsibleUser ? {
          id: decision.responsibleUser.id,
          username: decision.responsibleUser.username,
          firstName: decision.responsibleUser.firstName,
          lastName: decision.responsibleUser.lastName,
        } : null,
      },
    };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { error: error.errors[0].message, data: null };
    }
    console.error('Error creating decision:', error);
    return { error: 'Karar oluşturulurken bir hata oluştu', data: null };
  }
}

export async function updateDecision(id: string, data: unknown) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return { error: 'Yetkisiz erişim: Sadece yöneticiler karar güncelleyebilir', data: null };
    }

    const validated = updateDecisionSchema.parse(data);
    
    const updateData: any = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description || null;
    if (validated.responsibleUserId !== undefined) updateData.responsibleUserId = validated.responsibleUserId || null;
    if (validated.targetDate !== undefined) updateData.targetDate = validated.targetDate ? new Date(validated.targetDate) : null;
    if (validated.status !== undefined) updateData.status = validated.status;

    const decision = await prisma.meetingDecision.update({
      where: { id },
      data: updateData,
      include: {
        responsibleUser: {
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
        id: decision.id,
        title: decision.title,
        description: decision.description,
        targetDate: decision.targetDate?.toISOString() || null,
        status: decision.status,
        meetingId: decision.meetingId,
        responsibleUserId: decision.responsibleUserId,
        createdAt: decision.createdAt.toISOString(),
        updatedAt: decision.updatedAt.toISOString(),
        responsibleUser: decision.responsibleUser ? {
          id: decision.responsibleUser.id,
          username: decision.responsibleUser.username,
          firstName: decision.responsibleUser.firstName,
          lastName: decision.responsibleUser.lastName,
        } : null,
      },
    };
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { error: error.errors[0].message, data: null };
    }
    console.error('Error updating decision:', error);
    return { error: 'Karar güncellenirken bir hata oluştu', data: null };
  }
}

export async function updateDecisionStatus(id: string, status: DecisionStatus) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return { error: 'Yetkisiz erişim: Sadece yöneticiler karar durumunu güncelleyebilir', data: null };
    }

    const decision = await prisma.meetingDecision.update({
      where: { id },
      data: { status },
      include: {
        responsibleUser: {
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
        id: decision.id,
        title: decision.title,
        description: decision.description,
        targetDate: decision.targetDate?.toISOString() || null,
        status: decision.status,
        meetingId: decision.meetingId,
        responsibleUserId: decision.responsibleUserId,
        createdAt: decision.createdAt.toISOString(),
        updatedAt: decision.updatedAt.toISOString(),
        responsibleUser: decision.responsibleUser ? {
          id: decision.responsibleUser.id,
          username: decision.responsibleUser.username,
          firstName: decision.responsibleUser.firstName,
          lastName: decision.responsibleUser.lastName,
        } : null,
      },
    };
  } catch (error) {
    console.error('Error updating decision status:', error);
    return { error: 'Karar durumu güncellenirken bir hata oluştu', data: null };
  }
}

export async function deleteDecision(id: string) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return { error: 'Yetkisiz erişim: Sadece yöneticiler karar silebilir', data: null };
    }

    await prisma.meetingDecision.delete({
      where: { id },
    });

    return { error: null, data: { success: true } };
  } catch (error) {
    console.error('Error deleting decision:', error);
    return { error: 'Karar silinirken bir hata oluştu', data: null };
  }
}

