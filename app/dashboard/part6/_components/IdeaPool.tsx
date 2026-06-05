'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, Edit2, Trash2, Lightbulb, Search, ArrowRightCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useContentIdeas, useCreateIdea, useUpdateIdea, useDeleteIdea, useConvertIdeaToPost } from '@/app/hooks/use-social';
import { PLATFORMS, CONTENT_TYPES, IDEA_STATUSES, getIdeaStatusMeta, getPlatformMeta, getContentTypeLabel } from '@/app/lib/social';
import { ContentIdea } from '@/types/social';
import { ContentIdeaStatus, SocialPlatform } from '@prisma/client';

export default function IdeaPool() {
    const { data: ideas = [], isLoading } = useContentIdeas();
    const createIdea = useCreateIdea();
    const updateIdea = useUpdateIdea();
    const deleteIdea = useDeleteIdea();
    const convertIdea = useConvertIdeaToPost();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState<ContentIdea | null>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [platform, setPlatform] = useState<string>('NONE');
    const [contentType, setContentType] = useState<string>('NONE');
    const [tags, setTags] = useState('');
    const [status, setStatus] = useState<ContentIdeaStatus>(ContentIdeaStatus.NEW);
    const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);

    const openDialog = (idea: ContentIdea | null = null) => {
        if (idea) {
            setEditing(idea);
            setTitle(idea.title);
            setDescription(idea.description || '');
            setPlatform(idea.platform || 'NONE');
            setContentType(idea.contentType || 'NONE');
            setTags(idea.tags.join(', '));
            setStatus(idea.status);
        } else {
            setEditing(null);
            setTitle('');
            setDescription('');
            setPlatform('NONE');
            setContentType('NONE');
            setTags('');
            setStatus(ContentIdeaStatus.NEW);
        }
        setIsOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            title,
            description,
            platform: platform === 'NONE' ? null : (platform as SocialPlatform),
            contentType: contentType === 'NONE' ? null : contentType,
            tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            status,
        };
        try {
            if (editing) {
                await updateIdea.mutateAsync({ id: editing.id, data: payload });
                toast.success('Fikir başarıyla güncellendi.');
            } else {
                await createIdea.mutateAsync(payload);
                toast.success('Fikir başarıyla eklendi.');
            }
            setIsOpen(false);
        } catch (error) {
            toast.error('İşlem sırasında bir hata oluştu.');
        }
    };

    const confirmDelete = async () => {
        if (!ideaToDelete) return;
        try {
            await deleteIdea.mutateAsync(ideaToDelete);
            toast.success('Fikir başarıyla silindi.');
        } catch (error) {
            toast.error('Fikir silinirken bir hata oluştu.');
        } finally {
            setIdeaToDelete(null);
        }
    };

    const filtered = ideas.filter((i) => {
        const matchesSearch = i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (i.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const saving = createIdea.isPending || updateIdea.isPending;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 flex flex-col sm:flex-row items-center gap-3 max-w-xl">
                    <div className="relative flex-1 w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Fikirlerde ara..." className="pl-10 bg-white border-teal-100" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px] bg-white border-teal-100"><SelectValue placeholder="Durum" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tüm Durumlar</SelectItem>
                            {IDEA_STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={() => openDialog()} className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                    <Plus className="h-4 w-4 mr-2" /> Yeni Fikir
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
            ) : filtered.length === 0 ? (
                <Card className="border-dashed border-2 border-teal-100 bg-teal-50/30">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Lightbulb className="h-12 w-12 text-teal-200 mb-4" />
                        <h3 className="text-lg font-medium text-gray-700">Fikir havuzu boş</h3>
                        <p className="text-gray-500 max-w-sm mt-2">Gelecekte kullanacağınız içerik fikirlerini buraya kaydedin.</p>
                        <Button variant="outline" className="mt-6 border-teal-200 text-teal-600" onClick={() => openDialog()}>İlk Fikri Ekle</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((idea) => {
                        const statusMeta = getIdeaStatusMeta(idea.status);
                        const converted = idea.status === ContentIdeaStatus.CONVERTED;
                        return (
                            <Card key={idea.id} className="group border-0 shadow-sm hover:shadow-md transition-all flex flex-col">
                                <CardContent className="p-5 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between">
                                        <Badge variant="outline" className={`${statusMeta.bg} ${statusMeta.color} border-transparent`}>{statusMeta.label}</Badge>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:bg-blue-50" onClick={() => openDialog(idea)}>
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600 hover:bg-rose-50" onClick={() => setIdeaToDelete(idea.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mt-3">{idea.title}</h3>
                                    {idea.description && <p className="text-sm text-gray-500 mt-1 line-clamp-3 flex-1">{idea.description}</p>}
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {idea.platform && (
                                            <Badge variant="outline" className={`${getPlatformMeta(idea.platform).bg} ${getPlatformMeta(idea.platform).color} border-transparent text-[10px]`}>
                                                {getPlatformMeta(idea.platform).label}
                                            </Badge>
                                        )}
                                        {idea.contentType && (
                                            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-transparent text-[10px]">{getContentTypeLabel(idea.contentType)}</Badge>
                                        )}
                                        {idea.tags.map((t, i) => (
                                            <span key={i} className="text-[11px] text-teal-600 font-medium">#{t.replace(/^#/, '')}</span>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400 uppercase font-semibold">{idea.createdBy.firstName || idea.createdBy.username}</span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            disabled={converted || convertIdea.isPending}
                                            className="h-7 text-[11px] text-emerald-600 hover:bg-emerald-50 gap-1"
                                            onClick={() => convertIdea.mutate(idea.id)}
                                        >
                                            {converted ? 'Dönüştürüldü' : <>Gönderiye Dönüştür <ArrowRightCircle className="h-3.5 w-3.5" /></>}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Fikri Düzenle' : 'Yeni İçerik Fikri'}</DialogTitle>
                        <DialogDescription>Gelecekte kullanmak üzere içerik fikrini kaydedin.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="idea-title">Başlık</Label>
                            <Input id="idea-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Fikir başlığı..." required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="idea-desc">Açıklama / Notlar</Label>
                            <Textarea id="idea-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Fikrin detayları..." className="min-h-[100px]" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="idea-platform">Platform (ops.)</Label>
                                <Select value={platform} onValueChange={setPlatform}>
                                    <SelectTrigger id="idea-platform"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NONE">Belirtilmedi</SelectItem>
                                        {PLATFORMS.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="idea-ct">İçerik Türü (ops.)</Label>
                                <Select value={contentType} onValueChange={setContentType}>
                                    <SelectTrigger id="idea-ct"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NONE">Belirtilmedi</SelectItem>
                                        {CONTENT_TYPES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="idea-tags">Etiketler (virgülle)</Label>
                                <Input id="idea-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="eğitim, etkinlik" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="idea-status">Durum</Label>
                                <Select value={status} onValueChange={(v) => setStatus(v as ContentIdeaStatus)}>
                                    <SelectTrigger id="idea-status"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {IDEA_STATUSES.filter((s) => s.id !== ContentIdeaStatus.CONVERTED).map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>İptal</Button>
                            <Button type="submit" disabled={saving} className="bg-teal-600 text-white min-w-[100px]">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Güncelle' : 'Ekle'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!ideaToDelete} onOpenChange={(open) => !open && setIdeaToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Silmek istediğinize emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu fikri silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white">
                            {deleteIdea.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sil'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
