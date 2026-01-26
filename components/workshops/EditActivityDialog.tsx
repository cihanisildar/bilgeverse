"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface EditActivityDialogProps {
    activity: {
        id: string;
        title: string;
        description: string | null;
        date: Date;
        startTime: string | null;
        endTime: string | null;
        location: string | null;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditActivityDialog({ activity, open, onOpenChange }: EditActivityDialogProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            title: formData.get('title'),
            description: formData.get('description'),
            date: formData.get('date'),
            startTime: formData.get('startTime'),
            endTime: formData.get('endTime'),
            location: formData.get('location'),
        };

        try {
            const res = await fetch(`/api/workshops/activities/${activity.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to update activity');
            }

            toast.success("Faaliyet başarıyla güncellendi.");
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Faaliyet güncellenirken bir sorun oluştu.");
        } finally {
            setLoading(false);
        }
    };

    // Format date for input field (YYYY-MM-DD)
    const formattedDate = format(new Date(activity.date), 'yyyy-MM-dd');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Faaliyet Düzenle</DialogTitle>
                        <DialogDescription>
                            Faaliyet bilgilerini güncelleyin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Faaliyet Başlığı</Label>
                            <Input
                                id="title"
                                name="title"
                                defaultValue={activity.title}
                                placeholder="Örn: Hafta 1 - Temel Kavramlar"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Açıklama</Label>
                            <Textarea
                                id="description"
                                name="description"
                                defaultValue={activity.description || ''}
                                placeholder="Faaliyet içeriği..."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="date">Tarih</Label>
                            <Input
                                id="date"
                                name="date"
                                type="date"
                                defaultValue={formattedDate}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="startTime">Başlangıç Saati</Label>
                                <Input
                                    id="startTime"
                                    name="startTime"
                                    type="time"
                                    defaultValue={activity.startTime || ''}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="endTime">Bitiş Saati</Label>
                                <Input
                                    id="endTime"
                                    name="endTime"
                                    type="time"
                                    defaultValue={activity.endTime || ''}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="location">Konum/Mekan</Label>
                            <Input
                                id="location"
                                name="location"
                                defaultValue={activity.location || ''}
                                placeholder="Örn: Derslik 3"
                            />
                        </div>
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
                            type="submit"
                            disabled={loading}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Değişiklikleri Kaydet
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
