import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText } from 'lucide-react';
import { PARTS } from '@/app/lib/parts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import PartDocuments from '@/app/components/PartDocuments';

export default async function Part5Page() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const part = PARTS.find(p => p.id === 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6 hover:bg-gray-100 transition-all duration-200">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ana Sayfaya Dön
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-pink-600">
              {part?.name}
            </span>
          </h1>
          <p className="text-gray-600">{part?.description}</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Belgeler</h2>
              <p className="text-gray-600">Bu bölüm için paylaşılan belgeler</p>
            </div>
            <Link href="/dashboard/pdfs">
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                <FileText className="h-4 w-4 mr-2" />
                Tüm Belgeleri Görüntüle
              </Button>
            </Link>
          </div>
          <PartDocuments partId={5} gradientFrom="from-red-600" gradientTo="to-pink-600" />
        </div>

        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-red-500 to-pink-500"></div>
          <CardHeader>
            <CardTitle className="text-2xl">Geliştirme Aşamasında</CardTitle>
            <CardDescription>Bu bölüm yakında kullanıma açılacaktır</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-pink-100 mb-6">
                <FileText className="h-10 w-10 text-red-600" />
              </div>
              <p className="text-gray-600 mb-4">Koçluk ve danışmanlık yönetim sistemi üzerinde çalışıyoruz.</p>
              <p className="text-sm text-gray-500">Bu bölüm tamamlandığında seans planlaması, danışan takibi ve ilerleme raporları özellikleri sunacaktır.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
