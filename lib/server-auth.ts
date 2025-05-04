import { NextRequest } from 'next/server';
import { User, UserRole } from '@prisma/client';
import prisma from './prisma';

export async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  // TODO: Implement actual user authentication logic
  // This is a placeholder - replace with your actual auth logic
  const userId = request.headers.get('x-user-id');
  if (!userId) return null;
  
  return prisma.user.findUnique({
    where: { id: userId }
  });
}

export function isAuthenticated(user: User | null): user is User {
  return user !== null;
}

export function isStudent(user: User): boolean {
  return user.role === UserRole.STUDENT;
} 