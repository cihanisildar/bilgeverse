'use client';

import {
    assignToAcademyLesson,
    createAcademyLesson,
    createAcademySession,
    deleteAcademyLesson,
    enrollStudentInAcademyLesson,
    getAcademyLessonDetails,
    getAcademyLessons,
    recordAcademyAttendance,
    removeAssignmentFromAcademyLesson,
    unenrollStudentFromAcademyLesson,
    updateAcademyLesson,
    updateAcademySyllabus
} from '@/app/actions/academy-actions';
import { useToast } from '@/hooks/use-toast';
import { AcademyUser } from '@/types/academy';
import { UserRole } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// --- Query Hooks ---

export function useAcademyLessons() {
    return useQuery({
        queryKey: ['academy-lessons'],
        queryFn: async () => {
            const { data, error } = await getAcademyLessons();
            if (error) throw new Error(error);
            return data || [];
        }
    });
}

export function useAcademyLessonDetails(id: string) {
    return useQuery({
        queryKey: ['academy-lesson', id],
        queryFn: async () => {
            const { data, error } = await getAcademyLessonDetails(id);
            if (error) throw new Error(error);
            if (!data) throw new Error('Ders bulunamadı');
            return data;
        },
        enabled: !!id
    });
}

export function useUsers() {
    return useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const resp = await fetch('/api/users');
            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.error || 'Kullanıcılar getirilemedi');
            }
            const data = await resp.json();
            return (data.users || []) as AcademyUser[];
        }
    });
}

// --- Mutation Hooks ---

export function useCreateAcademyLesson() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (variables: any) => createAcademyLesson(variables),
        onSuccess: (result) => {
            if (result.error) {
                toast({ title: 'Hata', description: result.error, variant: 'destructive' });
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lessons'] });
                toast({ title: 'Başarılı', description: 'Ders başarıyla oluşturuldu.' });
            }
        },
        onError: (error: Error) => {
            toast({ title: 'Hata', description: error.message, variant: 'destructive' });
        }
    });
}

export function useUpdateAcademyLesson() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (variables: { id: string; data: any }) => updateAcademyLesson(variables.id, variables.data),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast({ title: 'Hata', description: result.error, variant: 'destructive' });
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lessons'] });
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.id] });
                toast({ title: 'Başarılı', description: 'Ders güncellendi.' });
            }
        }
    });
}

export function useDeleteAcademyLesson() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (id: string) => deleteAcademyLesson(id),
        onSuccess: (result) => {
            if (result.error) {
                toast({ title: 'Hata', description: result.error, variant: 'destructive' });
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lessons'] });
                toast({ title: 'Başarılı', description: 'Ders silindi.' });
            }
        }
    });
}

export function useAssignStaff() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (variables: { lessonId: string; userId: string; role: UserRole }) =>
            assignToAcademyLesson(variables.lessonId, variables.userId, variables.role),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast({ title: 'Hata', description: result.error, variant: 'destructive' });
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast({ title: 'Başarılı', description: 'Görevli atandı.' });
            }
        }
    });
}

export function useRemoveStaff() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (variables: { lessonId: string; userId: string }) =>
            removeAssignmentFromAcademyLesson(variables.lessonId, variables.userId),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast({ title: 'Hata', description: result.error, variant: 'destructive' });
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast({ title: 'Başarılı', description: 'Görevli kaldırıldı.' });
            }
        }
    });
}

export function useEnrollStudent() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (variables: { lessonId: string; studentId: string }) =>
            enrollStudentInAcademyLesson(variables.lessonId, variables.studentId),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast({ title: 'Hata', description: result.error, variant: 'destructive' });
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast({ title: 'Başarılı', description: 'Öğrenci kaydedildi.' });
            }
        }
    });
}

export function useUnenrollStudent() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (variables: { lessonId: string; studentId: string }) =>
            unenrollStudentFromAcademyLesson(variables.lessonId, variables.studentId),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast({ title: 'Hata', description: result.error, variant: 'destructive' });
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast({ title: 'Başarılı', description: 'Öğrenci kaydı silindi.' });
            }
        }
    });
}

export function useUpdateSyllabus() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (variables: { lessonId: string; items: any[] }) =>
            updateAcademySyllabus(variables.lessonId, variables.items),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast({ title: 'Hata', description: result.error, variant: 'destructive' });
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast({ title: 'Başarılı', description: 'Müfredat güncellendi.' });
            }
        }
    });
}

export function useCreateSession() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (variables: any) => createAcademySession(variables),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast({ title: 'Hata', description: result.error, variant: 'destructive' });
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast({ title: 'Başarılı', description: 'Oturum oluşturuldu.' });
            }
        }
    });
}

export function useRecordAttendance() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (variables: { sessionId: string; lessonId: string; attendances: any[] }) =>
            recordAcademyAttendance(variables.sessionId, variables.attendances),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast({ title: 'Hata', description: result.error, variant: 'destructive' });
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast({ title: 'Başarılı', description: 'Yoklama kaydedildi.' });
            }
        }
    });
}
