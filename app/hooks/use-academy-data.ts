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
    updateAcademySyllabus,
    createAcademyMaterial,
    deleteAcademyMaterial,
    createAcademyStudentNote,
    updateAcademyStudentNote,
    deleteAcademyStudentNote,
    createAcademyTask,
    updateAcademyTask,
    deleteAcademyTask,
    completeAcademyTask,
    uncompleteAcademyTask,
    getAcademyLessonReport
} from '@/app/actions/academy-actions';
import toast from 'react-hot-toast';
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

    return useMutation({
        mutationFn: (variables: any) => createAcademyLesson(variables),
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lessons'] });
                toast.success('Ders başarıyla oluşturuldu.');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });
}

export function useUpdateAcademyLesson() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: { id: string; data: any }) => updateAcademyLesson(variables.id, variables.data),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lessons'] });
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.id] });
                toast.success('Ders güncellendi.');
            }
        }
    });
}

export function useDeleteAcademyLesson() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteAcademyLesson(id),
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lessons'] });
                toast.success('Ders silindi.');
            }
        }
    });
}

export function useAssignStaff() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: { lessonId: string; userId: string; role: UserRole }) =>
            assignToAcademyLesson(variables.lessonId, variables.userId, variables.role),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast.success('Görevli atandı.');
            }
        }
    });
}

export function useRemoveStaff() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: { lessonId: string; userId: string }) =>
            removeAssignmentFromAcademyLesson(variables.lessonId, variables.userId),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast.success('Görevli kaldırıldı.');
            }
        }
    });
}

export function useEnrollStudent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: { lessonId: string; studentId: string }) =>
            enrollStudentInAcademyLesson(variables.lessonId, variables.studentId),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast.success('Öğrenci kaydedildi.');
            }
        }
    });
}

export function useUnenrollStudent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: { lessonId: string; studentId: string }) =>
            unenrollStudentFromAcademyLesson(variables.lessonId, variables.studentId),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast.success('Öğrenci kaydı silindi.');
            }
        }
    });
}

export function useUpdateSyllabus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: { lessonId: string; items: any[] }) =>
            updateAcademySyllabus(variables.lessonId, variables.items),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast.success('Müfredat güncellendi.');
            }
        }
    });
}

export function useCreateSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: any) => createAcademySession(variables),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast.success('Oturum oluşturuldu.');
            }
        }
    });
}

export function useRecordAttendance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: { sessionId: string; lessonId: string; attendances: any[] }) =>
            recordAcademyAttendance(variables.sessionId, variables.attendances),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast.success('Yoklama kaydedildi.');
            }
        }
    });
}

// --- Materials ---

export function useCreateMaterial() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: any) => createAcademyMaterial(variables),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast.success('Materyal eklendi.');
            }
        }
    });
}

export function useDeleteMaterial() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: { id: string; lessonId: string }) => deleteAcademyMaterial(variables.id),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast.success('Materyal silindi.');
            }
        }
    });
}

// --- Student Notes ---

export function useCreateNote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: any) => createAcademyStudentNote(variables),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast.success('Değerlendirme eklendi.');
            }
        }
    });
}

export function useUpdateNote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: { id: string; lessonId: string; data: any }) =>
            updateAcademyStudentNote(variables.id, variables.data),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast.success('Değerlendirme güncellendi.');
            }
        }
    });
}

export function useDeleteNote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: { id: string; lessonId: string }) => deleteAcademyStudentNote(variables.id),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast.success('Değerlendirme silindi.');
            }
        }
    });
}

// --- Tasks ---

export function useCreateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: any) => createAcademyTask(variables),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast.success('Görev oluşturuldu.');
            }
        }
    });
}

export function useUpdateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: { id: string; lessonId: string; data: any }) =>
            updateAcademyTask(variables.id, variables.data),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast.success('Görev güncellendi.');
            }
        }
    });
}

export function useDeleteTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: { id: string; lessonId: string }) => deleteAcademyTask(variables.id),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                toast.success('Görev silindi.');
            }
        }
    });
}

export function useCompleteTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: { taskId: string; studentId: string; lessonId: string }) =>
            completeAcademyTask(variables.taskId, variables.studentId),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                queryClient.invalidateQueries({ queryKey: ['academy-report', variables.lessonId] });
                toast.success('Görev tamamlandı, Bilge Para verildi.');
            }
        }
    });
}

export function useUncompleteTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: { taskId: string; studentId: string; lessonId: string }) =>
            uncompleteAcademyTask(variables.taskId, variables.studentId),
        onSuccess: (result, variables) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                queryClient.invalidateQueries({ queryKey: ['academy-lesson', variables.lessonId] });
                queryClient.invalidateQueries({ queryKey: ['academy-report', variables.lessonId] });
                toast.success('Görev tamamlaması geri alındı.');
            }
        }
    });
}

// --- Report ---

export function useAcademyLessonReport(lessonId: string, enabled = true) {
    return useQuery({
        queryKey: ['academy-report', lessonId],
        queryFn: async () => {
            const { data, error } = await getAcademyLessonReport(lessonId);
            if (error) throw new Error(error);
            return data;
        },
        enabled: !!lessonId && enabled,
    });
}
