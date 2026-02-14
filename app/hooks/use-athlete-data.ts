'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getSportBranches,
    upsertSportBranch,
    deleteSportBranch,
    getAthletes,
    upsertAthleteProfile,
    deleteAthleteProfile,
    getTrainings,
    createTraining,
    getTrainingDetails,
    recordAttendance,
    recordPerformance,
    registerNewAthlete
} from '@/app/actions/athlete-actions';
import { toast } from 'react-hot-toast';

// --- Branch Hooks ---

export function useSportBranches() {
    return useQuery({
        queryKey: ['sport-branches'],
        queryFn: async () => {
            const result = await getSportBranches();
            if (result.error) throw new Error(result.error);
            return result.data || [];
        }
    });
}

export function useUpsertSportBranch() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: upsertSportBranch,
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['sport-branches'] });
                toast.success('Grup başarıyla kaydedildi');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Grup kaydedilirken bir hata oluştu');
        }
    });
}

export function useDeleteSportBranch() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteSportBranch,
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['sport-branches'] });
                toast.success('Grup başarıyla silindi');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Grup silinirken bir hata oluştu');
        }
    });
}

// --- Athlete Hooks ---

export function useAthletes(branchId?: string) {
    return useQuery({
        queryKey: ['athletes', branchId],
        queryFn: async () => {
            const result = await getAthletes(branchId);
            if (result.error) throw new Error(result.error);
            return result.data || [];
        }
    });
}

export function useUpsertAthleteProfile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: upsertAthleteProfile,
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['athletes'] });
                queryClient.invalidateQueries({ queryKey: ['sport-branches'] }); // Count might change
                toast.success('Sporcu başarıyla güncellendi');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Sporcu güncellenirken bir hata oluştu');
        }
    });
}

export function useRegisterNewAthlete() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: registerNewAthlete,
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['athletes'] });
                queryClient.invalidateQueries({ queryKey: ['sport-branches'] });
                toast.success('Yeni sporcu başarıyla kaydedildi');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Sporcu kaydedilirken bir hata oluştu');
        }
    });
}

export function useDeleteAthleteProfile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteAthleteProfile,
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['athletes'] });
                queryClient.invalidateQueries({ queryKey: ['sport-branches'] });
                toast.success('Sporcu başarıyla silindi');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Sporcu silinirken bir hata oluştu');
        }
    });
}

// --- Training Hooks ---

export function useTrainings(params: { branchId?: string; startDate?: Date; endDate?: Date }) {
    return useQuery({
        queryKey: ['trainings', params],
        queryFn: async () => {
            const result = await getTrainings(params);
            if (result.error) throw new Error(result.error);
            return result.data || [];
        }
    });
}

export function useTrainingDetails(trainingId: string) {
    return useQuery({
        queryKey: ['training-details', trainingId],
        queryFn: async () => {
            const result = await getTrainingDetails(trainingId);
            if (result.error) throw new Error(result.error);
            return result.data;
        },
        enabled: !!trainingId
    });
}

export function useCreateTraining() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createTraining,
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['trainings'] });
                toast.success('Antrenman/Maç başarıyla planlandı');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Antrenman planlanırken bir hata oluştu');
        }
    });
}

// --- Attendance & Performance Hooks ---

export function useRecordAttendance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params: { trainingId: string; attendances: any[] }) =>
            recordAttendance(params.trainingId, params.attendances),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['training-details', variables.trainingId] });
                toast.success('Yoklama kaydedildi');
            }
        }
    });
}

export function useRecordPerformance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params: { trainingId: string; performances: any[] }) =>
            recordPerformance(params.trainingId, params.performances),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['training-details', variables.trainingId] });
                toast.success('Performans verileri kaydedildi');
            }
        }
    });
}
