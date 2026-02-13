import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Trophy, Users } from 'lucide-react';
import { PARTS } from '@/app/lib/parts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PartDocuments from '@/app/components/PartDocuments';
import DashboardContainer from './DashboardContainer';

export default async function Part9Page() {
  // Session check is handled by Part9Layout

  const part = PARTS.find(p => p.id === 9);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <Link href="/dashboard">
              <Button variant="ghost" className="mb-4 -ml-2 text-gray-500 hover:text-gray-800">
                <ArrowLeft className="h-4 w-4 mr-2" /> Panoya Dön
              </Button>
            </Link>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              {part?.name}
            </h1>
            <p className="text-gray-500 mt-1">{part?.description}</p>
          </div>

          <div className="flex gap-2">
            <Card className="bg-white shadow-sm border-gray-100 flex items-center p-3 gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-amber-600" />
              </div>
              <div className="pr-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Durum</p>
                <p className="text-sm font-bold text-green-600 leading-none">Canlı</p>
              </div>
            </Card>
            <Card className="bg-white shadow-sm border-gray-100 flex items-center p-3 gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="pr-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Yetki</p>
                <p className="text-sm font-bold text-gray-800 leading-none">Yönetici</p>
              </div>
            </Card>
          </div>
        </div>

        <div className="mb-12">
          <DashboardContainer />
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Belgeler</h2>
              <p className="text-gray-600">Bu bölüm için paylaşılan belgeler ve kaynaklar</p>
            </div>
            <Link href="/dashboard/pdfs">
              <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50">
                <FileText className="h-4 w-4 mr-2" />
                Tüm Belgeleri Görüntüle
              </Button>
            </Link>
          </div>
          <PartDocuments partId={9} gradientFrom="from-slate-600" gradientTo="to-gray-600" />
        </div>
      </div>
    </div>
  );
}
