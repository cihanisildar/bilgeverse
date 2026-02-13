'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/app/lib/api-client';

import { Student, PaginationInfo } from "@/types/student";

export interface StudentsResponse extends PaginationInfo {
    students: Student[];
}

export function useTutorStudents() {
    return useQuery({
        queryKey: ['tutor', 'students'],
        queryFn: () => api.get<StudentsResponse>('/api/tutor/students'),
    });
}
