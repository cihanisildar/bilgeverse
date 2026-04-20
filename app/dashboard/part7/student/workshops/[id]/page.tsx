import { redirect } from 'next/navigation';
import { requireAuth } from '@/app/lib/auth-utils';
import { UserRole } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Users, Briefcase, ShieldCheck, List, UserCircle2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkshopActivities } from '@/components/workshops/WorkshopActivities';
import { WorkshopStudents } from '@/components/workshops/WorkshopStudents';
import { WorkshopPlan } from '@/components/workshops/WorkshopPlan';
import { Progress } from '@/components/ui/progress';
import { WorkshopJoinButton } from '@/components/workshops/WorkshopJoinButton';
import { getWorkshopById, getWorkshopJoinRequest } from '@/lib/workshops';

export default async function StudentWorkshopDetailsPage({ params }: { params: { id: string } }) {
    const session = await requireAuth({ partId: 4 });

    const workshop = await getWorkshopById(params.id);

    if (!workshop) {
        redirect('/dashboard/part7/student/workshops');
    }

    const isMember = workshop.students.some((s) => s.studentId === session.user.id);

    // Check if student has pending join request
    let joinRequest = null;
    let studentStatus: 'not_member' | 'pending' | 'member' = 'not_member';

    if (isMember) {
        studentStatus = 'member';
    } else {
        joinRequest = await getWorkshopJoinRequest(params.id, session.user.id);
        if (joinRequest && joinRequest.status === 'PENDING') {
            studentStatus = 'pending';
        }
    }

    const completedCourses = workshop.courses.filter((c) => c.isCompleted).length;
    const progressCount = workshop.courses.length;
    const progress = progressCount > 0
        ? Math.round((completedCourses / progressCount) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Link href="/dashboard/part7/student/workshops">
                    <Button variant="ghost" className="mb-6 hover:bg-gray-100">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Atölyelere Dön
                    </Button>
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-500 to-orange-500"></div>

                            <div className="flex flex-col md:flex-row gap-8">
                                {workshop.imageUrl && (
                                    <div className="relative w-full md:w-48 h-48 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                                        <Image src={workshop.imageUrl} alt={workshop.name} fill className="object-cover" />
                                    </div>
                                )}
                                <div className="space-y-4 flex-1">
                                    <div className="flex justify-between items-start gap-4">
                                        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
                                            {workshop.name}
                                        </h1>
                                        <div className="flex gap-2">
                                            <WorkshopJoinButton workshopId={workshop.id} currentStatus={studentStatus} />
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-lg">
                                        {workshop.description || "Bu atölye için henüz bir açıklama girilmemiş."}
                                    </p>
                                    <div className="flex flex-wrap gap-4 pt-2">
                                        <Badge variant="outline" className="px-4 py-1.5 rounded-full border-gray-200 text-gray-700 bg-gray-50">
                                            <Users className="h-4 w-4 mr-2 text-blue-500" />
                                            {workshop._count?.students || 0} Öğrenci
                                        </Badge>
                                        <Badge variant="outline" className="px-4 py-1.5 rounded-full border-gray-200 text-gray-700 bg-gray-50">
                                            <Calendar className="h-4 w-4 mr-2 text-amber-500" />
                                            {workshop._count?.activities || 0} Faaliyet
                                        </Badge>
                                        <div className="flex items-center gap-3 ml-auto min-w-[200px]">
                                            <div className="flex-1">
                                                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                                                    <span>İlerleme</span>
                                                    <span className="text-amber-600 font-bold">%{progress}</span>
                                                </div>
                                                <Progress
                                                    value={progress}
                                                    className="h-2 bg-gray-100"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Tabs defaultValue="activities" className="w-full">
                            <TabsList className="bg-white/50 border border-gray-100 p-1 rounded-xl mb-6">
                                <TabsTrigger value="activities" className="rounded-lg px-8 data-[state=active]:bg-white data-[state=active]:text-amber-600">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Faaliyetler
                                </TabsTrigger>
                                <TabsTrigger value="plan" className="rounded-lg px-8 data-[state=active]:bg-white data-[state=active]:text-amber-600">
                                    <List className="h-4 w-4 mr-2" />
                                    Müfredat
                                </TabsTrigger>
                                {isMember && (
                                    <TabsTrigger value="students" className="rounded-lg px-8 data-[state=active]:bg-white data-[state=active]:text-amber-600">
                                        <Users className="h-4 w-4 mr-2" />
                                        Öğrenciler
                                    </TabsTrigger>
                                )}
                            </TabsList>

                            <TabsContent value="activities">
                                <WorkshopActivities
                                    workshopId={workshop.id}
                                    activities={workshop.activities}
                                    isPrivileged={false}
                                    currentUserId={session.user.id}
                                    isStudent={true}
                                />
                            </TabsContent>

                            <TabsContent value="plan">
                                <WorkshopPlan
                                    workshopId={workshop.id}
                                    courses={workshop.courses}
                                    isPrivileged={false}
                                />
                            </TabsContent>

                            {isMember && (
                                <TabsContent value="students">
                                    <WorkshopStudents
                                        workshopId={workshop.id}
                                        students={workshop.students}
                                        isPrivileged={false}
                                        currentUserRole={session.user.role}
                                        currentUserId={session.user.id}
                                    />
                                </TabsContent>
                            )}
                        </Tabs>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <Briefcase className="h-5 w-5 mr-2 text-amber-600" />
                                Yetkililer
                            </h3>
                            <div className="space-y-4">
                                {workshop.assignments && workshop.assignments.length > 0 ? (
                                    workshop.assignments.map((assignment) => (
                                        <div key={assignment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                                                {assignment.user.avatarUrl ? (
                                                    <Image src={assignment.user.avatarUrl} alt={assignment.user.firstName || ''} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-amber-200 flex items-center justify-center text-amber-700 font-bold">
                                                        {assignment.user.firstName ? assignment.user.firstName[0] : (assignment.user.username ? assignment.user.username[0] : '?')}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">
                                                    {assignment.user.firstName} {assignment.user.lastName}
                                                </p>
                                                <Badge variant="outline" className="text-[10px] uppercase tracking-wider p-0 h-auto text-amber-600 border-0">
                                                    {assignment.role === 'ADMIN' ? 'Admin' :
                                                        assignment.role === 'BOARD_MEMBER' ? 'Kurul Üyesi' :
                                                            assignment.role === 'TUTOR' ? 'Rehber' :
                                                                assignment.role === 'ASISTAN' ? 'Asistan' : assignment.role}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm italic">Henüz atanmış rehber bulunmuyor.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
