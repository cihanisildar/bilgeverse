'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getPart2Events,
    getPart2Event,
    createPart2Event,
    updatePart2Event,
    deletePart2Event,
    generateQRCodeForPart2Event,
    registerForPart2Event,
    checkInToPart2Event,
    getPart2EventTypes,
    createPart2EventType,
    updatePart2EventType,
    deletePart2EventType,
} from '@/app/actions/events';
import toast from 'react-hot-toast';

export function usePart2Events(filters?: any) {
    return useQuery({
        queryKey: ['part2Events', filters],
        queryFn: async () => {
            const result = await getPart2Events(filters);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
    });
}

export function usePart2Event(eventId: string) {
    return useQuery({
        queryKey: ['part2Events', eventId],
        queryFn: async () => {
            const result = await getPart2Event(eventId);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
        enabled: !!eventId,
    });
}

export function useCreatePart2Event() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createPart2Event,
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['part2Events'] });
                queryClient.invalidateQueries({ queryKey: ['part2EventTypes'] });
                toast.success('Etkinlik başarıyla oluşturuldu');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Etkinlik oluşturulurken bir hata oluştu');
        },
    });
}

export function useUpdatePart2Event() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ eventId, data }: { eventId: string; data: any }) =>
            updatePart2Event(eventId, data),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['part2Events'] });
                queryClient.invalidateQueries({ queryKey: ['part2Events', variables.eventId] });
                toast.success('Etkinlik başarıyla güncellendi');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Etkinlik güncellenirken bir hata oluştu');
        },
    });
}

export function useDeletePart2Event() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deletePart2Event,
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['part2Events'] });
                toast.success('Etkinlik başarıyla silindi');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Etkinlik silinirken bir hata oluştu');
        },
    });
}

export function useGeneratePart2EventQR() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: generateQRCodeForPart2Event,
        onSuccess: (result, eventId) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['part2Events'] });
                queryClient.invalidateQueries({ queryKey: ['part2Events', eventId] });
                toast.success('QR kod başarıyla oluşturuldu');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'QR kod oluşturulurken bir hata oluştu');
        },
    });
}

export function useRegisterForPart2Event() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: registerForPart2Event,
        onSuccess: (result, eventId) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['part2Events'] });
                queryClient.invalidateQueries({ queryKey: ['part2Events', eventId] });
                toast.success('Etkinliğe başarıyla kayıt oldunuz');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Kayıt olurken bir hata oluştu');
        },
    });
}

export function useCheckInToPart2Event() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ eventId, qrToken }: { eventId: string; qrToken?: string }) =>
            checkInToPart2Event(eventId, qrToken),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['part2Events'] });
                queryClient.invalidateQueries({ queryKey: ['part2Events', variables.eventId] });
                toast.success('Başarıyla giriş yapıldı');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Giriş yapılırken bir hata oluştu');
        },
    });
}

export function usePart2EventTypes() {
    return useQuery({
        queryKey: ['part2EventTypes'],
        queryFn: async () => {
            const result = await getPart2EventTypes();
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
    });
}

export function useCreatePart2EventType() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createPart2EventType,
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['part2EventTypes'] });
                toast.success('Etkinlik türü başarıyla oluşturuldu');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Etkinlik türü oluşturulurken bir hata oluştu');
        },
    });
}

export function useUpdatePart2EventType() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ eventTypeId, data }: { eventTypeId: string; data: any }) =>
            updatePart2EventType(eventTypeId, data),
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['part2EventTypes'] });
                toast.success('Etkinlik türü başarıyla güncellendi');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Etkinlik türü güncellenirken bir hata oluştu');
        },
    });
}

export function useDeletePart2EventType() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deletePart2EventType,
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['part2EventTypes'] });
                toast.success('Etkinlik türü başarıyla silindi');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Etkinlik türü silinirken bir hata oluştu');
        },
    });
}
