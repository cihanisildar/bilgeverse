"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateAcademyLesson, useDeleteAcademyLesson } from '@/app/hooks/use-academy-data';
import { Loader2, Settings2, Trash2 } from 'lucide-react';

interface EditLessonModalProps {
    lesson: {
        id: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
        startDate?: Date | string | null;
        capacity?: number | null;
    };
    children?: React.ReactNode;
}

function toDateInputValue(value?: Date | string | null): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
}

export function EditLessonModal({ lesson, children }: EditLessonModalProps) {
    const [open, setOpen] = useState(false);
    const updateMutation = useUpdateAcademyLesson();
    const deleteMutation = useDeleteAcademyLesson();
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const imageUrl = formData.get('imageUrl') as string;
        const startDate = (formData.get('startDate') as string) || null;
        const capacityRaw = formData.get('capacity') as string;
        const capacity = capacityRaw ? parseInt(capacityRaw, 10) : null;

        updateMutation.mutate({
            id: lesson.id,
            data: { name, description, imageUrl, startDate, capacity }
        }, {
            onSuccess: (result) => {
                if (!result.error) setOpen(false);
            }
        });
    }

    async function handleDelete() {
        deleteMutation.mutate(lesson.id, {
            onSuccess: (result) => {
                if (!result.error) {
                    setOpen(false);
                    router.push('/dashboard/part11');
                }
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                        <Settings2 className="h-4 w-4 mr-2" />
                        Dersi Düzenle
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Dersi Düzenle</DialogTitle>
                        <DialogDescription>
                            Ders bilgilerini güncelleyin veya dersi tamamen silin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Ders Adı</Label>
                            <Input id="name" name="name" defaultValue={lesson.name} placeholder="Örn: Matematik" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Açıklama</Label>
                            <Textarea id="description" name="description" defaultValue={lesson.description || ''} placeholder="Ders hakkında kısa bilgi..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                                <Input id="startDate" name="startDate" type="date" defaultValue={toDateInputValue(lesson.startDate)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="capacity">Kontenjan</Label>
                                <Input id="capacity" name="capacity" type="number" min="1" defaultValue={lesson.capacity ?? ''} placeholder="Sınırsız" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="imageUrl">Görsel URL</Label>
                            <Input id="imageUrl" name="imageUrl" defaultValue={lesson.imageUrl || ''} placeholder="https://..." />
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="destructive" className="sm:mr-auto">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Dersi Sil
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Dersi Kalıcı Olarak Sil?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        "{lesson.name}" dersini ve içindeki tüm müfredat, oturum ve yoklama verilerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                                        Evet, Her Şeyi Sil
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <Button type="submit" disabled={updateMutation.isPending} className="bg-blue-600 text-white hover:bg-blue-700">
                            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Güncelle
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
