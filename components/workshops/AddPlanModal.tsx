"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar as CalendarIcon, Clock, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function AddPlanModal({
    workshopId,
    course,
    open,
    onOpenChange
}: {
    workshopId: string;
    course?: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (course) {
            setTitle(course.title);
            setDescription(course.description || '');
            setDate(new Date(course.date).toISOString().split('T')[0]);
            setStartTime(course.startTime || '');
            setEndTime(course.endTime || '');
        } else {
            setTitle('');
            setDescription('');
            setDate('');
            setStartTime('');
            setEndTime('');
        }
    }, [course, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = course
                ? `/api/workshops/plan/${course.id}`
                : `/api/workshops/${workshopId}/plan`;

            const method = course ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, date, startTime: startTime || null, endTime: endTime || null }),
            });

            if (!res.ok) throw new Error('Action failed');

            toast.success(course ? "Kurs planı güncellendi." : "Yeni kurs planı eklendi.");
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            toast.error("İşlem sırasında bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900">
                        {course ? "Planı Düzenle" : "Yeni Kurs Planla"}
                    </DialogTitle>
                    <DialogDescription>
                        Atölye müfredatına dahil edilecek kurs bilgilerini girin.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="plan-title" className="text-sm font-semibold text-gray-700">Kurs Başlığı</Label>
                        <Input
                            id="plan-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Örn: HTML Giriş"
                            className="rounded-xl border-gray-200 focus:ring-amber-500"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="plan-date" className="text-sm font-semibold text-gray-700">Planlanan Tarih</Label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="plan-date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="pl-10 rounded-xl border-gray-200 focus:ring-amber-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="plan-start-time" className="text-sm font-semibold text-gray-700">Başlangıç Saati</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="plan-start-time"
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="pl-10 rounded-xl border-gray-200 focus:ring-amber-500"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="plan-end-time" className="text-sm font-semibold text-gray-700">Bitiş Saati</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="plan-end-time"
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="pl-10 rounded-xl border-gray-200 focus:ring-amber-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="plan-description" className="text-sm font-semibold text-gray-700">Kısa Açıklama / İçerik</Label>
                        <Textarea
                            id="plan-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Kurs içeriği hakkında kısa not..."
                            className="rounded-xl border-gray-200 focus:ring-amber-500 min-h-[100px]"
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl"
                        >
                            Vazgeç
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !title || !date}
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-8 shadow-md"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            {course ? "Güncelle" : "Planla"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
