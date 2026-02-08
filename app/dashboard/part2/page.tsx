import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Calendar, BookOpen, ArrowRight, PartyPopper, Network } from 'lucide-react';
import { PARTS } from '@/app/lib/parts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PartDocuments from '@/app/components/PartDocuments';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

export default async function Part2Page() {
  const session = await getServerSession(authOptions);

  // Note: Session is guaranteed by Part2Layout
  const part = PARTS.find(p => p.id === 2);
  const isAdmin = session?.user?.role === 'ADMIN';
  const isTutor = session?.user?.role === 'TUTOR';
  const isAsistan = session?.user?.role === 'ASISTAN';
  const canManage = isAdmin || isTutor || isAsistan;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6 hover:bg-gray-100 transition-all duration-200">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ana Sayfaya Dön
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
              {part?.name}
            </span>
          </h1>
          <p className="text-gray-600">{part?.description}</p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Weekly Attendance Card */}
          <Link href="/dashboard/part2/attendance" className="block">
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-blue-50 to-cyan-50">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Calendar className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Haftalık Yoklama</CardTitle>
                    <CardDescription className="mt-1">
                      QR kod ile öğrenci devam takibi yapın
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-medium text-gray-600">
                  {canManage ? 'Yoklama Yönetimine Git' : 'Yoklamalara Git'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Admin Attendance Overview Card */}
          {isAdmin && (
            <Link href="/dashboard/part2/overview" className="block">
              <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">
                      <PartyPopper className="h-8 w-8" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Toplu Yoklama Özeti</CardTitle>
                      <CardDescription className="mt-1">
                        Tüm sınıfların haftalık yoklama durumu
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm font-medium text-gray-600">
                    Özet Sayfasına Git
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Syllabus Management Card */}
          {canManage && (
            <Link href="/dashboard/part2/syllabus" className="block">
              <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-cyan-50 to-teal-50">
                <div className="h-2 bg-gradient-to-r from-cyan-500 to-teal-500"></div>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-cyan-100 text-cyan-600">
                      <BookOpen className="h-8 w-8" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Müfredat Yönetimi</CardTitle>
                      <CardDescription className="mt-1">
                        Müfredat oluşturun ve velilerle paylaşın
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm font-medium text-gray-600">
                    Müfredat Yönetimine Git
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Sociometric Analysis Card */}
          {(isAdmin || isTutor) && (
            <Link href="/dashboard/part2/sociometric" className="block">
              <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-violet-50 to-purple-50">
                <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-500"></div>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-violet-100 text-violet-600">
                      <Network className="h-8 w-8" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Sosyometrik Analiz</CardTitle>
                      <CardDescription className="mt-1">
                        Sınıf dinamikleri ve öğrenci etkileşim analizi
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm font-medium text-gray-600">
                    Analiz Sayfasına Git
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        {/* Documents Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Belgeler</h2>
              <p className="text-gray-600">Bu bölüm için paylaşılan belgeler</p>
            </div>
            <Link href="/dashboard/pdfs">
              <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                <FileText className="h-4 w-4 mr-2" />
                Tüm Belgeleri Görüntüle
              </Button>
            </Link>
          </div>
          <PartDocuments partId={2} gradientFrom="from-blue-600" gradientTo="to-cyan-600" />
        </div>
      </div>
    </div>
  );
}
