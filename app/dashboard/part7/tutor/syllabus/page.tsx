import { requireAuth } from '@/app/lib/auth-utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { getSyllabi } from '@/app/actions/syllabus';
import SyllabusList from '@/app/dashboard/part2/syllabus/SyllabusList';

export default async function TutorSyllabusPage() {
  const session = await requireAuth({
    roles: ['ADMIN', 'TUTOR', 'ASISTAN'],
    redirectTo: '/dashboard/part7/student',
  });

  const userRoles = session.user.roles || [session.user.role];
  const isAdmin = userRoles.includes('ADMIN');

  const result = await getSyllabi();
  const syllabi = result.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/dashboard/part7/tutor">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Rehber Paneline Dön
          </Button>
        </Link>

        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-cyan-600" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-teal-600">
                  Müfredat
                </span>
              </h1>
            </div>
            <p className="text-gray-600 ml-14">
              {isAdmin
                ? 'Global müfredat oluşturun ve tüm öğretmenlerle paylaşın'
                : 'Buluşma içeriklerini görüntüleyin ve sınıfınız için ilerleme kaydedin'}
            </p>
          </div>
          {isAdmin && (
            <Link href="/dashboard/part2/syllabus/new">
              <Button className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Müfredat Oluştur
              </Button>
            </Link>
          )}
        </div>

        <SyllabusList syllabi={syllabi} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
