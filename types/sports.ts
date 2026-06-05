/**
 * Shared types for the Bilge Spor Kulübü (part9) module.
 * Model rows are inferred from server-action return values; the interfaces
 * here cover the on-the-fly aggregates (season stats, report) that have no
 * direct Prisma model.
 */

export interface SportUserLite {
    id?: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
}

// #13 Sezon istatistikleri
export interface SeasonTeamStats {
    played: number;
    wins: number;
    losses: number;
    draws: number;
    pending: number;
    goalsFor: number;
    goalsAgainst: number;
}

export interface SeasonAthleteStat {
    athleteId: string;
    name: string;
    appearances: number;
    goals: number;
    assists: number;
}

export interface SeasonStats {
    team: SeasonTeamStats;
    athletes: SeasonAthleteStat[];
}

// #6 Katılım özeti
export interface AttendanceOverviewRow {
    athleteId: string;
    name: string;
    branches: { id: string; name: string }[];
    total: number;
    present: number;
    absent: number;
    excused: number;
    attendanceRate: number;
    absenceRate: number;
}

// #22 Faaliyet raporu
export interface SportReport {
    period: { year: number; month?: number; start: Date; end: Date };
    athletes: {
        total: number;
        byStatus: Record<string, number>;
        byBranch: { name: string; count: number }[];
    };
    attendance: { totalRecords: number; present: number; avgAttendance: number };
    matches: {
        total: number;
        wins: number;
        losses: number;
        draws: number;
        list: { opponent: string; date: Date; score: string; result: string; achievement: string | null }[];
    };
    dues: { billed: number; collected: number; pending: number; pendingCount: number; overdueCount: number };
    finance: { income: number; expense: number; balance: number };
}

// Genel bakış
export interface SportsOverviewData {
    totalAthletes: number;
    activeAthletes: number;
    passiveAthletes: number;
    branchCount: number;
    upcomingTrainings: number;
    upcomingMatches: number;
    expiringLicenses: number;
    expiringHealth: number;
    duesOutstanding: number;
    newFeedback: number;
    recentAnnouncements: {
        id: string;
        title: string;
        type: string;
        createdAt: Date | string;
        branch: { name: string } | null;
    }[];
}
