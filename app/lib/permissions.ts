import { UserRole } from '@prisma/client';

/**
 * Defines which parts each role can access on the dashboard page
 * Note: Students don't have access to the dashboard page itself, only their specific part7 area
 */
export const ROLE_PART_PERMISSIONS: Record<UserRole, number[]> = {
    [UserRole.ADMIN]: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Admin can see all parts
    [UserRole.BOARD_MEMBER]: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Board Member can see all parts
    [UserRole.TUTOR]: [2, 4, 7], // Tutor can see Part 2, Part 4 and Part 7 on dashboard
    [UserRole.ASISTAN]: [2, 4, 7], // Asistan can see Part 2, Part 4 and Part 7 on dashboard
    [UserRole.STUDENT]: [4, 7], // Students can access Part 4 (Workshops) and Part 7 (Bilgeverse)
    [UserRole.DONOR]: [], // Donors don't have dashboard access by default
    [UserRole.ATHLETE]: [9], // Athletes can access Part 9 (Athlete Management)
};

/**
 * Check if a user has access to a specific part based on their roles
 * @param roleList - Array of user roles
 * @param partId - The part ID to check access for
 * @returns boolean indicating if any role has access
 */
export function canAccessPart(roleList: UserRole[], partId: number): boolean {
    if (!roleList || roleList.length === 0) return false;

    // Check if any of the roles in the list have permission for the part
    return roleList.some(role => {
        const allowedParts = ROLE_PART_PERMISSIONS[role] || [];
        return allowedParts.includes(partId);
    });
}

/**
 * Get all part IDs that a user can access from all their roles
 * @param roleList - Array of user roles
 * @returns Array of unique part IDs the user can access
 */
export function getAllowedParts(roleList: UserRole[]): number[] {
    if (!roleList || roleList.length === 0) return [];

    const allAllowedParts = new Set<number>();
    roleList.forEach(role => {
        const parts = ROLE_PART_PERMISSIONS[role] || [];
        parts.forEach(part => allAllowedParts.add(part));
    });

    return Array.from(allAllowedParts);
}

import { Session } from 'next-auth';

/**
 * Higher-level helper for server components to check if a user is authorized for a part
 * @param session - The NextAuth session
 * @param partId - The part ID to check
 */
export function isAuthorized(session: Session | null, partId: number): boolean {
    if (!session?.user) return false;

    const user = session.user;
    const roles = user.roles || (user.role ? [user.role] : []);

    if (roles.length === 0) return false;
    return canAccessPart(roles, partId);
}
