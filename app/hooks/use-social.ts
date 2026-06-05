'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getSocialPosts, createSocialPost, updateSocialPost, deleteSocialPost,
    getSocialIngredients, createSocialIngredient, updateSocialIngredient, deleteSocialIngredient,
    getContentIdeas, createContentIdea, updateContentIdea, deleteContentIdea, convertIdeaToPost,
    getSocialEvents, createSocialEvent, updateSocialEvent, deleteSocialEvent,
    getUpcomingReminders, getSocialReport
} from '@/app/actions/social';
import { SocialPost, ContentIngredient, ContentIdea, SocialEvent } from '@/types/social';
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

// --- Content Ideas ---

export function useContentIdeas() {
    return useQuery({
        queryKey: ['content-ideas'],
        queryFn: async () => {
            const result = await getContentIdeas();
            if (result.error) throw new Error(result.error);
            return result.data || [];
        },
    });
}

export function useCreateIdea() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<ContentIdea>) => createContentIdea(data),
        onSuccess: (result) => {
            if (result.error) { toast.error(result.error); }
            else {
                toast.success(result.message || 'Fikir eklendi');
                queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
            }
        },
        onError: (error: any) => toast.error(error.message || 'Bir hata oluştu'),
    });
}

export function useUpdateIdea() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ContentIdea> }) => updateContentIdea(id, data),
        onSuccess: (result) => {
            if (result.error) { toast.error(result.error); }
            else {
                toast.success(result.message || 'Fikir güncellendi');
                queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
            }
        },
        onError: (error: any) => toast.error(error.message || 'Bir hata oluştu'),
    });
}

export function useDeleteIdea() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteContentIdea(id),
        onSuccess: (result) => {
            if (result.error) { toast.error(result.error); }
            else {
                toast.success(result.message || 'Fikir silindi');
                queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
            }
        },
        onError: (error: any) => toast.error(error.message || 'Bir hata oluştu'),
    });
}

export function useConvertIdeaToPost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => convertIdeaToPost(id),
        onSuccess: (result) => {
            if (result.error) { toast.error(result.error); }
            else {
                toast.success(result.message || 'Gönderiye dönüştürüldü');
                queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
                queryClient.invalidateQueries({ queryKey: ['social-posts'] });
            }
        },
        onError: (error: any) => toast.error(error.message || 'Bir hata oluştu'),
    });
}

// --- Social Events ---

export function useSocialEvents() {
    return useQuery({
        queryKey: ['social-events'],
        queryFn: async () => {
            const result = await getSocialEvents();
            if (result.error) throw new Error(result.error);
            return result.data || [];
        },
    });
}

export function useCreateEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<SocialEvent>) => createSocialEvent(data),
        onSuccess: (result) => {
            if (result.error) { toast.error(result.error); }
            else {
                toast.success(result.message || 'Etkinlik eklendi');
                queryClient.invalidateQueries({ queryKey: ['social-events'] });
                queryClient.invalidateQueries({ queryKey: ['upcoming-reminders'] });
            }
        },
        onError: (error: any) => toast.error(error.message || 'Bir hata oluştu'),
    });
}

export function useUpdateEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<SocialEvent> }) => updateSocialEvent(id, data),
        onSuccess: (result) => {
            if (result.error) { toast.error(result.error); }
            else {
                toast.success(result.message || 'Etkinlik güncellendi');
                queryClient.invalidateQueries({ queryKey: ['social-events'] });
                queryClient.invalidateQueries({ queryKey: ['upcoming-reminders'] });
            }
        },
        onError: (error: any) => toast.error(error.message || 'Bir hata oluştu'),
    });
}

export function useDeleteEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteSocialEvent(id),
        onSuccess: (result) => {
            if (result.error) { toast.error(result.error); }
            else {
                toast.success(result.message || 'Etkinlik silindi');
                queryClient.invalidateQueries({ queryKey: ['social-events'] });
                queryClient.invalidateQueries({ queryKey: ['upcoming-reminders'] });
            }
        },
        onError: (error: any) => toast.error(error.message || 'Bir hata oluştu'),
    });
}

// --- Reminders & Reports ---

export function useUpcomingReminders(days: number = 30) {
    return useQuery({
        queryKey: ['upcoming-reminders', days],
        queryFn: async () => {
            const result = await getUpcomingReminders(days);
            if (result.error) throw new Error(result.error);
            return result.data || [];
        },
    });
}

export function useSocialReport(year: number, month: number) {
    return useQuery({
        queryKey: ['social-report', year, month],
        queryFn: async () => {
            const result = await getSocialReport(year, month);
            if (result.error) throw new Error(result.error);
            return result.data || null;
        },
    });
}
