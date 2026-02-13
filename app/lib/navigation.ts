import { UserRole } from '@prisma/client';

/**
 * Returns the role-based path for a given user role or list of roles
 * @param role - The user's role or array of roles
 * @returns The path corresponding to the highest priority role
 */
export function getRoleBasedPath(role: UserRole | UserRole[]): string {
  const roles = Array.isArray(role) ? role : [role];

  // Priority-based redirection
  if (roles.includes(UserRole.ADMIN)) {
    return '/dashboard/part7/admin';
  }

  if (roles.includes(UserRole.TUTOR) || roles.includes(UserRole.ASISTAN)) {
    return '/dashboard/part7/tutor';
  }

  if (roles.includes(UserRole.STUDENT) || roles.includes((UserRole as any).ATHLETE)) {
    return '/dashboard/part7/student';
  }

  if (roles.includes(UserRole.BOARD_MEMBER) || roles.includes(UserRole.DONOR)) {
    return '/dashboard';
  }

  return '/dashboard';
}

