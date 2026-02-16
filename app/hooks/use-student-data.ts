'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getOrientationStudents,
    getExpulsionRecords,
    getStudentDetail,
    getTutors,
    createStudentManual,
    updateOrientationNotes,
    finalizeOrientation,
    expelStudent
} from '@/app/actions/student-actions';
import { toast } from 'react-hot-toast';
import { User, OrientationProcess } from '@prisma/client';

export type StudentWithOrientation = User & {
    orientationProcess: OrientationProcess | null;
    tutor: {
        firstName: string | null;
        lastName: string | null;
        username: string;
    } | null;
};

export type ExpulsionRecordWithResponsible = {
    id: string;
    studentName: string;
    studentSurname: string;
    username: string | null;
    email: string | null;
    phone: string | null;
    expulsionDate: Date;
    reason: string;
    notes: string | null;
    responsible: {
        firstName: string | null;
        lastName: string | null;
        username: string;
    } | null;
};

// --- Query Hooks ---

export function useOrientationStudents() {
    return useQuery({
        queryKey: ['orientation-students'],
        queryFn: async () => {
            const result = await getOrientationStudents();
            if (result.error) throw new Error(result.error);
            return (result.data as StudentWithOrientation[]) || [];
        }
    });
}

export function useExpulsionRecords() {
    return useQuery({
        queryKey: ['expulsion-records'],
        queryFn: async () => {
            const result = await getExpulsionRecords();
            if (result.error) throw new Error(result.error);
            return (result.data as ExpulsionRecordWithResponsible[]) || [];
        }
    });
}

export function useStudentDetail(id: string) {
    return useQuery({
        queryKey: ['student-detail', id],
        queryFn: async () => {
            const result = await getStudentDetail(id);
            if (result.error) throw new Error(result.error);
            return result.data as StudentWithOrientation;
        },
        enabled: !!id
    });
}

export function useTutors() {
    return useQuery({
        queryKey: ['tutors'],
        queryFn: async () => {
            const result = await getTutors();
            if (result.error) throw new Error(result.error);
            return result.data || [];
        }
    });
}

// --- Mutation Hooks ---

export function useCreateStudentManual() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => createStudentManual({ ...data }),
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['orientation-students'] });
                toast.success('Öğrenci başarıyla eklendi');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Öğrenci eklenirken bir hata oluştu');
        }
    });
}

export function useUpdateOrientationNotes() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (variables: { studentId: string; week: 1 | 2 | 3; notes: string }) =>
            updateOrientationNotes(variables.studentId, variables.week, variables.notes),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['student-detail', variables.studentId] });
                queryClient.invalidateQueries({ queryKey: ['orientation-students'] });
                toast.success(`Hafta ${variables.week} notları kaydedildi`);
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Not kaydedilirken bir hata oluştu');
        }
    });
}

export function useFinalizeOrientation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (variables: { studentId: string; decision: any; notes: string; adminId: string }) =>
            finalizeOrientation(variables.studentId, variables.decision, variables.notes, variables.adminId),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['orientation-students'] });
                queryClient.invalidateQueries({ queryKey: ['student-detail', variables.studentId] });
                toast.success('Oryantasyon süreci sonuçlandırıldı');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'İşlem sırasında bir hata oluştu');
        }
    });
}

export function useExpelStudent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (variables: { studentId: string; reason: string; adminId: string; notes?: string }) =>
            expelStudent(variables.studentId, variables.reason, variables.adminId, variables.notes),
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['expulsion-records'] });
                queryClient.invalidateQueries({ queryKey: ['orientation-students'] });
                toast.success('İhraç kaydı oluşturuldu');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'İhraç kaydı oluşturulurken hata oluştu');
        }
    });
}
