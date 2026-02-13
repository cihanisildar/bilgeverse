import { requireAuth } from '@/app/lib/auth-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, BookOpen, Share2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { getSyllabi } from '@/app/actions/syllabus';
import SyllabusList from './SyllabusList';

export default async function SyllabusPage() {
  const session = await requireAuth({
    roles: ['ADMIN', 'TUTOR'],
    redirectTo: '/dashboard/part7/student'
  });

  const isAdmin = session.user.role === 'ADMIN';
  const isTutor = session.user.role === 'TUTOR';
  const canManage = isAdmin || isTutor;

  const result = await getSyllabi();
  const syllabi = result.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/dashboard/part2">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
        </Link>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-teal-600">
                Müfredat Yönetimi
              </span>
            </h1>
            <p className="text-gray-600">
              {isAdmin
                ? 'Global müfredat oluşturun ve tüm öğretmenlerle paylaşın'
                : 'Müfredatları görüntüleyin ve sınıfınız için ilerleme kaydedin'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {isAdmin && (
              <Link href="/dashboard/part2/syllabus/tracking">
                <Button className="bg-white hover:bg-gray-50 text-cyan-700 border border-cyan-200">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Öğretmen İlerleme Takibi
                </Button>
              </Link>
            )}
            {isAdmin && (
              <Link href="/dashboard/part2/syllabus/new">
                <Button className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Müfredat Oluştur
                </Button>
              </Link>
            )}
          </div>
        </div>

        <SyllabusList syllabi={syllabi} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
