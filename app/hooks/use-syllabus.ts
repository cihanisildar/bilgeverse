'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSyllabi,
  getSyllabus,
  getSyllabusByShareToken,
  createSyllabus,
  updateSyllabus,
  deleteSyllabus,
  generateShareTokenForSyllabus,
  updateSyllabusLesson,
  addLessonToSyllabus,
  deleteSyllabusLesson,
  submitParentFeedback,
} from '@/app/actions/syllabus';
import toast from 'react-hot-toast';

export function useSyllabi() {
  return useQuery({
    queryKey: ['syllabi'],
    queryFn: async () => {
      const result = await getSyllabi();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
}

export function useSyllabus(syllabusId: string) {
  return useQuery({
    queryKey: ['syllabi', syllabusId],
    queryFn: async () => {
      const result = await getSyllabus(syllabusId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!syllabusId,
  });
}

export function useSyllabusByShareToken(shareToken: string) {
  return useQuery({
    queryKey: ['syllabi', 'share', shareToken],
    queryFn: async () => {
      const result = await getSyllabusByShareToken(shareToken);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!shareToken,
  });
}

export function useCreateSyllabus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSyllabus,
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['syllabi'] });
        toast.success('Müfredat başarıyla oluşturuldu');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Müfredat oluşturulurken bir hata oluştu');
    },
  });
}

export function useUpdateSyllabus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ syllabusId, data }: { syllabusId: string; data: any }) =>
      updateSyllabus(syllabusId, data),
    onSuccess: (result, variables) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['syllabi'] });
        queryClient.invalidateQueries({ queryKey: ['syllabi', variables.syllabusId] });
        toast.success('Müfredat başarıyla güncellendi');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Müfredat güncellenirken bir hata oluştu');
    },
  });
}

export function useDeleteSyllabus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSyllabus,
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['syllabi'] });
        toast.success('Müfredat başarıyla silindi');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Müfredat silinirken bir hata oluştu');
    },
  });
}

export function useGenerateShareToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateShareTokenForSyllabus,
    onSuccess: (result, syllabusId) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['syllabi'] });
        queryClient.invalidateQueries({ queryKey: ['syllabi', syllabusId] });
        toast.success('Paylaşım bağlantısı oluşturuldu');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Paylaşım bağlantısı oluşturulurken bir hata oluştu');
    },
  });
}

export function useUpdateSyllabusLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: any }) =>
      updateSyllabusLesson(lessonId, data),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['syllabi'] });
        toast.success('Ders başarıyla güncellendi');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ders güncellenirken bir hata oluştu');
    },
  });
}

export function useAddLessonToSyllabus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ syllabusId, data }: { syllabusId: string; data: any }) =>
      addLessonToSyllabus(syllabusId, data),
    onSuccess: (result, variables) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['syllabi'] });
        queryClient.invalidateQueries({ queryKey: ['syllabi', variables.syllabusId] });
        toast.success('Ders başarıyla eklendi');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ders eklenirken bir hata oluştu');
    },
  });
}

export function useDeleteSyllabusLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSyllabusLesson,
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['syllabi'] });
        toast.success('Ders başarıyla silindi');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ders silinirken bir hata oluştu');
    },
  });
}

export function useSubmitParentFeedback() {
  return useMutation({
    mutationFn: submitParentFeedback,
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Geri bildiriminiz başarıyla gönderildi. Teşekkür ederiz!');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Geri bildirim gönderilirken bir hata oluştu');
    },
  });
}
