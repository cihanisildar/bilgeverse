'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getWeeklyReports,
    getWeeklyReportById,
    updateWeeklyReport,
    deleteWeeklyReport,
    getActivePeriod,
} from '@/app/actions/weekly-reports';
import toast from 'react-hot-toast';

// Query: Get all weekly reports
export function useWeeklyReports() {
    return useQuery({
        queryKey: ['weekly-reports'],
        queryFn: async () => {
            const result = await getWeeklyReports();
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
    });
}

// Query: Get single weekly report by ID
export function useWeeklyReport(id: string) {
    return useQuery({
        queryKey: ['weekly-reports', id],
        queryFn: async () => {
            const result = await getWeeklyReportById(id);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
        enabled: !!id,
        refetchOnMount: true,
    });
}

// Query: Get active period
export function useActivePeriod() {
    return useQuery({
        queryKey: ['active-period'],
        queryFn: async () => {
            const result = await getActivePeriod();
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
    });
}

// Mutation: Update weekly report
export function useUpdateWeeklyReport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            updateWeeklyReport(id, data),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['weekly-reports'] });
                queryClient.invalidateQueries({ queryKey: ['weekly-reports', variables.id] });
                toast.success('Rapor başarıyla güncellendi');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Rapor güncellenirken bir hata oluştu');
        },
    });
}

// Mutation: Delete weekly report
export function useDeleteWeeklyReport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const plainId = String(id);
            return deleteWeeklyReport(plainId);
        },
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['weekly-reports'] });
                toast.success('Rapor başarıyla silindi');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Rapor silinirken bir hata oluştu');
        },
    });
}
