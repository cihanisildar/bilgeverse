import { UserRole, TutorPromotionStatus } from '@prisma/client';

export interface TutorPromotion {
    id: string;
    userId: string;
    requestedRole: UserRole;
    status: TutorPromotionStatus;
    notes: string | null;
    rejectionReason: string | null;
    createdAt: string;
    reviewedAt: string | null;
    user: {
        id: string;
        username: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        role: UserRole;
        phone?: string | null;
    };
    createdBy: {
        id: string;
        username: string;
        firstName: string | null;
        lastName: string | null;
    };
    reviewedBy: {
        id: string;
        username: string;
        firstName: string | null;
        lastName: string | null;
    } | null;
}

export interface EligibleUser {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    role: UserRole;
}
