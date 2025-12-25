'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from 'lucide-react';
import { useSyllabus } from '@/app/hooks/use-syllabus';
import { useState, useEffect } from 'react';
import { useToast } from '@/app/hooks/use-toast';

interface LessonForm {
    id?: string;
    title: string;
    description: string;
    driveLink: string;
    orderIndex: number;
}

export default function EditSyllabusPage() {
    const toast = useToast();
    const router = useRouter();
    const params = useParams();
    const syllabusId = params.id as string;
    const { user, loading: authLoading, isAdmin } = useAuth();
    const { data: syllabus, isLoading: syllabusLoading } = useSyllabus(syllabusId);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        driveLink: '',
        isPublished: false,
    });
    const [lessons, setLessons] = useState<LessonForm[]>([]);
    const [saving, setSaving] = useState(false);

    // Load syllabus data into form
    useEffect(() => {
        if (syllabus) {
            setFormData({
                title: syllabus.title || '',
                description: syllabus.description || '',
                driveLink: syllabus.driveLink || '',
                isPublished: syllabus.isPublished || false,
            });

            // Load existing lessons
            if (syllabus.lessons) {
                const loadedLessons = syllabus.lessons.map((lesson: any) => ({
                    id: lesson.id,
                    title: lesson.title || '',
                    description: lesson.description || '',
                    driveLink: lesson.driveLink || '',
                    orderIndex: lesson.orderIndex,
                }));
                setLessons(loadedLessons);
            }
        }
    }, [syllabus]);

    const handleAddLesson = () => {
        const newLesson: LessonForm = {
            title: '',
            description: '',
            driveLink: '',
            orderIndex: lessons.length,
        };
        setLessons([...lessons, newLesson]);
    };

    const handleRemoveLesson = (index: number) => {
        setLessons(lessons.filter((_, i) => i !== index));
    };

    const handleLessonChange = (index: number, field: string, value: string) => {
        const updatedLessons = [...lessons];
        updatedLessons[index] = { ...updatedLessons[index], [field]: value };
        setLessons(updatedLessons);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error('Başlık gereklidir');
            return;
        }

        setSaving(true);
        try {
            // Update syllabus basic info
            const response = await fetch(`/api/syllabus/${syllabusId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    lessons: lessons.map((lesson, index) => ({
                        ...lesson,
                        orderIndex: index,
                    })),
                }),
            });

            if (response.ok) {
                toast.success('Müfredat güncellendi');
                router.push(`/dashboard/part2/syllabus/${syllabusId}`);
            } else {
                toast.error('Müfredat güncellenemedi');
            }
        } catch (error) {
            toast.error('Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || syllabusLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-teal-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mb-4"></div>
                    <p className="text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!user || !isAdmin || !syllabus) {
        router.push('/dashboard/part2/syllabus');
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => router.push(`/dashboard/part2/syllabus/${syllabusId}`)}
                    className="mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Geri Dön
                </Button>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info Card */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-2xl">Temel Bilgiler</CardTitle>
                            <CardDescription>
                                Müfredat başlığı, açıklaması ve genel ayarları
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Başlık *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Müfredat başlığı"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Açıklama</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Müfredat açıklaması (opsiyonel)"
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="driveLink">Google Drive Linki</Label>
                                <Input
                                    id="driveLink"
                                    type="url"
                                    value={formData.driveLink}
                                    onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                                    placeholder="https://drive.google.com/..."
                                />
                                <p className="text-xs text-gray-500">Müfredatın genel klasör veya doküman linki (opsiyonel)</p>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                                <div className="space-y-0.5">
                                    <Label htmlFor="isPublished" className="text-base">
                                        Yayında
                                    </Label>
                                    <p className="text-sm text-gray-500">
                                        Müfredatı yayınlayarak velilerle paylaşabilirsiniz
                                    </p>
                                </div>
                                <Switch
                                    id="isPublished"
                                    checked={formData.isPublished}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Lessons Card */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl">Dersler</CardTitle>
                                    <CardDescription>
                                        Müfredattaki dersleri yönetin
                                    </CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    onClick={handleAddLesson}
                                    variant="outline"
                                    size="sm"
                                    className="border-cyan-200 text-cyan-600 hover:bg-cyan-50"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Ders Ekle
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {lessons.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>Henüz ders eklenmemiş</p>
                                    <p className="text-sm mt-1">Yukarıdaki "Ders Ekle" butonuna tıklayarak ders ekleyin</p>
                                </div>
                            ) : (
                                lessons.map((lesson, index) => (
                                    <Card key={index} className="border border-gray-200">
                                        <CardContent className="pt-4">
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <GripVertical className="h-5 w-5 text-gray-400" />
                                                        <span className="text-sm font-semibold text-gray-600">Ders {index + 1}</span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        onClick={() => handleRemoveLesson(index)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Ders Başlığı *</Label>
                                                    <Input
                                                        value={lesson.title}
                                                        onChange={(e) => handleLessonChange(index, 'title', e.target.value)}
                                                        placeholder="Ders başlığı"
                                                        required
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Açıklama</Label>
                                                    <Textarea
                                                        value={lesson.description}
                                                        onChange={(e) => handleLessonChange(index, 'description', e.target.value)}
                                                        placeholder="Ders açıklaması (opsiyonel)"
                                                        rows={2}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Google Drive Linki</Label>
                                                    <Input
                                                        type="url"
                                                        value={lesson.driveLink}
                                                        onChange={(e) => handleLessonChange(index, 'driveLink', e.target.value)}
                                                        placeholder="https://drive.google.com/..."
                                                    />
                                                    <p className="text-xs text-gray-500">Ders materyali veya doküman linki (opsiyonel)</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex gap-3 sticky bottom-6 bg-white border-0 shadow-lg rounded-lg p-4">
                        <Button
                            type="submit"
                            disabled={saving}
                            className="flex-1 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push(`/dashboard/part2/syllabus/${syllabusId}`)}
                            className="flex-1"
                        >
                            İptal
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
