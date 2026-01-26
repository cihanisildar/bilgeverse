"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface DeleteActivityDialogProps {
    activity: {
        id: string;
        title: string;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteActivityDialog({ activity, open, onOpenChange }: DeleteActivityDialogProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setLoading(true);

        try {
            const res = await fetch(`/api/workshops/activities/${activity.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to delete activity');
            }

            toast.success("Faaliyet başarıyla silindi.");
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Faaliyet silinirken bir sorun oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <DialogTitle>Faaliyeti Sil</DialogTitle>
                            <DialogDescription>
                                Bu işlem geri alınamaz
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-gray-600">
                        <strong className="text-gray-900">{activity.title}</strong> adlı faaliyeti silmek istediğinizden emin misiniz?
                        Bu işlem tüm katılım kayıtlarını da silecektir.
                    </p>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        İptal
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Evet, Sil
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
