'use client';

import { useQuery } from '@tanstack/react-query';
import {
    getWeeklyParticipationReport,
    getSyllabusTrackingReport,
    getAttendanceAlertsReport,
    getEventsOverviewReport,
} from '@/app/actions/reports';
import {
    WeeklyParticipationReport,
    SyllabusTrackingReport,
    AttendanceAlertsReport,
    EventsOverviewReport
} from '@/types/reports';

export function useWeeklyParticipation() {
    return useQuery<WeeklyParticipationReport | null>({
        queryKey: ['reports', 'weekly-participation'],
        queryFn: async () => {
            const result = await getWeeklyParticipationReport();
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
    });
}

export function useSyllabusTracking() {
    return useQuery<SyllabusTrackingReport | null>({
        queryKey: ['reports', 'syllabus-tracking'],
        queryFn: async () => {
            const result = await getSyllabusTrackingReport();
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
    });
}

export function useAttendanceAlerts() {
    return useQuery<AttendanceAlertsReport | null>({
        queryKey: ['reports', 'attendance-alerts'],
        queryFn: async () => {
            const result = await getAttendanceAlertsReport();
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
    });
}

export function useEventsOverview() {
    return useQuery<EventsOverviewReport | null>({
        queryKey: ['reports', 'events-overview'],
        queryFn: async () => {
            const result = await getEventsOverviewReport();
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
    });
}
