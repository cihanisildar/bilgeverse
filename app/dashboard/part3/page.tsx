import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, UserCheck, BarChart3, ArrowRight, GraduationCap, HandCoins, UserSearch, BookOpen, ClipboardCheck } from 'lucide-react';
import { PARTS } from '@/app/lib/parts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PartDocuments from '@/app/components/PartDocuments';
import { requireAuth } from '@/app/lib/auth-utils';

export default async function Part3Page() {
  // Oturum + kurum paketi kontrolü. Bu çağrı olmadan sayfa build sırasında
  // statik üretilmeye çalışılıyor ve içindeki PartDocuments kurum bağlamı
  // bulamadığı için boş dönüyordu.
  await requireAuth({ partId: 3 });

  const part = PARTS.find(p => p.id === 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6 hover:bg-gray-100 transition-all duration-200">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ana Sayfaya Dön
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
              {part?.name}
            </span>
          </h1>
          <p className="text-gray-600">{part?.description}</p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Tutor Promotions Card */}
          <Link href="/dashboard/part3/tutor-promotions" className="block">
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                    <UserCheck className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Öğretmen Terfileri</CardTitle>
                    <CardDescription className="mt-1">
                      Öğrenci ve asistanları öğretmen olarak terfi ettirin
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-medium text-gray-600">
                  Terfi Yönetimine Git
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* NOT: "Değerler Halkası Grupları" kartı buradan kaldırıldı — sayfa
              part2'ye (Değerler Halkası) taşındı ve oradan erişiliyor. */}

          {/* Toplu Yoklama / Rehber Katılımı Card */}
          <Link href="/dashboard/part3/tutor-participation" className="block">
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-emerald-50 to-green-50">
              <div className="h-2 bg-gradient-to-r from-emerald-500 to-green-500"></div>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <ClipboardCheck className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Toplu Yoklama Özeti</CardTitle>
                    <CardDescription className="mt-1">
                      Rehberlerin grup haftalık katılım performansı (renk kodlu)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-medium text-gray-600">
                  Yoklama Özetine Git
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Reports Dashboard Card */}
          <Link href="/dashboard/part3/reports" className="block">
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-cyan-50 to-teal-50">
              <div className="h-2 bg-gradient-to-r from-cyan-500 to-teal-500"></div>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-cyan-100 text-cyan-600">
                    <BarChart3 className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Raporlar</CardTitle>
                    <CardDescription className="mt-1">
                      Öğretmen ve sınıf performans raporları
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-medium text-gray-600">
                  Raporlara Git
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Graduated Students Card */}
          <Link href="/dashboard/part3/graduates" className="block">
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-green-50 to-teal-50">
              <div className="h-2 bg-gradient-to-r from-green-500 to-teal-500"></div>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Mezun Öğrenciler</CardTitle>
                    <CardDescription className="mt-1">
                      Mezun öğrencilerin bilgilerini kaydedin ve takip edin
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-medium text-gray-600">
                  Mezunlara Git
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Scholarship Students Card */}
          <Link href="/dashboard/part3/scholarships" className="block">
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-amber-50 to-orange-50">
              <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500"></div>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <HandCoins className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Burs Alan Öğrenciler</CardTitle>
                    <CardDescription className="mt-1">
                      Burs alan öğrencilerin listesini yönetin
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-medium text-gray-600">
                  Burslulara Git
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Tutor Candidates Card */}
          <Link href="/dashboard/part3/tutor-candidates" className="block">
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-indigo-50 to-blue-50">
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <UserSearch className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Rehber Adayları</CardTitle>
                    <CardDescription className="mt-1">
                      Rehber olarak düşünülen kişiler ve alınan kararlar
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-medium text-gray-600">
                  Adaylara Git
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Tutor Training Card */}
          <Link href="/dashboard/part3/tutor-training" className="block">
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-cyan-50 to-sky-50">
              <div className="h-2 bg-gradient-to-r from-cyan-500 to-sky-500"></div>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-cyan-100 text-cyan-600">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Rehber Eğitim Takibi</CardTitle>
                    <CardDescription className="mt-1">
                      Hangi rehberin hangi eğitimi aldığını takip edin
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-medium text-gray-600">
                  Eğitim Takibine Git
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Haftalık Raporlar — Bilgeverse (part7) altındaydı, buraya taşındı */}
          <Link href="/dashboard/part3/weekly-reports" className="block">
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-violet-50 to-purple-50">
              <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-500"></div>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-violet-100 text-violet-600">
                    <ClipboardCheck className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Haftalık Raporlar</CardTitle>
                    <CardDescription className="mt-1">
                      Rehberlerin haftalık ilerleme raporlarını inceleyin ve değerlendirin
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-medium text-gray-600">
                  Haftalık Raporlara Git
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Belgeler</h2>
              <p className="text-gray-600">Bu bölüm için paylaşılan belgeler</p>
            </div>
            <Link href="/dashboard/pdfs">
              <Button variant="outline" className="border-green-200 text-green-600 hover:bg-green-50">
                <FileText className="h-4 w-4 mr-2" />
                Tüm Belgeleri Görüntüle
              </Button>
            </Link>
          </div>
          <PartDocuments partId={3} gradientFrom="from-green-600" gradientTo="to-emerald-600" />
        </div>
      </div>
    </div>
  );
}
