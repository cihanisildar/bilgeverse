'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAttendanceSessions,
  getAttendanceSession,
  createAttendanceSession,
  updateAttendanceSession,
  deleteAttendanceSession,
  generateQRCodeForSession,
  checkInToSession,
  manualCheckInToSession,
} from '@/app/actions/attendance-sessions';
import { checkAndNotifyAbsentStudents } from '@/app/actions/notifications';
import toast from 'react-hot-toast';

export function useAttendanceSessions() {
  return useQuery({
    queryKey: ['attendanceSessions'],
    queryFn: async () => {
      const result = await getAttendanceSessions();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
}

export function useAttendanceSession(sessionId: string) {
  return useQuery({
    queryKey: ['attendanceSessions', sessionId],
    queryFn: async () => {
      const result = await getAttendanceSession(sessionId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!sessionId,
  });
}

export function useCreateAttendanceSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAttendanceSession,
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['attendanceSessions'] });
        toast.success('Oturum başarıyla oluşturuldu');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Oturum oluşturulurken bir hata oluştu');
    },
  });
}

export function useUpdateAttendanceSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: any }) =>
      updateAttendanceSession(sessionId, data),
    onSuccess: (result, variables) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['attendanceSessions'] });
        queryClient.invalidateQueries({ queryKey: ['attendanceSessions', variables.sessionId] });
        toast.success('Oturum başarıyla güncellendi');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Oturum güncellenirken bir hata oluştu');
    },
  });
}

export function useDeleteAttendanceSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAttendanceSession,
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['attendanceSessions'] });
        toast.success('Oturum başarıyla silindi');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Oturum silinirken bir hata oluştu');
    },
  });
}

export function useGenerateQRCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateQRCodeForSession,
    onSuccess: (result, sessionId) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['attendanceSessions'] });
        queryClient.invalidateQueries({ queryKey: ['attendanceSessions', sessionId] });
        toast.success('QR kod başarıyla oluşturuldu');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'QR kod oluşturulurken bir hata oluştu');
    },
  });
}

export function useCheckInToSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkInToSession,
    onSuccess: (result, sessionId) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['attendanceSessions'] });
        queryClient.invalidateQueries({ queryKey: ['attendanceSessions', sessionId] });
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
    mutationFn: ({ sessionId, studentId, notes }: { sessionId: string; studentId: string; notes?: string }) =>
      manualCheckInToSession(sessionId, studentId, notes),
    onSuccess: (result, variables) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['attendanceSessions'] });
        queryClient.invalidateQueries({ queryKey: ['attendanceSessions', variables.sessionId] });
        toast.success('Manuel giriş başarıyla yapıldı');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Manuel giriş yapılırken bir hata oluştu');
    },
  });
}

export function useCheckAbsentStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkAndNotifyAbsentStudents,
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        if (result.data && result.data.notificationsCreated > 0) {
          toast.success(`${result.data.notificationsCreated} devamsız öğrenci için bildirim gönderildi`);
        } else {
          toast.success('Devamsız öğrenci bulunamadı');
        }
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Devamsızlık kontrolü yapılırken bir hata oluştu');
    },
  });
}
