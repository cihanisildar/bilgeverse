import { UserRole } from '@prisma/client';

/**
 * Defines which parts each role can access on the dashboard page
 * Note: Students don't have access to the dashboard page itself, only their specific part7 area
 */
export const ROLE_PART_PERMISSIONS: Record<UserRole, number[]> = {
    [UserRole.ADMIN]: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Admin can see all parts
    [UserRole.BOARD_MEMBER]: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Board Member can see all parts
    [UserRole.TUTOR]: [2, 7], // Tutor can see Part 2 and Part 7 on dashboard
    [UserRole.ASISTAN]: [2, 7], // Asistan can see Part 2 and Part 7 on dashboard
    [UserRole.STUDENT]: [], // Students don't access the dashboard page
};

/**
 * Check if a user role has access to a specific part
 * @param role - The user's role
 * @param partId - The part ID to check access for
 * @returns boolean indicating if the role has access
 */
export function canAccessPart(role: UserRole, partId: number): boolean {
    const allowedParts = ROLE_PART_PERMISSIONS[role] || [];
    return allowedParts.includes(partId);
}

/**
 * Get all part IDs that a role can access
 * @param role - The user's role
 * @returns Array of part IDs the role can access
 */
export function getAllowedParts(role: UserRole): number[] {
    return ROLE_PART_PERMISSIONS[role] || [];
}
