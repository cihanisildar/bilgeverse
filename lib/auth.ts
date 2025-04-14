"use client"

import { UserRole } from '@prisma/client';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface UserJwtPayload {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  tutorId?: string | null;
  [key: string]: string | UserRole | null | undefined;
}

export async function verifyJWT(token: string): Promise<UserJwtPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as UserJwtPayload;
  } catch (error) {
    return null;
  }
}

export function isAuthenticated(user: UserJwtPayload | null) {
  return user !== null;
}

export function isAdmin(user: UserJwtPayload | null) {
  return user?.role === UserRole.ADMIN;
}

export function isTutor(user: UserJwtPayload | null) {
  return user?.role === UserRole.TUTOR;
}

export function isStudent(user: UserJwtPayload | null) {
  return user?.role === UserRole.STUDENT;
} 