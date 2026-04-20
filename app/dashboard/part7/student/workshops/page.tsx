import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { LayoutGrid } from 'lucide-react';
import { PARTS } from '@/app/lib/parts';
import { requireAuth } from '@/app/lib/auth-utils';
import { WorkshopList } from '@/components/workshops/WorkshopList';
import { getWorkshops } from '@/lib/workshops';

export default async function StudentWorkshopsPage() {
  const session = await requireAuth({ partId: 4 });

  // Fetch Workshops via Service Layer - Students only see workshops they are enrolled in or available to them
  const workshops = await getWorkshops(session?.user?.id || '', session?.user?.role || '' as any);
  const part = PARTS.find(p => p.id === 4);

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 rounded-xl">
                <LayoutGrid className="h-6 w-6 text-amber-600" />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {part?.name || 'Atölyeler'}
              </h1>
            </div>
            <p className="text-gray-600 text-lg max-w-2xl">
              Katıldığınız atölyeleri ve güncel durumu buradan takip edebilirsiniz.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <WorkshopList 
            workshops={workshops as any} 
            role={session?.user?.role as any} 
            userId={session?.user?.id || ''} 
            basePath="/dashboard/part7/student"
          />
        </div>
      </div>
    </div>
  );
}
