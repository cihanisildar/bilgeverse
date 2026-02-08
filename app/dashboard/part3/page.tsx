import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, UserCheck, BarChart3, ArrowRight } from 'lucide-react';
import { PARTS } from '@/app/lib/parts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PartDocuments from '@/app/components/PartDocuments';

export default async function Part3Page() {
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
