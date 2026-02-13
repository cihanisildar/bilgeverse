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
        responsibleUsers: {
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
        createdAt: decision.createdAt.toISOString(),
        updatedAt: decision.updatedAt.toISOString(),
        responsibleUsers: decision.responsibleUsers.map((ru) => ({
          id: ru.user.id,
          username: ru.user.username,
          firstName: ru.user.firstName,
          lastName: ru.user.lastName,
        })),
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

    if (!session?.user) {
      return { error: 'Yetkisiz erişim: Sadece yöneticiler karar oluşturabilir', data: null };
    }

    const userNode = session.user as any;
    const userRoles = userNode.roles || [userNode.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return { error: 'Yetkisiz erişim: Sadece yöneticiler karar oluşturabilir', data: null };
    }

    const validated = createDecisionSchema.parse(data);

    const decision = await prisma.meetingDecision.create({
      data: {
        meetingId,
        title: validated.title,
        description: validated.description || null,
        targetDate: validated.targetDate ? new Date(validated.targetDate) : null,
        responsibleUsers: {
          create: validated.responsibleUserIds.map((userId) => ({
            userId,
          })),
        },
      },
      include: {
        responsibleUsers: {
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
        createdAt: decision.createdAt.toISOString(),
        updatedAt: decision.updatedAt.toISOString(),
        responsibleUsers: decision.responsibleUsers.map((ru) => ({
          id: ru.user.id,
          username: ru.user.username,
          firstName: ru.user.firstName,
          lastName: ru.user.lastName,
        })),
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

    if (!session?.user) {
      return { error: 'Yetkisiz erişim: Sadece yöneticiler karar güncelleyebilir', data: null };
    }

    const userNode = session.user as any;
    const userRoles = userNode.roles || [userNode.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return { error: 'Yetkisiz erişim: Sadece yöneticiler karar güncelleyebilir', data: null };
    }

    const validated = updateDecisionSchema.parse(data);

    const updateData: any = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description || null;
    if (validated.targetDate !== undefined) updateData.targetDate = validated.targetDate ? new Date(validated.targetDate) : null;
    if (validated.status !== undefined) updateData.status = validated.status;

    // Handle responsible users update
    if (validated.responsibleUserIds !== undefined) {
      // Delete existing responsible users
      await prisma.decisionResponsibleUser.deleteMany({
        where: { decisionId: id },
      });
      // Create new responsible users
      updateData.responsibleUsers = {
        create: validated.responsibleUserIds.map((userId) => ({
          userId,
        })),
      };
    }

    const decision = await prisma.meetingDecision.update({
      where: { id },
      data: updateData,
      include: {
        responsibleUsers: {
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
        createdAt: decision.createdAt.toISOString(),
        updatedAt: decision.updatedAt.toISOString(),
        responsibleUsers: decision.responsibleUsers.map((ru) => ({
          id: ru.user.id,
          username: ru.user.username,
          firstName: ru.user.firstName,
          lastName: ru.user.lastName,
        })),
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

    if (!session?.user) {
      return { error: 'Yetkisiz erişim: Sadece yöneticiler karar durumunu güncelleyebilir', data: null };
    }

    const userNode = session.user as any;
    const userRoles = userNode.roles || [userNode.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return { error: 'Yetkisiz erişim: Sadece yöneticiler karar durumunu güncelleyebilir', data: null };
    }

    const decision = await prisma.meetingDecision.update({
      where: { id },
      data: { status },
      include: {
        responsibleUsers: {
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
        createdAt: decision.createdAt.toISOString(),
        updatedAt: decision.updatedAt.toISOString(),
        responsibleUsers: decision.responsibleUsers.map((ru) => ({
          id: ru.user.id,
          username: ru.user.username,
          firstName: ru.user.firstName,
          lastName: ru.user.lastName,
        })),
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

    if (!session?.user) {
      return { error: 'Yetkisiz erişim: Sadece yöneticiler karar silebilir', data: null };
    }

    const userNode = session.user as any;
    const userRoles = userNode.roles || [userNode.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isAdmin) {
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

export async function getAllDecisions(statusFilter?: 'all' | 'completed' | 'todo' | 'in-progress' | 'pending') {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    // Build where clause based on status filter
    const whereClause: any = {};
    if (statusFilter === 'completed') {
      whereClause.status = DecisionStatus.DONE;
    } else if (statusFilter === 'todo') {
      whereClause.status = DecisionStatus.TODO;
    } else if (statusFilter === 'in-progress') {
      whereClause.status = DecisionStatus.IN_PROGRESS;
    } else if (statusFilter === 'pending') {
      whereClause.status = {
        in: [DecisionStatus.TODO, DecisionStatus.IN_PROGRESS],
      };
    }
    // If statusFilter is 'all' or undefined, no status filter is applied

    const decisions = await prisma.meetingDecision.findMany({
      where: whereClause,
      include: {
        meeting: {
          select: {
            id: true,
            title: true,
            meetingDate: true,
          },
        },
        responsibleUsers: {
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
        createdAt: decision.createdAt.toISOString(),
        updatedAt: decision.updatedAt.toISOString(),
        meeting: {
          id: decision.meeting.id,
          title: decision.meeting.title,
          meetingDate: decision.meeting.meetingDate.toISOString(),
        },
        responsibleUsers: decision.responsibleUsers.map((ru) => ({
          id: ru.user.id,
          username: ru.user.username,
          firstName: ru.user.firstName,
          lastName: ru.user.lastName,
        })),
      })),
    };
  } catch (error) {
    console.error('Error fetching all decisions:', error);
    return { error: 'Kararlar yüklenirken bir hata oluştu', data: null };
  }
}

export async function getDecisionStatistics() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { error: 'Yetkisiz erişim', data: null };
    }

    // Get all decisions count
    const totalDecisions = await prisma.meetingDecision.count();

    // Get completed decisions count
    const completedDecisions = await prisma.meetingDecision.count({
      where: { status: DecisionStatus.DONE },
    });

    // Get todo decisions count
    const todoDecisions = await prisma.meetingDecision.count({
      where: { status: DecisionStatus.TODO },
    });

    // Get in progress decisions count
    const inProgressDecisions = await prisma.meetingDecision.count({
      where: { status: DecisionStatus.IN_PROGRESS },
    });

    // Get pending decisions count (TODO + IN_PROGRESS)
    const pendingDecisions = await prisma.meetingDecision.count({
      where: {
        status: {
          in: [DecisionStatus.TODO, DecisionStatus.IN_PROGRESS],
        },
      },
    });

    return {
      error: null,
      data: {
        total: totalDecisions,
        completed: completedDecisions,
        todo: todoDecisions,
        inProgress: inProgressDecisions,
        pending: pendingDecisions,
      },
    };
  } catch (error) {
    console.error('Error fetching decision statistics:', error);
    return { error: 'Karar istatistikleri yüklenirken bir hata oluştu', data: null };
  }
}


