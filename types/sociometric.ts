export interface GroupLeader {
    id: string;
    name: string;
    avatarUrl?: string;
    attendanceCount: number;
    participationCount: number;
    participationRate: number;
}

export interface IsolatedStudent {
    id: string;
    name: string;
    avatarUrl?: string;
    attendanceCount: number;
    participationCount: number;
    lastActivityDate?: string;
}

export interface FriendGroup {
    students: {
        id: string;
        name: string;
        avatarUrl?: string;
    }[];
    commonActivities: number;
    activityNames: string[];
}

export interface ActivityStats {
    totalActivities: number;
    totalParticipations: number;
    averageParticipationRate: number;
    mostPopularActivity?: string;
    leastPopularActivity?: string;
    topActivities: { name: string; participationCount: number }[];
    weeklyTrend: { week: string; count: number }[];
}

export interface SociometricData {
    groupLeaders: GroupLeader[];
    isolatedStudents: IsolatedStudent[];
    friendGroups: FriendGroup[];
    activityStats: ActivityStats;
    students: any[];
    classroomInfo: {
        name: string;
        totalStudents: number;
        tutorName: string;
    };
}
