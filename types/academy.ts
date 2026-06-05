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

export type AcademyMaterialType = 'PDF' | 'VIDEO' | 'DOCUMENT' | 'LINK';
export type AcademyNoteType = 'NOTE' | 'EVALUATION' | 'OBSERVATION';

export interface AcademyMaterial {
    id: string;
    lessonId: string;
    title: string;
    description: string | null;
    type: AcademyMaterialType;
    url: string;
    fileKey: string | null;
    uploadedById: string;
    createdAt: Date | string;
    uploadedBy?: AcademyUser;
}

export interface AcademyStudentNote {
    id: string;
    lessonId: string;
    studentId: string;
    authorId: string;
    type: AcademyNoteType;
    content: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    author?: AcademyUser;
    student?: AcademyUser;
}

export interface AcademyTaskCompletion {
    id: string;
    taskId: string;
    studentId: string;
    completedAt: Date | string;
    awardedById: string;
    pointsTransactionId: string | null;
}

export interface AcademyTask {
    id: string;
    lessonId: string;
    title: string;
    description: string | null;
    points: number;
    dueDate: Date | string | null;
    createdById: string;
    createdAt: Date | string;
    completions: AcademyTaskCompletion[];
}

export interface AcademyStudentReport {
    studentId: string;
    student: AcademyUser;
    attendedSessions: number;
    absentSessions: number;
    attendanceRate: number;
    completedTasks: number;
    earnedPoints: number;
}

export interface AcademyLessonReport {
    summary: {
        lessonName: string;
        totalStudents: number;
        totalSessions: number;
        totalTasks: number;
        averageAttendanceRate: number;
        totalPointsAwarded: number;
        generatedAt: string;
    };
    studentReports: AcademyStudentReport[];
}

export interface AcademyLesson {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    startDate: Date | string | null;
    capacity: number | null;
    assignments: AcademyAssignment[];
    students: AcademyStudent[];
    syllabus: AcademySyllabus | null;
    sessions: AcademySession[];
    materials: AcademyMaterial[];
    tasks: AcademyTask[];
    notes: AcademyStudentNote[];
    _count?: {
        students: number;
    };
}

export interface ActionResult<T = any> {
    data: T | null;
    error: string | null;
}
