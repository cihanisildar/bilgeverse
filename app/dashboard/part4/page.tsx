import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, FileText, Plus, BarChart2, LayoutGrid } from 'lucide-react';
import { PARTS } from '@/app/lib/parts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import PartDocuments from '@/app/components/PartDocuments';
import { WorkshopList } from '@/components/workshops/WorkshopList';
import { WorkshopReports } from '@/components/workshops/WorkshopReports';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { CreateWorkshopModal } from '@/components/workshops/CreateWorkshopModal';

import { getWorkshops } from '@/lib/workshops';

export default async function Part4Page({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await getServerSession(authOptions);

  // Note: Session is guaranteed by Part4Layout
  const activeTab = searchParams.tab || 'workshops';
  const part = PARTS.find(p => p.id === 4);
  const isPrivileged = [UserRole.ADMIN, UserRole.BOARD_MEMBER, UserRole.TUTOR, UserRole.ASISTAN].includes(session?.user?.role as any);
  const isAdminOrBoard = [UserRole.ADMIN, UserRole.BOARD_MEMBER].includes(session?.user?.role as any);

  // Fetch Workshops via Service Layer
  const workshops = await getWorkshops(session?.user?.id || '', session?.user?.role || '' as any);

  // Fetch Report Data if admin/board
  let reportData = null;
  if (isAdminOrBoard) {
    const tutorActivityCounts = await prisma.workshopActivity.groupBy({
      by: ['tutorId'],
      _count: { id: true },
    });
    const tutorIds = tutorActivityCounts.map((t: any) => t.tutorId);
    const tutors = await prisma.user.findMany({
      where: { id: { in: tutorIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const tutorStats = tutorActivityCounts.map((stat: any) => {
      const tutor = tutors.find((t: any) => t.id === stat.tutorId);
      return {
        tutorName: tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Unknown',
        activityCount: stat._count.id,
      };
    });

    const wsForReports = await prisma.workshop.findMany({
      include: {
        _count: { select: { activities: true, students: true } },
        activities: { include: { _count: { select: { attendances: { where: { status: true } } } } } }
      }
    });

    const workshopReports = wsForReports.map((w: any) => {
      const totalPossible = w._count.activities * w._count.students;
      const actual = w.activities.reduce((acc: number, curr: any) => acc + (curr._count?.attendances || 0), 0);
      return {
        id: w.id,
        name: w.name,
        activityCount: w._count.activities,
        studentCount: w._count.students,
        attendanceRate: totalPossible > 0 ? (actual / totalPossible * 100).toFixed(2) : 0,
      };
    });
    reportData = { tutorStats, workshopReports };
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6 hover:bg-gray-100 transition-all duration-200">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ana Sayfaya Dön
          </Button>
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600">
                {part?.name}
              </span>
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl">{part?.description}</p>
          </div>
          {isAdminOrBoard && (
            <CreateWorkshopModal>
              <Button className="bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all border-0">
                <Plus className="h-5 w-5 mr-2" />
                Yeni Atölye
              </Button>
            </CreateWorkshopModal>
          )}
        </div>

        <Tabs defaultValue={activeTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-white/50 border border-amber-100 p-1 rounded-xl">
              <TabsTrigger value="workshops" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Atölyeler
              </TabsTrigger>
              {isAdminOrBoard && (
                <TabsTrigger value="reports" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Raporlar
                </TabsTrigger>
              )}
              {isAdminOrBoard && (
                <TabsTrigger value="documents" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Belgeler
                </TabsTrigger>
              )}
            </TabsList>
            {activeTab === 'documents' && (
              <Link href="/dashboard/pdfs">
                <Button variant="outline" className="border-amber-200 text-amber-600 hover:bg-amber-50 rounded-xl">
                  Tüm Belgeler
                </Button>
              </Link>
            )}
          </div>

          <TabsContent value="workshops" className="mt-0 outline-none">
            <WorkshopList workshops={workshops as any} role={session?.user?.role as any} userId={session?.user?.id || ''} />
          </TabsContent>

          {isAdminOrBoard && reportData && (
            <TabsContent value="reports" className="mt-0 outline-none">
              <WorkshopReports data={reportData} />
            </TabsContent>
          )}

          <TabsContent value="documents" className="mt-0 outline-none">
            <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6 border border-amber-100/50">
              <PartDocuments partId={4} gradientFrom="from-amber-600" gradientTo="to-orange-600" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
