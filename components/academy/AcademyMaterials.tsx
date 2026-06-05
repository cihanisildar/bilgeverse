"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { FileText, Video, Link2, FileBox, Plus, Trash2, Loader2, ExternalLink, Upload, Download } from 'lucide-react';
import { useCreateMaterial, useDeleteMaterial } from '@/app/hooks/use-academy-data';
import toast from 'react-hot-toast';
import { AcademyMaterial, AcademyMaterialType } from '@/types/academy';

const TYPE_META: Record<AcademyMaterialType, { label: string; icon: any; color: string }> = {
    PDF: { label: 'PDF', icon: FileText, color: 'text-red-600 bg-red-50 border-red-100' },
    VIDEO: { label: 'Video', icon: Video, color: 'text-purple-600 bg-purple-50 border-purple-100' },
    DOCUMENT: { label: 'Doküman', icon: FileBox, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    LINK: { label: 'Bağlantı', icon: Link2, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
};

function inferTypeFromMime(mime: string): AcademyMaterialType {
    if (mime === 'application/pdf') return 'PDF';
    if (mime.startsWith('video/')) return 'VIDEO';
    return 'DOCUMENT';
}

export function AcademyMaterials({
    lessonId,
    materials,
    canManage,
}: {
    lessonId: string;
    materials: AcademyMaterial[];
    canManage: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<'file' | 'link'>('file');
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState<{ url: string; key: string; type: AcademyMaterialType; name: string } | null>(null);
    const [linkType, setLinkType] = useState<AcademyMaterialType>('LINK');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const createMutation = useCreateMaterial();
    const deleteMutation = useDeleteMaterial();

    function resetForm() {
        setUploaded(null);
        setMode('file');
        setLinkType('LINK');
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/upload/file', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Yükleme başarısız');
            setUploaded({ url: data.url, key: data.key, type: inferTypeFromMime(file.type), name: file.name });
            toast.success('Dosya hazır, başlık girip kaydedin.');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setUploading(false);
        }
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = (formData.get('title') as string)?.trim();
        const description = (formData.get('description') as string) || undefined;
        if (!title) return;

        let payload: any;
        if (mode === 'file') {
            if (!uploaded) {
                toast.error('Önce bir dosya yükleyin.');
                return;
            }
            payload = { lessonId, title, description, type: uploaded.type, url: uploaded.url, fileKey: uploaded.key };
        } else {
            const url = (formData.get('url') as string)?.trim();
            if (!url) {
                toast.error('Geçerli bir bağlantı girin.');
                return;
            }
            payload = { lessonId, title, description, type: linkType, url };
        }

        createMutation.mutate(payload, {
            onSuccess: (result) => {
                if (!result.error) {
                    setOpen(false);
                    resetForm();
                }
            },
        });
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Eğitim Materyalleri</h2>
                    <p className="text-gray-500 mt-1">PDF, video, doküman ve bağlantıları buradan paylaşın.</p>
                </div>
                {canManage && (
                    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200/50 rounded-2xl px-6 py-6 font-bold transition-all hover:scale-105 active:scale-95">
                                <Plus className="h-5 w-5 mr-2" />
                                Materyal Ekle
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl">
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold text-gray-900">Yeni Materyal</DialogTitle>
                                    <DialogDescription className="text-gray-500">
                                        Dosya yükleyin veya harici bir bağlantı (Drive, YouTube vb.) ekleyin.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="flex gap-2 mt-4 p-1 bg-gray-100 rounded-2xl">
                                    <button type="button" onClick={() => setMode('file')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'file' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
                                        Dosya Yükle
                                    </button>
                                    <button type="button" onClick={() => setMode('link')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'link' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
                                        Bağlantı Ekle
                                    </button>
                                </div>

                                <div className="grid gap-5 py-6">
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-bold text-gray-700 ml-1">Başlık</Label>
                                        <Input name="title" placeholder="Örn: 1. Hafta Ders Notu" required className="rounded-2xl border-gray-200" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-bold text-gray-700 ml-1">Açıklama (İsteğe bağlı)</Label>
                                        <Textarea name="description" placeholder="Kısa açıklama..." className="rounded-2xl border-gray-200 min-h-[70px]" />
                                    </div>

                                    {mode === 'file' ? (
                                        <div className="grid gap-2">
                                            <Label className="text-sm font-bold text-gray-700 ml-1">Dosya</Label>
                                            <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden"
                                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,image/*,video/*" />
                                            <div onClick={() => !uploading && fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-blue-200 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/50 transition-colors text-center">
                                                {uploading ? (
                                                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                                                ) : uploaded ? (
                                                    <>
                                                        <FileText className="h-8 w-8 text-green-500 mb-2" />
                                                        <span className="text-sm font-semibold text-gray-700 truncate max-w-full">{uploaded.name}</span>
                                                        <span className="text-xs text-blue-500 mt-1">Değiştirmek için tıklayın</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-8 w-8 text-blue-400 mb-2" />
                                                        <span className="text-sm font-semibold text-gray-600">Dosya seçmek için tıklayın</span>
                                                        <span className="text-xs text-gray-400 mt-1">PDF, Office, görsel veya video (Max 50MB)</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid gap-2">
                                                <Label className="text-sm font-bold text-gray-700 ml-1">Bağlantı (URL)</Label>
                                                <Input name="url" type="url" placeholder="https://..." className="rounded-2xl border-gray-200" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-sm font-bold text-gray-700 ml-1">Tür</Label>
                                                <Select value={linkType} onValueChange={(v) => setLinkType(v as AcademyMaterialType)}>
                                                    <SelectTrigger className="rounded-2xl border-gray-200"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="VIDEO">Video</SelectItem>
                                                        <SelectItem value="PDF">PDF</SelectItem>
                                                        <SelectItem value="DOCUMENT">Doküman</SelectItem>
                                                        <SelectItem value="LINK">Bağlantı</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <DialogFooter>
                                    <Button type="submit" disabled={createMutation.isPending || uploading} className="w-full bg-blue-600 text-white hover:bg-blue-700 py-6 rounded-2xl font-bold shadow-lg shadow-blue-200">
                                        {createMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                                        Materyali Kaydet
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {materials.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100 text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                        <FileBox className="h-10 w-10 text-blue-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz materyal yok</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">Bu ders için henüz bir eğitim materyali eklenmemiş.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {materials.map((m) => {
                        const meta = TYPE_META[m.type] || TYPE_META.LINK;
                        const Icon = meta.icon;
                        return (
                            <div key={m.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 flex items-start gap-4">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${meta.color}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-gray-900 truncate">{m.title}</h4>
                                        <Badge variant="outline" className={`text-[10px] px-2 py-0 border ${meta.color}`}>{meta.label}</Badge>
                                    </div>
                                    {m.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{m.description}</p>}
                                    <div className="flex items-center gap-2">
                                        <a href={m.url} target="_blank" rel="noopener noreferrer">
                                            <Button size="sm" variant="outline" className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 h-8">
                                                {m.fileKey ? <Download className="h-3.5 w-3.5 mr-1.5" /> : <ExternalLink className="h-3.5 w-3.5 mr-1.5" />}
                                                {m.fileKey ? 'İndir / Aç' : 'Aç'}
                                            </Button>
                                        </a>
                                        {canManage && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 rounded-xl">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="rounded-[2rem]">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Materyali Sil?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            "{m.title}" materyalini silmek istediğinize emin misiniz?
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="rounded-xl">Vazgeç</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => deleteMutation.mutate({ id: m.id, lessonId })} className="bg-red-600 hover:bg-red-700 text-white rounded-xl">
                                                            Sil
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
