import { requireAuth } from '@/app/lib/auth-utils';
import { WorkshopList } from '@/components/workshops/WorkshopList';
import { getWorkshops } from '@/lib/workshops';
import { UserRole } from '@prisma/client';

export default async function TutorWorkshopsPage() {
  const session = await requireAuth({ partId: 4 });

  const workshops = await getWorkshops(session.user.id, session.user.role as any);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600">
              Atölyeler
            </span>
          </h1>
          <p className="text-gray-600">Katıldığınız ve yönettiğiniz atölyeler</p>
        </div>

        <WorkshopList
          workshops={workshops as any}
          role={session.user.role as any}
          userId={session.user.id}
          basePath="/dashboard/part7/tutor"
        />
      </div>
    </div>
  );
}
