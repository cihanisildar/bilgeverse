'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function getAllUsers() {
  try {
    const session = await getServerSession(authOptions);
    const userNode = session?.user as any;
    const userRoles = userNode?.roles || [userNode?.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!session?.user || !isAdmin) {
      return { error: 'Unauthorized: Only admin can view all users', data: null };
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
      },
      orderBy: {
        username: 'asc',
      },
    });

    return { error: null, data: users };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { error: 'Failed to fetch users', data: null };
  }
}

/**
 * Returns the users eligible for Yönetim Kurulu (board) actions — selecting
 * responsible members on meeting decisions and board-member check-in.
 *
 * Despite the legacy name, this is NOT admins-only: it returns every active
 * board member (source of truth: the BoardMember table) plus admins, so the
 * full board shows up in the "Sorumlu Yönetim Kurulu Üyeleri" selectors.
 */
export async function getAdminUsers() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return { error: 'Unauthorized', data: null };
    }

    const userSelect = {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
    } as const;

    // Admins (single role field or multi-role array) + active board members.
    const [admins, activeBoardMembers] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { role: UserRole.ADMIN },
            { roles: { has: UserRole.ADMIN } },
          ],
        },
        select: userSelect,
      }),
      prisma.boardMember.findMany({
        where: { isActive: true },
        select: { user: { select: userSelect } },
      }),
    ]);

    // Merge and de-duplicate by user id.
    const byId = new Map<string, { id: string; username: string; firstName: string | null; lastName: string | null }>();
    for (const admin of admins) {
      byId.set(admin.id, admin);
    }
    for (const member of activeBoardMembers) {
      byId.set(member.user.id, member.user);
    }

    const users = Array.from(byId.values()).sort((a, b) =>
      a.username.localeCompare(b.username, 'tr')
    );

    return { error: null, data: users };
  } catch (error) {
    console.error('Error fetching board/admin users:', error);
    return { error: 'Failed to fetch board members', data: null };
  }
}

