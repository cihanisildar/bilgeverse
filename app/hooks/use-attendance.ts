'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMeetingAttendance,
  checkInWithQR,
  manualCheckIn,
  removeAttendance,
  markAttendance,
} from '@/app/actions/meetings/attendance';
import toast from 'react-hot-toast';

export function useMeetingAttendance(meetingId: string) {
  return useQuery({
    queryKey: ['meetings', meetingId, 'attendance'],
    queryFn: async () => {
      const result = await getMeetingAttendance(meetingId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!meetingId,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId }: { meetingId: string }) => {
      return checkInWithQR(meetingId);
    },
    onSuccess: (result, variables) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['meetings', variables.meetingId, 'attendance'] });
        queryClient.invalidateQueries({ queryKey: ['meetings', variables.meetingId] });
        toast.success('Başarıyla giriş yapıldı');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Giriş yapılırken bir hata oluştu');
    },
  });
}

export function useManualCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, userId }: { meetingId: string; userId: string }) =>
      manualCheckIn(meetingId, userId),
    onSuccess: (result, variables) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['meetings', variables.meetingId, 'attendance'] });
        queryClient.invalidateQueries({ queryKey: ['meetings', variables.meetingId] });
        toast.success('Manuel giriş başarıyla yapıldı');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Manuel giriş yapılırken bir hata oluştu');
    },
  });
}

export function useRemoveAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeAttendance,
    onSuccess: (result, attendanceId) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        // Invalidate all attendance queries
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
        toast.success('Katılım kaydı başarıyla silindi');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Katılım kaydı silinirken bir hata oluştu');
    },
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attendanceId, attended }: { attendanceId: string; attended: boolean }) =>
      markAttendance(attendanceId, attended),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
        toast.success('Katılım durumu güncellendi');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Katılım durumu güncellenirken bir hata oluştu');
    },
  });
}

