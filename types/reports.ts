export interface BaseReportResponse<T> {
    error: string | null;
    data: T | null;
}

// Weekly Participation Report
export interface WeeklySession {
    id: string;
    title: string;
    type: string;
    date: string;
    registered: number;
    attended: number;
}

export interface TutorWeeklyStats {
    id: string;
    name: string;
    username: string;
    eventsCreated: number;
    totalAttendance: number;
    totalRegistered: number;
    participationRate: number;
    weeklySessions: WeeklySession[];
}

export interface WeeklyParticipationReport {
    weekStart: string;
    weekEnd: string;
    summary: {
        totalEvents: number;
        totalAttendance: number;
        totalRegistered: number;
        avgParticipation: number;
        activeTutors: number;
        totalTutors: number;
    };
    tutorStats: TutorWeeklyStats[];
}

// Syllabus Tracking Report
export interface SyllabusLesson {
    id: string;
    title: string;
}

export interface TutorSyllabusNote {
    lesson: string;
    note: string;
    date: string;
}

export interface TutorSyllabusProgress {
    tutorId: string;
    tutorName: string;
    tutorUsername: string;
    classroomName: string;
    completedCount: number;
    lastTaughtDate: string | null;
    latestNotes: TutorSyllabusNote[];
    completedLessonIds: string[];
    progress: number;
}

export interface SyllabusTrackingData {
    id: string;
    title: string;
    tutorName: string;
    tutorUsername: string;
    totalTopics: number;
    lessons: SyllabusLesson[];
    tutorProgress: TutorSyllabusProgress[];
    progress: number;
    avgRating: string | null;
    feedbackCount: number;
    createdAt: string;
}

export interface SyllabusTrackingReport {
    summary: {
        totalSyllabuses: number;
        averageProgress: number;
        completedSyllabuses: number;
    };
    syllabuses: SyllabusTrackingData[];
}

// Attendance Alerts Report
export interface MissedActivity {
    id: string;
    type: 'EVENT' | 'SESSION';
    title: string;
    date: string;
    status: string;
}

export interface StudentAlert {
    id: string;
    name: string;
    username: string;
    email: string | null;
    phone: string | null;
    classroomId: string | null;
    classroomName: string;
    attendedCount: number;
    totalPotential: number;
    attendancePercentage: number;
    missedActivities: MissedActivity[];
}

export interface AttendanceAlertsReport {
    summary: {
        threshold: number;
        totalStudents: number;
        studentsNeedingAttention: number;
        averageAttendance: number;
    };
    alerts: StudentAlert[];
}

// Events Overview Report
export interface RecentEvent {
    id: string;
    title: string;
    type: string;
    date: string;
    registered: number;
    attended: number;
}

export interface TutorEventStats {
    id: string;
    name: string;
    username: string;
    totalEvents: number;
    eventsThisWeek: number;
    eventsThisMonth: number;
    totalRegistered: number;
    totalAttended: number;
    participationRate: number;
    recentEvents: RecentEvent[];
}

export interface EventsOverviewReport {
    summary: {
        totalTutors: number;
        totalEvents: number;
        avgParticipation: number;
        totalAttended: number;
        totalRegistered: number;
    };
    tutors: TutorEventStats[];
}
