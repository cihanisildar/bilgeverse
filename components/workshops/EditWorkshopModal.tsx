"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { ImageUpload } from './ImageUpload';

export function EditWorkshopModal({
    workshop,
    open,
    onOpenChange
}: {
    workshop: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(workshop.name);
    const [description, setDescription] = useState(workshop.description || '');
    const [imageUrl, setImageUrl] = useState(workshop.imageUrl || '');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/workshops/${workshop.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, imageUrl }),
            });

            if (!res.ok) throw new Error('Failed to update workshop');

            toast.success("Atölye başarıyla güncellendi.");
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            toast.error("Atölye güncellenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900">Atölyeyi Düzenle</DialogTitle>
                    <DialogDescription>
                        Atölye bilgilerini buradan güncelleyebilirsiniz.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name" className="text-sm font-semibold text-gray-700">Atölye Adı</Label>
                        <Input
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Atölye adını girin..."
                            className="rounded-xl border-gray-200 focus:ring-amber-500"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-description" className="text-sm font-semibold text-gray-700">Açıklama</Label>
                        <Textarea
                            id="edit-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Atölye hakkında kısa bilgi..."
                            className="rounded-xl border-gray-200 focus:ring-amber-500 min-h-[100px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Atölye Görseli</Label>
                        <ImageUpload
                            value={imageUrl}
                            onChange={setImageUrl}
                            onRemove={() => setImageUrl('')}
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
                            disabled={loading || !name}
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-8 shadow-md"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Değişiklikleri Kaydet
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
