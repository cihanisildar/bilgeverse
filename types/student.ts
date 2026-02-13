export interface Student {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    points: number;
}

export interface StudentDetails extends Student {
    email?: string;
    experience: number;
    rank?: number;
    totalStudents?: number;
    createdAt?: string;
}

export interface PointTransaction {
    id: string;
    points: number;
    type: string;
    reason: string;
    createdAt: string;
    tutor?: {
        id: string;
        username: string;
        firstName?: string;
        lastName?: string;
    };
}

export interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
