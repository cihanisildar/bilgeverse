import { UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';

/**
 * Defines which parts each role can access on the dashboard page
 * Note: Students don't have access to the dashboard page itself, only their specific part7 area
 */
export const ROLE_PART_PERMISSIONS: Record<UserRole, number[]> = {
    [UserRole.ADMIN]: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // Admin can see all parts
    [UserRole.BOARD_MEMBER]: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // Board Member can see all parts
    [UserRole.TUTOR]: [2, 4, 7, 11], // Tutor can see Part 2, Part 4, Part 7 and Part 11
    [UserRole.ASISTAN]: [2, 4, 7, 11], // Asistan can see Part 2, Part 4, Part 7 and Part 11
    [UserRole.STUDENT]: [4, 7, 11], // Students can access Part 4, Part 7 and Part 11
    [UserRole.DONOR]: [], // Donors don't have dashboard access by default
    [UserRole.ATHLETE]: [9, 11], // Athletes can access Part 9 and Part 11
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
export async function isAuthorized(session: Session | null, partId: number): Promise<boolean> {
    if (!session?.user) return false;

    const user = session.user;
    const roles = (user.roles || (user.role ? [user.role] : [])) as UserRole[];

    // Explicitly allow board members to access part 1 if they have the role
    // or if they are marked as isBoardMember in the session
    let isBoardMember = roles.includes(UserRole.BOARD_MEMBER) || (user as any).isBoardMember;
    
    // Fallback database check for board members if session is stale
    if (!isBoardMember && partId === 1) {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { boardMember: { select: { isActive: true } } }
        });
        
        if (dbUser) {
            isBoardMember = dbUser.roles.includes(UserRole.BOARD_MEMBER) || 
                           dbUser.role === UserRole.BOARD_MEMBER ||
                           !!dbUser.boardMember?.isActive;
        }
    }
    
    if (partId === 1 && isBoardMember) return true;

    if (roles.length === 0) return false;
    return canAccessPart(roles, partId);
}
