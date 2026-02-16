"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAcademyLesson } from '@/app/hooks/use-academy-data';
import { Loader2 } from 'lucide-react';

export function CreateLessonModal({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const createMutation = useCreateAcademyLesson();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const imageUrl = formData.get('imageUrl') as string;

        createMutation.mutate({ name, description, imageUrl }, {
            onSuccess: (result) => {
                if (!result.error) setOpen(false);
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Yeni Ders Oluştur</DialogTitle>
                        <DialogDescription>
                            Akademi kapsamında verilecek yeni bir ders ekleyin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Ders Adı</Label>
                            <Input id="name" name="name" placeholder="Örn: Matematik" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Açıklama</Label>
                            <Textarea id="description" name="description" placeholder="Ders hakkında kısa bilgi..." />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="imageUrl">Görsel URL (İsteğe Bağlı)</Label>
                            <Input id="imageUrl" name="imageUrl" placeholder="https://..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={createMutation.isPending} className="bg-blue-600 text-white hover:bg-blue-700">
                            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Oluştur
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
