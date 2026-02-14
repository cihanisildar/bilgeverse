import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Trophy, Users, Calendar, BarChart3, ArrowRight, Dumbbell } from 'lucide-react';
import { PARTS } from '@/app/lib/parts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PartDocuments from '@/app/components/PartDocuments';
import { requireAuth } from '@/app/lib/auth-utils';

export default async function Part9Page() {
  const session = await requireAuth({ partId: 9 });
  const part = PARTS.find(p => p.id === 9);

  const userRole = session.user.role;
  const roles = session.user.roles || (userRole ? [userRole] : []);
  const isAthlete = roles.includes('ATHLETE');
  const isAdminOrCoach = roles.some(r => ['ADMIN', 'TUTOR', 'BOARD_MEMBER', 'ASISTAN'].includes(r));

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
                <p className="text-sm font-bold text-gray-800 leading-none">
                  {isAdminOrCoach ? 'Yönetici' : 'Sporcu'}
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Dynamic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Schedule Card */}
          <Link href="/dashboard/part9/schedule" className="block">
            <Card className="h-full border-0 shadow-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-white group">
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calendar className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle className="text-xl">Takvim</CardTitle>
                <CardDescription>Antrenman ve maç programını takip edin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-bold text-indigo-600">
                  Görüntüle <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Athletes Card (Admin/Coach only) */}
          {isAdminOrCoach && (
            <Link href="/dashboard/part9/athletes" className="block">
              <Card className="h-full border-0 shadow-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-white group">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Sporcular</CardTitle>
                  <CardDescription>Sporcu listesi ve profil yönetimini yapın</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm font-bold text-blue-600">
                    Yönet <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Branches Card (Admin/Coach only) */}
          {isAdminOrCoach && (
            <Link href="/dashboard/part9/branches" className="block">
              <Card className="h-full border-0 shadow-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-white group">
                <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500"></div>
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Dumbbell className="h-6 w-6 text-amber-600" />
                  </div>
                  <CardTitle className="text-xl">Branşlar</CardTitle>
                  <CardDescription>Spor branşlarını ve branş detaylarını yönetin</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm font-bold text-amber-600">
                    Branşları Gör <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Analysis Card */}
          <Link href="/dashboard/part9/stats" className="block">
            <Card className="h-full border-0 shadow-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-white group">
              <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 text-emerald-600" />
                </div>
                <CardTitle className="text-xl">{isAthlete ? 'Performansım' : 'Analiz'}</CardTitle>
                <CardDescription>Gelişim grafiklerini ve verileri inceleyin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-bold text-emerald-600">
                  Analize Git <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
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
