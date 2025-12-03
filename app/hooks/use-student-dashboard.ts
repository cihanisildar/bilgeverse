'use client';

import { useQuery } from '@tanstack/react-query';

export interface Student {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    points: number;
    rank: number;
    experience: number;
}

export interface LeaderboardResponse {
    leaderboard: Student[];
}

export interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    createdBy: {
        username: string;
        firstName?: string;
        lastName?: string;
    };
}

export interface EventsResponse {
    events: Event[];
}

export interface PointTransaction {
    id: string;
    points: number;
    type: 'AWARD' | 'PENALTY';
    reason: string;
    createdAt: string;
}

export interface PointsResponse {
    transactions: PointTransaction[];
    totalPoints: number;
}

export interface Request {
    id: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    // Add other fields as needed
}

export interface RequestsResponse {
    requests: Request[];
}

async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch ${url}`);
    }
    return res.json();
}

export function useLeaderboard() {
    return useQuery({
        queryKey: ['leaderboard'],
        queryFn: () => fetchJson<LeaderboardResponse>('/api/leaderboard'),
    });
}

export function useEvents() {
    return useQuery({
        queryKey: ['events'],
        queryFn: () => fetchJson<EventsResponse>('/api/events'),
    });
}

export function usePoints() {
    return useQuery({
        queryKey: ['points'],
        queryFn: () => fetchJson<PointsResponse>('/api/points'),
    });
}

export function useRequests() {
    return useQuery({
        queryKey: ['requests'],
        queryFn: () => fetchJson<RequestsResponse>('/api/requests'),
    });
}

export interface UserResponse {
    user: Student;
}

export function useCurrentUser() {
    return useQuery({
        queryKey: ['current-user'],
        queryFn: () => fetchJson<UserResponse>('/api/auth/me'),
    });
}
