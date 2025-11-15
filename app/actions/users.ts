'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function getAllUsers() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
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

export async function getAdminUsers() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return { error: 'Unauthorized', data: null };
    }

    const users = await prisma.user.findMany({
      where: {
        role: UserRole.ADMIN,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
      },
      orderBy: {
        username: 'asc',
      },
    });

    return { error: null, data: users };
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return { error: 'Failed to fetch admin users', data: null };
  }
}

