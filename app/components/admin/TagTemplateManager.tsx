'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Activity,
    AlertTriangle,
    Crown,
    Edit,
    GraduationCap,
    HandHelping,
    Heart,
    Loader2,
    Network,
    Plus,
    Settings,
    Star,
    Tag,
    Trash2,
    TrendingUp,
    UserMinus,
    Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TagTemplate {
    id: string;
    name: string;
    color: string;
    description?: string;
    icon?: string;
    isActive: boolean;
    createdAt: string;
    createdBy: {
        firstName?: string;
        lastName?: string;
        username: string;
    };
    _count: {
        studentTags: number;
    };
}

interface TagTemplateManagerProps {
    embedded?: boolean;
}

const iconOptions = [
    { value: 'crown', label: 'Taç (Lider)', icon: <Crown className="h-4 w-4" /> },
    { value: 'user-minus', label: 'İzole', icon: <UserMinus className="h-4 w-4" /> },
    { value: 'activity', label: 'Aktivite', icon: <Activity className="h-4 w-4" /> },
    { value: 'heart-handshake', label: 'Yardımsever', icon: <Heart className="h-4 w-4" /> },
    { value: 'star', label: 'Yıldız', icon: <Star className="h-4 w-4" /> },
    { value: 'network', label: 'Ağ (Sosyal)', icon: <Network className="h-4 w-4" /> },
    { value: 'alert-triangle', label: 'Dikkat', icon: <AlertTriangle className="h-4 w-4" /> },
    { value: 'graduation-cap', label: 'Mentor', icon: <GraduationCap className="h-4 w-4" /> },
    { value: 'trending-up', label: 'Gelişen', icon: <TrendingUp className="h-4 w-4" /> },
    { value: 'hand-helping', label: 'Destek', icon: <HandHelping className="h-4 w-4" /> },
];

const iconMap: Record<string, React.ReactNode> = {
    'crown': <Crown className="h-4 w-4" />,
    'user-minus': <UserMinus className="h-4 w-4" />,
    'activity': <Activity className="h-4 w-4" />,
    'heart-handshake': <Heart className="h-4 w-4" />,
    'star': <Star className="h-4 w-4" />,
    'network': <Network className="h-4 w-4" />,
    'alert-triangle': <AlertTriangle className="h-4 w-4" />,
    'graduation-cap': <GraduationCap className="h-4 w-4" />,
    'trending-up': <TrendingUp className="h-4 w-4" />,
    'hand-helping': <HandHelping className="h-4 w-4" />,
};

const colorPresets = [
    '#f59e0b', // amber
    '#ef4444', // red
    '#22c55e', // green
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#f97316', // orange
    '#ec4899', // pink
    '#14b8a6', // teal
    '#a855f7', // purple
];

export default function TagTemplateManager({ embedded = false }: TagTemplateManagerProps) {
    const { toast } = useToast();
    const [templates, setTemplates] = useState<TagTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<TagTemplate | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        color: '#6366f1',
        description: '',
        icon: '',
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/tag-templates?includeInactive=true');
            if (response.ok) {
                const data = await response.json();
                setTemplates(data.templates || []);
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            color: '#6366f1',
            description: '',
            icon: '',
        });
        setEditingTemplate(null);
    };

    const openCreateDialog = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const openEditDialog = (template: TagTemplate) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            color: template.color,
            description: template.description || '',
            icon: template.icon || '',
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast({
                title: 'Hata',
                description: 'Etiket adı gereklidir',
                variant: 'destructive',
            });
            return;
        }

        try {
            setSaving(true);
            const url = editingTemplate
                ? `/api/tag-templates/${editingTemplate.id}`
                : '/api/tag-templates';
            const method = editingTemplate ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    color: formData.color,
                    description: formData.description.trim() || null,
                    icon: formData.icon || null,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'İşlem başarısız');
            }

            toast({
                title: 'Başarılı',
                description: editingTemplate ? 'Şablon güncellendi' : 'Şablon oluşturuldu',
            });

            setIsDialogOpen(false);
            resetForm();
            fetchTemplates();
        } catch (error: any) {
            toast({
                title: 'Hata',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (templateId: string) => {
        try {
            const response = await fetch(`/api/tag-templates/${templateId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Silme başarısız');
            }

            const result = await response.json();
            toast({
                title: 'Başarılı',
                description: result.deactivated
                    ? 'Şablon kullanımda olduğu için pasif duruma alındı'
                    : 'Şablon silindi',
            });

            fetchTemplates();
        } catch (error: any) {
            toast({
                title: 'Hata',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const toggleActive = async (template: TagTemplate) => {
        try {
            const response = await fetch(`/api/tag-templates/${template.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !template.isActive }),
            });

            if (!response.ok) {
                throw new Error('Güncelleme başarısız');
            }

            toast({
                title: 'Başarılı',
                description: template.isActive ? 'Şablon pasif yapıldı' : 'Şablon aktif yapıldı',
            });

            fetchTemplates();
        } catch (error: any) {
            toast({
                title: 'Hata',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
        );
    }

    const activeTemplates = templates.filter((t) => t.isActive);
    const inactiveTemplates = templates.filter((t) => !t.isActive);

    // Shared form content for dialogs
    const formContent = (
        <div className="space-y-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Etiket Adı *</Label>
                <Input
                    id="name"
                    placeholder="Örn: Grup Lideri"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
            </div>

            <div className="grid gap-2">
                <Label>Renk</Label>
                <div className="flex gap-2 flex-wrap">
                    {colorPresets.map((color) => (
                        <button
                            key={color}
                            onClick={() => setFormData({ ...formData, color })}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color
                                ? 'border-gray-800 scale-110'
                                : 'border-transparent hover:scale-105'
                                }`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                    <Input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-8 h-8 p-0 border-0 cursor-pointer"
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>İkon</Label>
                <Select
                    value={formData.icon}
                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="İkon seçin (opsiyonel)" />
                    </SelectTrigger>
                    <SelectContent>
                        {iconOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                    {option.icon}
                                    <span>{option.label}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                    id="description"
                    placeholder="Bu etiketin ne anlama geldiğini açıklayın..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                />
            </div>

            {/* Preview */}
            {formData.name && (
                <div className="pt-2 border-t">
                    <Label className="text-xs text-gray-500 mb-2 block">Önizleme</Label>
                    <Badge
                        className="text-sm px-3 py-1"
                        style={{
                            backgroundColor: `${formData.color}20`,
                            color: formData.color,
                            borderColor: `${formData.color}40`,
                        }}
                    >
                        {formData.icon && iconMap[formData.icon] ? (
                            <span className="mr-1.5">{iconMap[formData.icon]}</span>
                        ) : (
                            <Tag className="h-3 w-3 mr-1.5" />
                        )}
                        {formData.name}
                    </Badge>
                </div>
            )}
        </div>
    );

    const dialogFooter = (
        <DialogFooter>
            <Button
                variant="outline"
                onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                }}
            >
                İptal
            </Button>
            <Button
                onClick={handleSubmit}
                disabled={saving || !formData.name.trim()}
                className="bg-gradient-to-r from-violet-600 to-purple-600 text-white"
            >
                {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : editingTemplate ? (
                    <Edit className="h-4 w-4 mr-2" />
                ) : (
                    <Plus className="h-4 w-4 mr-2" />
                )}
                {editingTemplate ? 'Güncelle' : 'Oluştur'}
            </Button>
        </DialogFooter>
    );

    return (
        <div className="space-y-6">
            {/* Header with Yeni Şablon button */}
            <div className="flex justify-end">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={openCreateDialog}
                            className="bg-gradient-to-r from-violet-600 to-purple-600 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Yeni Şablon
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingTemplate ? 'Şablon Düzenle' : 'Yeni Etiket Şablonu'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingTemplate
                                    ? 'Etiket şablonunu güncelleyin'
                                    : 'Öğretmenlerin kullanabileceği yeni bir etiket şablonu oluşturun'}
                            </DialogDescription>
                        </DialogHeader>
                        {formContent}
                        {dialogFooter}
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats - Only show when not embedded */}
            {!embedded && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-0 shadow-md bg-gradient-to-br from-violet-50 to-purple-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-violet-100 p-2">
                                    <Tag className="h-5 w-5 text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Toplam Şablon</p>
                                    <p className="text-2xl font-bold text-violet-600">{templates.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-green-100 p-2">
                                    <Tag className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Aktif Şablon</p>
                                    <p className="text-2xl font-bold text-green-600">{activeTemplates.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-cyan-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-blue-100 p-2">
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Toplam Kullanım</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {templates.reduce((sum, t) => sum + t._count.studentTags, 0)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Active Templates */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg">Aktif Şablonlar</CardTitle>
                    <CardDescription>Öğretmenlerin kullanabileceği etiketler</CardDescription>
                </CardHeader>
                <CardContent>
                    {activeTemplates.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Tag className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p>Henüz aktif şablon yok</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    className="p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <Badge
                                            className="text-sm"
                                            style={{
                                                backgroundColor: `${template.color}20`,
                                                color: template.color,
                                                borderColor: `${template.color}40`,
                                            }}
                                        >
                                            {template.icon && iconMap[template.icon] ? (
                                                <span className="mr-1.5">{iconMap[template.icon]}</span>
                                            ) : (
                                                <Tag className="h-3 w-3 mr-1.5" />
                                            )}
                                            {template.name}
                                        </Badge>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => openEditDialog(template)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Şablonu Sil</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            &quot;{template.name}&quot; şablonunu silmek istediğinize emin misiniz?
                                                            {template._count.studentTags > 0 && (
                                                                <span className="block mt-2 text-amber-600">
                                                                    Bu şablon {template._count.studentTags} öğrencide kullanılıyor ve pasif duruma alınacak.
                                                                </span>
                                                            )}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(template.id)}
                                                            className="bg-red-500 hover:bg-red-600"
                                                        >
                                                            Sil
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                    {template.description && (
                                        <p className="text-xs text-gray-500 mb-2">{template.description}</p>
                                    )}
                                    <div className="text-xs text-gray-400">
                                        {template._count.studentTags} öğrencide kullanılıyor
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Inactive Templates */}
            {inactiveTemplates.length > 0 && (
                <Card className="border-0 shadow-lg border-t-2 border-t-gray-200">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-500">Pasif Şablonlar</CardTitle>
                        <CardDescription>Öğretmenler tarafından kullanılamayan şablonlar</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {inactiveTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    className="p-4 rounded-lg border border-gray-200 bg-gray-50 opacity-75"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <Badge variant="outline" className="text-sm text-gray-500">
                                            {template.icon && iconMap[template.icon] ? (
                                                <span className="mr-1.5 opacity-50">{iconMap[template.icon]}</span>
                                            ) : (
                                                <Tag className="h-3 w-3 mr-1.5 opacity-50" />
                                            )}
                                            {template.name}
                                        </Badge>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => toggleActive(template)}
                                        >
                                            Aktif Yap
                                        </Button>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {template._count.studentTags} öğrencide kullanılıyor
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
