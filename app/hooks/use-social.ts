'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getSocialPosts, createSocialPost, updateSocialPost, deleteSocialPost,
    getSocialIngredients, createSocialIngredient, updateSocialIngredient, deleteSocialIngredient
} from '@/app/actions/social';
import { SocialPost, ContentIngredient } from '@/types/social';
import { PostStatus, SocialPlatform } from '@prisma/client';
import toast from 'react-hot-toast';

// --- Social Posts ---

export function useSocialPosts(filters?: { platform?: SocialPlatform; status?: PostStatus }) {
    return useQuery({
        queryKey: ['social-posts', filters],
        queryFn: async () => {
            const result = await getSocialPosts(filters);
            if (result.error) throw new Error(result.error);
            return result.data || [];
        },
    });
}

export function useCreateSocialPost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<SocialPost>) => createSocialPost(data),
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.message || 'Gönderi oluşturuldu');
                queryClient.invalidateQueries({ queryKey: ['social-posts'] });
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Bir hata oluştu');
        }
    });
}

export function useUpdateSocialPost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<SocialPost> }) => updateSocialPost(id, data),
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.message || 'Gönderi güncellendi');
                queryClient.invalidateQueries({ queryKey: ['social-posts'] });
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Bir hata oluştu');
        }
    });
}

export function useDeleteSocialPost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteSocialPost(id),
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.message || 'Gönderi silindi');
                queryClient.invalidateQueries({ queryKey: ['social-posts'] });
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Bir hata oluştu');
        }
    });
}

// --- Ingredients ---

export function useSocialIngredients() {
    return useQuery({
        queryKey: ['social-ingredients'],
        queryFn: async () => {
            const result = await getSocialIngredients();
            if (result.error) throw new Error(result.error);
            return result.data || [];
        },
    });
}

export function useCreateSocialIngredient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<ContentIngredient>) => createSocialIngredient(data),
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.message || 'Bileşen oluşturuldu');
                queryClient.invalidateQueries({ queryKey: ['social-ingredients'] });
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Bir hata oluştu');
        }
    });
}

export function useUpdateSocialIngredient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ContentIngredient> }) => updateSocialIngredient(id, data),
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.message || 'Bileşen güncellendi');
                queryClient.invalidateQueries({ queryKey: ['social-ingredients'] });
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Bir hata oluştu');
        }
    });
}

export function useDeleteSocialIngredient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteSocialIngredient(id),
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.message || 'Bileşen silindi');
                queryClient.invalidateQueries({ queryKey: ['social-ingredients'] });
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Bir hata oluştu');
        }
    });
}
