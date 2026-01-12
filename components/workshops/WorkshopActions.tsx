"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { EditWorkshopModal } from './EditWorkshopModal';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function WorkshopActions({ workshop }: { workshop: any }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/workshops/${workshop.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Delete failed');

            toast.success("Atölye başarıyla silindi.");
            router.push('/dashboard/part4');
            router.refresh();
        } catch (error) {
            toast.error("Atölye silinirken bir hata oluştu.");
        } finally {
            setLoading(false);
            setIsDeleteOpen(false);
        }
    };

    return (
        <>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditOpen(true)}
                    className="rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50"
                >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Düzenle
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeleteOpen(true)}
                    className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Sil
                </Button>
            </div>

            <EditWorkshopModal
                workshop={workshop}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
            />

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto md:mx-0">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold text-gray-900">
                            Atölyeyi Sil?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600">
                            <span className="font-bold text-gray-900">{workshop.name}</span> isimli atölye ve bu atölyeye ait tüm faaliyetler, yoklamalar ve kayıtlar kalıcı olarak silinecektir. Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl border-gray-200 hover:bg-gray-100">Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl border-0 min-w-[100px]"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atölyeyi Kalıcı Olarak Sil"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
