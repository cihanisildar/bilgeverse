'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getTutorPromotions,
    getTutorPromotionById,
    getEligibleUsers,
    createTutorPromotion,
    updateTutorPromotion,
    CreateTutorPromotionInput,
    UpdateTutorPromotionInput,
} from '@/app/actions/tutor-promotions';
import { useToast } from '@/hooks/use-toast';

import { TutorPromotion, EligibleUser } from '@/app/types/tutor-promotions';

export function useTutorPromotions() {
    return useQuery<TutorPromotion[]>({
        queryKey: ['tutor-promotions'],
        queryFn: async () => {
            const result = await getTutorPromotions();
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data as TutorPromotion[];
        },
    });
}

export function useTutorPromotion(id: string) {
    return useQuery<TutorPromotion>({
        queryKey: ['tutor-promotions', id],
        queryFn: async () => {
            const result = await getTutorPromotionById(id);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data as TutorPromotion;
        },
        enabled: !!id,
    });
}

export function useEligibleUsers() {
    return useQuery<EligibleUser[]>({
        queryKey: ['eligible-users'],
        queryFn: async () => {
            const result = await getEligibleUsers();
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data as EligibleUser[];
        },
    });
}

export function useCreatePromotion() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: CreateTutorPromotionInput) => {
            return createTutorPromotion(data);
        },
        onSuccess: (result) => {
            if (result.error) {
                toast({
                    title: 'Hata',
                    description: result.error,
                    variant: 'destructive',
                });
            } else {
                queryClient.invalidateQueries({ queryKey: ['tutor-promotions'] });
                toast({
                    title: 'Başarılı',
                    description: 'Terfi talebi oluşturuldu',
                });
            }
        },
        onError: (error: Error) => {
            toast({
                title: 'Hata',
                description: error.message || 'Terfi talebi oluşturulurken bir hata oluştu',
                variant: 'destructive',
            });
        },
    });
}

export function useUpdatePromotion() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateTutorPromotionInput }) =>
            updateTutorPromotion(id, data),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast({
                    title: 'Hata',
                    description: result.error,
                    variant: 'destructive',
                });
            } else {
                queryClient.invalidateQueries({ queryKey: ['tutor-promotions'] });
                queryClient.invalidateQueries({ queryKey: ['tutor-promotions', variables.id] });
                toast({
                    title: 'Başarılı',
                    description: 'Terfi talebi güncellendi',
                });
            }
        },
        onError: (error: Error) => {
            toast({
                title: 'Hata',
                description: error.message || 'Terfi talebi güncellenirken bir hata oluştu',
                variant: 'destructive',
            });
        },
    });
}
