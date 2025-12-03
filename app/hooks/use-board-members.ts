'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getBoardMembers,
    getBoardMemberById,
    createBoardMember,
    updateBoardMember,
    deleteBoardMember,
    toggleBoardMemberStatus,
    getAllUsers,
} from '@/app/actions/board-members';
import toast from 'react-hot-toast';

export type BoardMemberWithStats = {
    id: string;
    userId: string;
    title: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        username: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        phone: string | null;
    };
    stats?: {
        attendedMeetings: number;
        totalMeetings: number;
        attendanceRate: number;
    };
};

export function useBoardMembers() {
    return useQuery<BoardMemberWithStats[]>({
        queryKey: ['board-members'],
        queryFn: async () => {
            const result = await getBoardMembers();
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data as BoardMemberWithStats[];
        },
    });
}

export function useBoardMember(id: string) {
    return useQuery({
        queryKey: ['board-members', id],
        queryFn: async () => {
            const result = await getBoardMemberById(id);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
        enabled: !!id,
    });
}

export interface CreateBoardMemberInput {
    userId: string;
    title: string;
}

export function useCreateBoardMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateBoardMemberInput) => {
            return createBoardMember(data);
        },
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['board-members'] });
                toast.success('Yönetim kurulu üyesi başarıyla oluşturuldu');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Yönetim kurulu üyesi oluşturulurken bir hata oluştu');
        },
    });
}

export function useUpdateBoardMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateBoardMemberInput> }) =>
            updateBoardMember(id, data),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['board-members'] });
                queryClient.invalidateQueries({ queryKey: ['board-members', variables.id] });
                toast.success('Yönetim kurulu üyesi başarıyla güncellendi');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Yönetim kurulu üyesi güncellenirken bir hata oluştu');
        },
    });
}

export function useDeleteBoardMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const plainId = String(id);
            return deleteBoardMember(plainId);
        },
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['board-members'] });
                toast.success('Yönetim kurulu üyesi başarıyla silindi');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Yönetim kurulu üyesi silinirken bir hata oluştu');
        },
    });
}

export function useToggleBoardMemberStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const plainId = String(id);
            return toggleBoardMemberStatus(plainId);
        },
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['board-members'] });
                toast.success('Üye durumu başarıyla değiştirildi');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Üye durumu değiştirilirken bir hata oluştu');
        },
    });
}

export function useAllUsers() {
    return useQuery({
        queryKey: ['all-users'],
        queryFn: async () => {
            const result = await getAllUsers();
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
    });
}
