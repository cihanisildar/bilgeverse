'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMeetings,
  getMeetingById,
  getUserMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  generateQRCode,
} from '@/app/actions/meetings';
import toast from 'react-hot-toast';

export function useMeetings() {
  return useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const result = await getMeetings();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: ['meetings', id],
    queryFn: async () => {
      const result = await getMeetingById(id);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!id,
    refetchOnMount: true,
  });
}

export function useUserMeetings() {
  return useQuery({
    queryKey: ['user-meetings'],
    queryFn: async () => {
      const result = await getUserMeetings();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: unknown) => {
      // Ensure data is a plain object before passing to server action
      const plainData = typeof data === 'object' && data !== null
        ? {
            title: String((data as any).title || ''),
            description: (data as any).description ? String((data as any).description) : undefined,
            meetingDate: String((data as any).meetingDate || ''),
            location: String((data as any).location || ''),
          }
        : data;
      return createMeeting(plainData);
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
        toast.success('Toplantı başarıyla oluşturuldu');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Toplantı oluşturulurken bir hata oluştu');
    },
  });
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      updateMeeting(id, data),
    onSuccess: (result, variables) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
        queryClient.invalidateQueries({ queryKey: ['meetings', variables.id] });
        toast.success('Toplantı başarıyla güncellendi');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Toplantı güncellenirken bir hata oluştu');
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Ensure we pass a plain string to the server action
      const plainId = String(id);
      return deleteMeeting(plainId);
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
        toast.success('Toplantı başarıyla silindi');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Toplantı silinirken bir hata oluştu');
    },
  });
}

export function useGenerateQRCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meetingId: string) => {
      // Ensure meetingId is a plain string
      const plainMeetingId = String(meetingId);
      const result = await generateQRCode(plainMeetingId);
      
      // Ensure result is serializable
      if (result.data) {
        return {
          error: result.error,
          data: {
            token: String(result.data.token || ''),
            expiresAt: result.data.expiresAt ? String(result.data.expiresAt) : null,
          },
        };
      }
      
      return result;
    },
    onSuccess: (result, meetingId) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['meetings', meetingId] });
        queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
        toast.success('QR kod başarıyla oluşturuldu');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'QR kod oluşturulurken bir hata oluştu');
    },
  });
}

