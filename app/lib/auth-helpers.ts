import { UserRole } from '@prisma/client';

export const USER_AUTH_SELECT = {
    id: true,
    username: true,
    password: true,
    role: true,
    roles: true,
    firstName: true,
    lastName: true,
    points: true,
    experience: true,
    tutorId: true,
    assistedTutorId: true,
    tutor: {
        select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
        }
    },
    boardMember: {
        select: {
            id: true,
            isActive: true
        }
    },
    _count: {
        select: {
            academyAssignments: true,
            academyStudents: true
        }
    }
};

/**
 * Normalizes user roles by adding dynamic roles based on relations.
 */
export function normalizeUserRoles(user: any): UserRole[] {
    const rolesSet = new Set<UserRole>(user.roles || [user.role].filter(Boolean));
    
    if (user.boardMember?.isActive) {
        rolesSet.add(UserRole.BOARD_MEMBER);
    }
    
    return Array.from(rolesSet);
}

/**
 * Determines if a user is part of the academy.
 */
export function isUserInAcademy(user: any): boolean {
    return (user._count?.academyAssignments || 0) > 0 || (user._count?.academyStudents || 0) > 0;
}
