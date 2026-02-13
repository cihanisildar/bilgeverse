import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText } from 'lucide-react';
import { PARTS } from '@/app/lib/parts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { requireAuth } from '@/app/lib/auth-utils';
import PartDocuments from '@/app/components/PartDocuments';

export default async function Part5Page() {
  const session = await requireAuth({ partId: 5 });

  // Session and basic Part 5 access are guaranteed here

  // Fetch students - using a dynamic import or checking if we can reuse an existing action or direct prisma call
  // Since we are in a server component, we can use Prisma directly
  const prisma = (await import('@/lib/prisma')).default;

  const students = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      meslekkocuId: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const part = PARTS.find(p => p.id === 5);

  // Need to import the client component dynamically or strictly
  const StudentIntegrationList = (await import('./StudentIntegrationList')).default;

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
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Meslek Koçu Entegrasyonu</h2>
          <StudentIntegrationList students={students} />
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
      </div>
    </div>
  );
}
