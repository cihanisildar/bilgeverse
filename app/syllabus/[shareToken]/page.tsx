'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, CheckCircle2, Star, ThumbsUp } from 'lucide-react';
import { useSyllabusByShareToken, useSubmitParentFeedback } from '@/app/hooks/use-syllabus';
import { useState } from 'react';

type FeedbackRating = 'VERY_POOR' | 'POOR' | 'AVERAGE' | 'GOOD' | 'EXCELLENT' | null;

export default function PublicSyllabusPage() {
  const params = useParams();
  const shareToken = params.shareToken as string;
  const { data: syllabus, isLoading } = useSyllabusByShareToken(shareToken);
  const submitFeedback = useSubmitParentFeedback();
  const [formData, setFormData] = useState({
    parentName: '',
    parentEmail: '',
    overallRating: null as FeedbackRating,
    contentQuality: null as FeedbackRating,
    effectiveness: null as FeedbackRating,
    engagement: null as FeedbackRating,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleRatingClick = (field: string, rating: FeedbackRating) => {
    setFormData({ ...formData, [field]: rating });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await submitFeedback.mutateAsync({
      syllabusId: syllabus?.id || '',
      parentName: formData.parentName || undefined,
      parentEmail: formData.parentEmail || undefined,
      overallRating: formData.overallRating || undefined,
      contentQuality: formData.contentQuality || undefined,
      effectiveness: formData.effectiveness || undefined,
      engagement: formData.engagement || undefined,
    });

    if (!result.error) {
      setSubmitted(true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRatingValue = (rating: FeedbackRating): number => {
    const values: { [key: string]: number } = {
      VERY_POOR: 1,
      POOR: 2,
      AVERAGE: 3,
      GOOD: 4,
      EXCELLENT: 5,
    };
    return rating ? values[rating] : 0;
  };

  const RatingSelector = ({ value, onChange, label }: { value: FeedbackRating; onChange: (rating: FeedbackRating) => void; label: string }) => {
    const ratings: FeedbackRating[] = ['VERY_POOR', 'POOR', 'AVERAGE', 'GOOD', 'EXCELLENT'];
    const currentValue = getRatingValue(value);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700">{label}</Label>
          {currentValue > 0 && (
            <span className="text-xs text-cyan-600 font-medium">
              {currentValue}/5
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(ratings[star - 1])}
              className="p-1 transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className={`h-8 w-8 transition-colors ${currentValue >= star
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 hover:text-gray-400'
                  }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-teal-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!syllabus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-teal-50">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Müfredat Bulunamadı</h2>
            <p className="text-sm text-gray-600">
              Bu müfredat bulunamadı veya paylaşılmamış. Lütfen doğru linki kullandığınızdan emin olun.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-teal-50 p-6">
        <Card className="max-w-md border-0 shadow-xl">
          <CardContent className="text-center py-12">
            <ThumbsUp className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Teşekkür Ederiz!</h2>
            <p className="text-gray-600">
              Geri bildiriminiz başarıyla kaydedildi. Değerli görüşleriniz için teşekkür ederiz.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalLessons = syllabus.lessons?.length || 0;
  const taughtLessons = syllabus.lessons?.filter((l: any) => l.isTaught).length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 mb-4">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{syllabus.title}</h1>
          {syllabus.description && (
            <p className="text-gray-600 max-w-2xl mx-auto">{syllabus.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Oluşturan: {syllabus.createdBy.firstName} {syllabus.createdBy.lastName}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lessons */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Müfredat İçeriği</CardTitle>
                <CardDescription>
                  Toplam {totalLessons} ders • {taughtLessons} ders işlendi
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">İlerleme</span>
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
                </div>

                {/* Lessons List */}
                {syllabus.lessons && syllabus.lessons.length > 0 ? (
                  <div className="space-y-3">
                    {syllabus.lessons.map((lesson: any, index: number) => (
                      <div
                        key={lesson.id}
                        className={`p-4 rounded-lg border ${lesson.isTaught ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {lesson.isTaught ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-semibold ${lesson.isTaught ? 'text-green-800' : 'text-gray-800'}`}>
                              {index + 1}. {lesson.title}
                            </h3>
                            {lesson.description && (
                              <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                            )}
                            {lesson.isTaught && lesson.taughtDate && (
                              <p className="text-xs text-green-600 mt-2">
                                İşlenme: {formatDate(lesson.taughtDate)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Henüz ders eklenmemiş</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Feedback Form */}
          <div>
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Geri Bildirim</CardTitle>
                <CardDescription>Görüşlerinizi bizimle paylaşın</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentName">Adınız (Opsiyonel)</Label>
                    <Input
                      id="parentName"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      placeholder="İsminiz"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentEmail">E-posta (Opsiyonel)</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                      placeholder="ornek@email.com"
                    />
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <RatingSelector
                      value={formData.overallRating}
                      onChange={(rating) => handleRatingClick('overallRating', rating)}
                      label="Genel Memnuniyet"
                    />

                    <RatingSelector
                      value={formData.contentQuality}
                      onChange={(rating) => handleRatingClick('contentQuality', rating)}
                      label="İçerik Kalitesi"
                    />

                    <RatingSelector
                      value={formData.effectiveness}
                      onChange={(rating) => handleRatingClick('effectiveness', rating)}
                      label="Etkililik"
                    />

                    <RatingSelector
                      value={formData.engagement}
                      onChange={(rating) => handleRatingClick('engagement', rating)}
                      label="Öğrenci Katılımı"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitFeedback.isPending}
                    className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white"
                  >
                    {submitFeedback.isPending ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Gönderiliyor...
                      </>
                    ) : (
                      'Geri Bildirim Gönder'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
