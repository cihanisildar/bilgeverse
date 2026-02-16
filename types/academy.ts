import { UserRole } from '@prisma/client';

export interface AcademyUser {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl?: string | null;
    roles?: UserRole[];
    role?: UserRole;
}

export interface AcademyAssignment {
    id: string;
    lessonId: string;
    userId: string;
    role: UserRole;
    user: AcademyUser;
}

export interface AcademyStudent {
    id: string;
    lessonId: string;
    studentId: string;
    joinedAt: Date;
    student: AcademyUser;
}

export interface AcademySyllabusItem {
    id: string;
    syllabusId: string;
    orderIndex: number;
    title: string;
    description: string | null;
}

export interface AcademySyllabus {
    id: string;
    lessonId: string;
    items: AcademySyllabusItem[];
}

export interface AcademyAttendance {
    id: string;
    sessionId: string;
    studentId: string;
    status: boolean;
    checkInTime: Date | null;
}

export interface AcademySession {
    id: string;
    lessonId: string;
    tutorId: string;
    title: string;
    description: string | null;
    date: Date;
    startTime: string | null;
    endTime: string | null;
    attendances: AcademyAttendance[];
}

export interface AcademyLesson {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    assignments: AcademyAssignment[];
    students: AcademyStudent[];
    syllabus: AcademySyllabus | null;
    sessions: AcademySession[];
    _count?: {
        students: number;
    };
}

export interface ActionResult<T = any> {
    data: T | null;
    error: string | null;
}
