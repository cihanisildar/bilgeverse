"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ImageUpload } from './ImageUpload';

export function CreateWorkshopModal({ children }: { children?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            description: formData.get('description'),
            imageUrl: imageUrl,
        };

        try {
            const res = await fetch('/api/workshops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error('Failed to create workshop');

            toast.success("Atölye başarıyla oluşturuldu.");
            setOpen(false);
            setImageUrl('');
            router.refresh();
        } catch (error) {
            toast.error("Atölye oluşturulurken bir sorun oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) setImageUrl('');
        }}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all border-0">
                        <Plus className="h-5 w-5 mr-2" />
                        Yeni Atölye
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Yeni Atölye Oluştur</DialogTitle>
                        <DialogDescription>
                            Yeni bir beceri atölyesi tanımlayın. Bilgileri girdikten sonra kaydedin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Atölye Görseli</Label>
                            <ImageUpload
                                value={imageUrl}
                                onChange={(url) => setImageUrl(url)}
                                onRemove={() => setImageUrl('')}
                                disabled={loading}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Atölye Adı</Label>
                            <Input id="name" name="name" placeholder="Örn: Robotik Kodlama" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Açıklama</Label>
                            <Textarea id="description" name="description" placeholder="Atölye hakkında kısa bilgi..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Atölyeyi Oluştur
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
