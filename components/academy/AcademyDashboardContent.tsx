'use client';

import { useState } from 'react';
import { LayoutGrid, FileText, GraduationCap, Plus, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { LessonList, CreateLessonModal } from '@/components/academy';
import { useAcademyLessons } from '@/app/hooks/use-academy-data';
import { UserRole } from '@prisma/client';

interface AcademyDashboardContentProps {
    userId: string;
    role: UserRole;
    userRoles: UserRole[];
    partName?: string;
    partDescription?: string;
    documentsContent?: React.ReactNode;
}

export function AcademyDashboardContent({
    userId,
    role,
    userRoles,
    partName,
    partDescription,
    documentsContent
}: AcademyDashboardContentProps) {
    const { data: lessons = [], isLoading } = useAcademyLessons();
    const isAdminOrBoard = userRoles.includes(UserRole.ADMIN) || userRoles.includes(UserRole.BOARD_MEMBER);

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight flex items-center gap-3">
                        <GraduationCap className="h-10 w-10 text-blue-600" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                            {partName || 'Akademi'}
                        </span>
                    </h1>
                    <p className="text-gray-600 text-lg max-w-2xl">{partDescription}</p>
                </div>
                {isAdminOrBoard && (
                    <CreateLessonModal>
                        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all border-0">
                            <Plus className="h-5 w-5 mr-2" />
                            Yeni Ders
                        </Button>
                    </CreateLessonModal>
                )}
            </div>

            <Tabs defaultValue="lessons" className="w-full">
                <div className="flex items-center justify-between mb-6">
                    <TabsList className="bg-white/50 border border-blue-100 p-1 rounded-xl">
                        <TabsTrigger value="lessons" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                            <LayoutGrid className="h-4 w-4 mr-2" />
                            Dersler
                        </TabsTrigger>
                        {isAdminOrBoard && (
                            <TabsTrigger value="documents" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                                <FileText className="h-4 w-4 mr-2" />
                                Belgeler
                            </TabsTrigger>
                        )}
                    </TabsList>
                </div>

                <TabsContent value="lessons" className="mt-0 outline-none">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-blue-100">
                            <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                            <p className="text-blue-600 font-medium italic">Dersler yükleniyor...</p>
                        </div>
                    ) : (
                        <LessonList
                            lessons={lessons}
                            role={role}
                            userId={userId}
                        />
                    )}
                </TabsContent>

                <TabsContent value="documents" className="mt-0 outline-none">
                    <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6 border border-blue-100/50">
                        {documentsContent}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
