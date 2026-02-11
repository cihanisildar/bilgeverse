import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminPdfs, createAdminPdf, updateAdminPdf, deleteAdminPdf } from '@/app/actions/admin-pdfs';
import toast from 'react-hot-toast';

export function useAdminPdfs(partId?: number) {
    return useQuery({
        queryKey: ['admin-pdfs', partId],
        queryFn: async () => {
            const result = await getAdminPdfs(partId);
            if (result.error) throw new Error(result.error);
            return result.data;
        },
    });
}

export function useCreateAdminPdf() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createAdminPdf,
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.message || 'Belge başarıyla eklendi');
                queryClient.invalidateQueries({ queryKey: ['admin-pdfs'] });
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Belge eklenirken bir hata oluştu');
        },
    });
}

export function useUpdateAdminPdf() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateAdminPdf(id, data),
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.message || 'Belge başarıyla güncellendi');
                queryClient.invalidateQueries({ queryKey: ['admin-pdfs'] });
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Belge güncellenirken bir hata oluştu');
        },
    });
}

export function useDeleteAdminPdf() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteAdminPdf,
        onSuccess: (result) => {
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.message || 'Belge başarıyla silindi');
                queryClient.invalidateQueries({ queryKey: ['admin-pdfs'] });
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Belge silinirken bir hata oluştu');
        },
    });
}
