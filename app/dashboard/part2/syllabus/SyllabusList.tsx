'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Share2, MessageSquare } from 'lucide-react';

type Syllabus = {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  shareToken: string | null;
  createdAt: string;
  lessons: any[];
  feedbackForms: any[];
};

export default function SyllabusList({ syllabi }: { syllabi: Syllabus[] }) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      {syllabi && syllabi.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {syllabi.map((syllabus) => {
            const totalLessons = syllabus.lessons?.length || 0;
            const taughtLessons = syllabus.lessons?.filter((l: any) => l.isTaught).length || 0;
            const feedbackCount = syllabus.feedbackForms?.length || 0;

            return (
              <Card
                key={syllabus.id}
                className="group border-0 shadow-md rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white cursor-pointer"
                onClick={() => router.push(`/dashboard/part2/syllabus/${syllabus.id}`)}
              >
                <div className="h-1.5 bg-gradient-to-r from-cyan-500 to-teal-500"></div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold text-gray-800 mb-1 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                        {syllabus.title}
                      </CardTitle>
                      {syllabus.description && (
                        <CardDescription className="mt-2 line-clamp-2 text-sm">
                          {syllabus.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 mb-4">
                    {syllabus.isPublished && syllabus.shareToken ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                        <Share2 className="h-3 w-3 mr-1" />
                        Paylaşıldı
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                        Taslak
                      </span>
                    )}
                    {feedbackCount > 0 && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {feedbackCount} Geri Bildirim
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Toplam Ders</span>
                      <span className="font-semibold text-gray-800">{totalLessons}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">İşlenen Ders</span>
                      <span className="font-semibold text-green-600">{taughtLessons}</span>
                    </div>
                    {totalLessons > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(taughtLessons / totalLessons) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 pt-3 border-t border-gray-100">
                    Oluşturulma: {formatDate(syllabus.createdAt)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
          <CardContent className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 mb-6">
              <BookOpen className="h-10 w-10 text-cyan-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Henüz müfredat oluşturulmamış</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Öğrencileriniz için bir müfredat oluşturun ve velilerle paylaşın.
            </p>
            <Button
              onClick={() => router.push('/dashboard/part2/syllabus/new')}
              className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white shadow-lg shadow-cyan-500/50"
            >
              <Plus className="h-4 w-4 mr-2" />
              İlk Müfredatı Oluştur
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
