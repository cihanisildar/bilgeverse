import { UserRole } from '@prisma/client';

/**
 * Returns the role-based path for a given user role
 * @param role - The user's role
 * @returns The path corresponding to the role
 */
export function getRoleBasedPath(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return '/dashboard/part7/admin';
    case UserRole.TUTOR:
    case UserRole.ASISTAN:
      return '/dashboard/part7/tutor';
    case UserRole.STUDENT:
      return '/dashboard/part7/student';
    default:
      return '/dashboard';
  }
}

