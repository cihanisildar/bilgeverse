"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export function AddActivityModal({ workshopId }: { workshopId: string }) {
    const [open, setOpen] = useState(false);
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
            const res = await fetch(`/api/workshops/${workshopId}/activities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error('Failed to create activity');

            toast.success("Faaliyet başarıyla eklendi.");
            setOpen(false);
            router.refresh();
        } catch (error) {
            toast.error("Faaliyet eklenirken bir sorun oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md border-0">
                    <Plus className="h-5 w-5 mr-2" />
                    Yeni Faaliyet Ekle
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Yeni Faaliyet Tanımla</DialogTitle>
                        <DialogDescription>
                            Atölye için bir ders veya etkinlik saati belirleyin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Faaliyet Başlığı</Label>
                            <Input id="title" name="title" placeholder="Örn: Hafta 1 - Temel Kavramlar" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Açıklama</Label>
                            <Textarea id="description" name="description" placeholder="Faaliyet içeriği..." />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="date">Tarih</Label>
                            <Input id="date" name="date" type="date" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="startTime">Başlangıç Saati</Label>
                                <Input id="startTime" name="startTime" type="time" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="endTime">Bitiş Saati</Label>
                                <Input id="endTime" name="endTime" type="time" required />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="location">Konum/Mekan</Label>
                            <Input id="location" name="location" placeholder="Örn: Derslik 3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Faaliyeti Kaydet
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
