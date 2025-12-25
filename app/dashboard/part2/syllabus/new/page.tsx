'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useCreateSyllabus } from '@/app/hooks/use-syllabus';
import { useState } from 'react';

type Lesson = {
  title: string;
  description: string;
  driveLink: string;
};

export default function NewSyllabusPage() {
  const router = useRouter();
  const createSyllabus = useCreateSyllabus();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    driveLink: '',
  });
  const [lessons, setLessons] = useState<Lesson[]>([
    { title: '', description: '', driveLink: '' },
  ]);

  const handleAddLesson = () => {
    setLessons([...lessons, { title: '', description: '', driveLink: '' }]);
  };

  const handleRemoveLesson = (index: number) => {
    if (lessons.length > 1) {
      setLessons(lessons.filter((_, i) => i !== index));
    }
  };

  const handleLessonChange = (index: number, field: 'title' | 'description' | 'driveLink', value: string) => {
    const updatedLessons = [...lessons];
    updatedLessons[index][field] = value;
    setLessons(updatedLessons);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty lessons
    const validLessons = lessons.filter(l => l.title.trim() !== '');

    if (validLessons.length === 0) {
      return;
    }

    // All syllabi are global by default (only admins can create)
    const syllabusData = {
      title: formData.title,
      description: formData.description || undefined,
      driveLink: formData.driveLink || undefined,
      isGlobal: true, // Always true
      lessons: validLessons.map(lesson => ({
        title: lesson.title,
        description: lesson.description || undefined,
        driveLink: lesson.driveLink || undefined,
      })),
    };

    const result = await createSyllabus.mutateAsync(syllabusData);

    if (!result.error && result.data) {
      router.push(`/dashboard/part2/syllabus/${result.data.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/part2/syllabus')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>

        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-cyan-500 to-teal-500"></div>
          <CardHeader>
            <CardTitle className="text-2xl">Yeni Müfredat Oluştur</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4 pb-6 border-b border-gray-200">
                <div className="space-y-2">
                  <Label htmlFor="title">Müfredat Başlığı *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Örn: Karakter Eğitimi Müfredatı - Ocak 2025"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Müfredat hakkında genel bilgiler..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driveLink">Google Drive Linki (Opsiyonel)</Label>
                  <Input
                    id="driveLink"
                    value={formData.driveLink}
                    onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    type="url"
                  />
                </div>
              </div>

              {/* Lessons */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Dersler</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLesson}
                    className="border-cyan-200 text-cyan-600 hover:bg-cyan-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ders Ekle
                  </Button>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {lessons.map((lesson, index) => (
                    <Card key={index} className="border border-gray-200">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-3">
                            <Input
                              value={lesson.title}
                              onChange={(e) => handleLessonChange(index, 'title', e.target.value)}
                              placeholder="Ders başlığı *"
                              required
                            />
                            <Textarea
                              value={lesson.description}
                              onChange={(e) => handleLessonChange(index, 'description', e.target.value)}
                              placeholder="Ders açıklaması (opsiyonel)"
                              rows={2}
                            />
                            <Input
                              value={lesson.driveLink}
                              onChange={(e) => handleLessonChange(index, 'driveLink', e.target.value)}
                              placeholder="Google Drive Linki (opsiyonel)"
                              type="url"
                            />
                          </div>
                          {lessons.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveLesson(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/part2/syllabus')}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={createSyllabus.isPending}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white"
                >
                  {createSyllabus.isPending ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Oluşturuluyor...
                    </>
                  ) : (
                    'Müfredat Oluştur'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
