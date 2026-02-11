'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Trash2, Edit2, Sparkles, Hash, FileText, Loader2, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { useSocialIngredients, useCreateSocialIngredient, useUpdateSocialIngredient, useDeleteSocialIngredient } from '@/app/hooks/use-social';
import { ContentIngredient } from '@/types/social';

export default function IngredientManager() {
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');

    // React Query Hooks
    const { data: ingredients = [], isLoading: loading } = useSocialIngredients();
    const createIngredientMutation = useCreateSocialIngredient();
    const updateIngredientMutation = useUpdateSocialIngredient();
    const deleteIngredientMutation = useDeleteSocialIngredient();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<ContentIngredient | null>(null);

    // Form states
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState('hashtag');

    const handleOpenDialog = (ingredient: ContentIngredient | null = null) => {
        if (ingredient) {
            setEditingIngredient(ingredient);
            setTitle(ingredient.title);
            setContent(ingredient.content);
            setType(ingredient.type);
        } else {
            setEditingIngredient(null);
            setTitle('');
            setContent('');
            setType('hashtag');
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = { title, content, type };

        if (editingIngredient) {
            await updateIngredientMutation.mutateAsync({ id: editingIngredient.id, data: payload });
        } else {
            await createIngredientMutation.mutateAsync(payload);
        }

        setIsDialogOpen(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu bileşeni silmek istediğinize emin misiniz?')) return;
        await deleteIngredientMutation.mutateAsync(id);
    };

    const handleCopy = (content: string, title: string) => {
        navigator.clipboard.writeText(content);
        toast.success(`"${title}" içeriği kopyalandı.`);
    };

    const filteredIngredients = (ingredients || []).filter(ing => {
        const matchesSearch = ing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ing.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'ALL' || ing.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'hashtag': return <Hash className="h-4 w-4" />;
            case 'template': return <FileText className="h-4 w-4" />;
            default: return <Sparkles className="h-4 w-4" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'hashtag': return 'Hashtag Seti';
            case 'template': return 'Taslak Metin';
            case 'media': return 'Medya Referansı';
            default: return type;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'hashtag': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
            case 'template': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'media': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 flex flex-col sm:flex-row items-center gap-3 max-w-xl">
                    <div className="relative flex-1 w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Bileşenlerde ara..."
                            className="pl-10 bg-white border-teal-100"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full sm:w-[160px] bg-white border-teal-100">
                            <SelectValue placeholder="Bileşen Türü" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tüm Türler</SelectItem>
                            <SelectItem value="hashtag">Hashtag Setleri</SelectItem>
                            <SelectItem value="template">Taslak Metinler</SelectItem>
                            <SelectItem value="media">Medya Referansları</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md hover:shadow-lg transition-all">
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Bileşen Ekle
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
                </div>
            ) : filteredIngredients.length === 0 ? (
                <Card className="border-dashed border-2 border-teal-100 bg-teal-50/30">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Sparkles className="h-12 w-12 text-teal-200 mb-4" />
                        <h3 className="text-lg font-medium text-gray-700">Henüz bileşen bulunmuyor</h3>
                        <p className="text-gray-500 max-w-sm mt-2">
                            Sosyal medya gönderilerinizde kullanmak üzere hashtag setleri veya metin taslakları oluşturun.
                        </p>
                        <Button variant="outline" className="mt-6 border-teal-200 text-teal-600" onClick={() => handleOpenDialog()}>
                            İlk Bileşeni Oluştur
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredIngredients.map((ingredient) => (
                        <Card key={ingredient.id} className="group overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className={`h-1.5 ${ingredient.type === 'hashtag' ? 'bg-cyan-500' : ingredient.type === 'template' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className={`font-normal ${getTypeColor(ingredient.type)}`}>
                                        <span className="mr-1.5">{getTypeIcon(ingredient.type)}</span>
                                        {getTypeLabel(ingredient.type)}
                                    </Badge>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-teal-600 hover:bg-teal-50"
                                            onClick={() => handleCopy(ingredient.content, ingredient.title)}
                                            title="Kopyala"
                                            disabled={deleteIngredientMutation.isPending || createIngredientMutation.isPending || updateIngredientMutation.isPending}
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                            onClick={() => handleOpenDialog(ingredient)}
                                            disabled={deleteIngredientMutation.isPending || createIngredientMutation.isPending || updateIngredientMutation.isPending}
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                                            onClick={() => handleDelete(ingredient.id)}
                                            disabled={deleteIngredientMutation.isPending || createIngredientMutation.isPending || updateIngredientMutation.isPending}
                                        >
                                            {deleteIngredientMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                        </Button>
                                    </div>
                                </div>
                                <CardTitle className="text-lg mt-2 font-bold text-gray-800">{ingredient.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-gray-50/80 rounded-lg p-3 text-sm text-gray-600 line-clamp-4 font-mono whitespace-pre-wrap border border-gray-100">
                                    {ingredient.content}
                                </div>
                                <div className="mt-4 flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                                    <span>{new Date(ingredient.createdAt).toLocaleDateString('tr-TR')}</span>
                                    <span>{ingredient.createdBy.firstName || ingredient.createdBy.username} tarafından</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingIngredient ? 'Bileşeni Düzenle' : 'Yeni Bileşen Oluştur'}</DialogTitle>
                        <DialogDescription>
                            Sosyal medya gönderileri için tekrar kullanılabilir içerik bloğu oluşturun.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Bileşen Adı</Label>
                            <Input
                                id="title"
                                placeholder="Örn: Haftalık Hashtag Seti"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Bileşen Türü</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tür seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hashtag">Hashtag Seti</SelectItem>
                                    <SelectItem value="template">Taslak Metin</SelectItem>
                                    <SelectItem value="media">Medya Referansı</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="content">İçerik</Label>
                            <Textarea
                                id="content"
                                placeholder="İçeriği buraya yazın..."
                                className="min-h-[150px] font-mono"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>İptal</Button>
                            <Button type="submit" disabled={createIngredientMutation.isPending || updateIngredientMutation.isPending} className="bg-teal-600 hover:bg-teal-700 text-white min-w-[100px]">
                                {createIngredientMutation.isPending || updateIngredientMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingIngredient ? 'Güncelle' : 'Oluştur'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
