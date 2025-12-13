'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Share2, CheckCircle2, Circle, Plus, Copy, MessageSquare, Star } from 'lucide-react';
import { useSyllabus, useUpdateSyllabusLesson, useAddLessonToSyllabus, useGenerateShareToken } from '@/app/hooks/use-syllabus';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function SyllabusDetailPage() {
  const router = useRouter();
  const params = useParams();
  const syllabusId = params.id as string;
  const { user, loading: authLoading, isAdmin, isTutor } = useAuth();
  const { data: syllabus, isLoading: syllabusLoading } = useSyllabus(syllabusId);
  const updateLesson = useUpdateSyllabusLesson();
  const addLesson = useAddLessonToSyllabus();
  const generateShareToken = useGenerateShareToken();
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [lessonNotes, setLessonNotes] = useState<{ [key: string]: string }>({});
  const [newLesson, setNewLesson] = useState({ title: '', description: '' });
  const [showAddLesson, setShowAddLesson] = useState(false);

  const canManage = isAdmin || isTutor;

  // Sync lesson notes with state when syllabus data loads
  useEffect(() => {
    if (syllabus?.lessons) {
      const notes: { [key: string]: string } = {};
      syllabus.lessons.forEach((lesson: any) => {
        notes[lesson.id] = lesson.notes || '';
      });
      setLessonNotes(notes);
    }
  }, [syllabus]);

  const handleToggleTaught = async (lessonId: string, currentStatus: boolean) => {
    await updateLesson.mutateAsync({
      lessonId,
      data: { isTaught: !currentStatus },
    });
  };

  const handleUpdateNotes = async (lessonId: string) => {
    await updateLesson.mutateAsync({
      lessonId,
      data: { notes: lessonNotes[lessonId] },
    });
    setEditingLesson(null);
  };

  const handleAddLesson = async () => {
    if (!newLesson.title.trim()) return;

    const result = await addLesson.mutateAsync({
      syllabusId,
      data: newLesson,
    });

    if (!result.error) {
      setNewLesson({ title: '', description: '' });
      setShowAddLesson(false);
    }
  };

  const handleGenerateShareLink = async () => {
    const result = await generateShareToken.mutateAsync(syllabusId);
    if (!result.error && result.data) {
      navigator.clipboard.writeText(result.data.shareUrl || '');
      toast.success('Paylaşım linki kopyalandı!');
    }
  };

  const getRatingLabel = (rating: string) => {
    const labels: { [key: string]: string } = {
      VERY_POOR: 'Çok Kötü',
      POOR: 'Kötü',
      AVERAGE: 'Orta',
      GOOD: 'İyi',
      EXCELLENT: 'Mükemmel',
    };
    return labels[rating] || rating;
  };

  const getRatingStars = (rating: string) => {
    const stars: { [key: string]: number } = {
      VERY_POOR: 1,
      POOR: 2,
      AVERAGE: 3,
      GOOD: 4,
      EXCELLENT: 5,
    };
    return stars[rating] || 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  if (!user || !canManage || !syllabus) {
    return null;
  }

  const totalLessons = syllabus.lessons?.length || 0;
  const taughtLessons = syllabus.lessons?.filter((l: any) => l.isTaught).length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/part2/syllabus')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Müfredatlara Dön
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{syllabus.title}</h1>
              {syllabus.description && (
                <p className="text-gray-600">{syllabus.description}</p>
              )}
            </div>
            <Button
              onClick={handleGenerateShareLink}
              disabled={generateShareToken.isPending}
              className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white"
            >
              {syllabus.isPublished && syllabus.shareToken ? (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Linki Kopyala
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Paylaşım Linki Oluştur
                </>
              )}
            </Button>
          </div>

          {/* Progress */}
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  İlerleme: {taughtLessons} / {totalLessons} Ders
                </span>
                <span className="text-sm font-semibold text-cyan-600">
                  {totalLessons > 0 ? Math.round((taughtLessons / totalLessons) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${totalLessons > 0 ? (taughtLessons / totalLessons) * 100 : 0}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lessons */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Dersler</h2>
              <Button
                onClick={() => setShowAddLesson(!showAddLesson)}
                variant="outline"
                size="sm"
                className="border-cyan-200 text-cyan-600 hover:bg-cyan-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ders Ekle
              </Button>
            </div>

            {/* Add New Lesson */}
            {showAddLesson && (
              <Card className="border-2 border-cyan-200">
                <CardContent className="pt-4 space-y-3">
                  <Input
                    value={newLesson.title}
                    onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                    placeholder="Ders başlığı *"
                  />
                  <Textarea
                    value={newLesson.description}
                    onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                    placeholder="Ders açıklaması (opsiyonel)"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddLesson}
                      disabled={!newLesson.title.trim() || addLesson.isPending}
                      className="flex-1 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white"
                    >
                      Ekle
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAddLesson(false);
                        setNewLesson({ title: '', description: '' });
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      İptal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lessons List */}
            {syllabus.lessons && syllabus.lessons.length > 0 ? (
              <div className="space-y-3">
                {syllabus.lessons.map((lesson: any, index: number) => (
                  <Card key={lesson.id} className={`border-0 shadow-md ${lesson.isTaught ? 'bg-green-50' : 'bg-white'}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => handleToggleTaught(lesson.id, lesson.isTaught)}
                            className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                          >
                            {lesson.isTaught ? (
                              <CheckCircle2 className="h-6 w-6 text-green-600" />
                            ) : (
                              <Circle className="h-6 w-6 text-gray-400 hover:text-cyan-600" />
                            )}
                          </button>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className={`font-semibold ${lesson.isTaught ? 'text-green-800 line-through' : 'text-gray-800'}`}>
                                {index + 1}. {lesson.title}
                              </h3>
                              {lesson.description && (
                                <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                              )}
                              {lesson.taughtDate && (
                                <p className="text-xs text-green-600 mt-2">
                                  İşlenme Tarihi: {formatDate(lesson.taughtDate)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="mt-3">
                            {editingLesson === lesson.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={lessonNotes[lesson.id] || ''}
                                  onChange={(e) => setLessonNotes({ ...lessonNotes, [lesson.id]: e.target.value })}
                                  placeholder="Ders notları..."
                                  rows={3}
                                  className="text-sm"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleUpdateNotes(lesson.id)}
                                    size="sm"
                                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                                  >
                                    Kaydet
                                  </Button>
                                  <Button
                                    onClick={() => setEditingLesson(null)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    İptal
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                {lesson.notes ? (
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{lesson.notes}</p>
                                    <Button
                                      onClick={() => setEditingLesson(lesson.id)}
                                      size="sm"
                                      variant="ghost"
                                      className="mt-2 text-cyan-600 hover:text-cyan-700"
                                    >
                                      Notu Düzenle
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    onClick={() => setEditingLesson(lesson.id)}
                                    size="sm"
                                    variant="ghost"
                                    className="text-cyan-600 hover:text-cyan-700"
                                  >
                                    Not Ekle
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">Henüz ders eklenmemiş</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Feedback */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Veli Geri Bildirimleri</h2>
            {syllabus.feedbackForms && syllabus.feedbackForms.length > 0 ? (
              <div className="space-y-3">
                {syllabus.feedbackForms.map((feedback: any) => (
                  <Card key={feedback.id} className="border-0 shadow-md">
                    <CardContent className="pt-4">
                      {feedback.parentName && (
                        <p className="font-semibold text-gray-800 mb-2">{feedback.parentName}</p>
                      )}
                      <div className="space-y-2 text-sm">
                        {feedback.overallRating && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Genel Memnuniyet:</span>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < getRatingStars(feedback.overallRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {feedback.contentQuality && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">İçerik Kalitesi:</span>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < getRatingStars(feedback.contentQuality) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {feedback.effectiveness && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Etkililik:</span>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < getRatingStars(feedback.effectiveness) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {feedback.engagement && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Öğrenci Katılımı:</span>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < getRatingStars(feedback.engagement) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-3">{formatDate(feedback.createdAt)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-md">
                <CardContent className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 text-sm">Henüz geri bildirim yok</p>
                  {syllabus.isPublished && syllabus.shareToken && (
                    <p className="text-xs text-gray-400 mt-2">
                      Paylaşım linkini velilerle paylaşın
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
