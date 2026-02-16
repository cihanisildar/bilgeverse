'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Briefcase, GraduationCap, List, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAcademyLessonDetails } from '@/app/hooks/use-academy-data';
import { AcademyAssignments, AcademyStudents, AcademySyllabus, AcademySessions, EditLessonModal } from '@/components/academy';

interface LessonDetailsClientProps {
    lessonId: string;
    userId: string;
    userRoles: UserRole[];
}

export function LessonDetailsClient({ lessonId, userId, userRoles }: LessonDetailsClientProps) {
    const { data: lesson, isLoading, error } = useAcademyLessonDetails(lessonId);
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (error || !lesson)) {
            const timer = setTimeout(() => router.push('/dashboard/part11'), 3000);
            return () => clearTimeout(timer);
        }
    }, [isLoading, error, lesson, router]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                <p className="text-blue-600 font-medium italic">Ders detayları yükleniyor...</p>
            </div>
        );
    }

    if (error || !lesson) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <p className="text-red-500 font-bold mb-2">Ders bulunamadı veya bir hata oluştu.</p>
                <p className="text-gray-500">Akademi ana sayfasına yönlendiriliyorsunuz...</p>
            </div>
        );
    }

    const isAdminOrBoard = userRoles.includes(UserRole.ADMIN) || userRoles.includes(UserRole.BOARD_MEMBER);
    const isAssigned = lesson.assignments.some((a) => a.userId === userId);
    const isStudent = userRoles.includes(UserRole.STUDENT);
    const isMember = lesson.students.some((s) => s.studentId === userId);

    // canManage: Edit, Delete, Add Students/Sessions/Syllabus
    const canManage = isAdminOrBoard || isAssigned;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-blue-100 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-500 to-indigo-500"></div>

                    <div className="flex flex-col md:flex-row gap-8">
                        {lesson.imageUrl && (
                            <div className="relative w-full md:w-48 h-48 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                                <Image src={lesson.imageUrl} alt={lesson.name} fill className="object-cover" />
                            </div>
                        )}
                        <div className="space-y-4 flex-1">
                            <div className="flex justify-between items-start gap-4">
                                <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
                                    {lesson.name}
                                </h1>
                                {canManage && (
                                    <EditLessonModal lesson={lesson} />
                                )}
                            </div>
                            <p className="text-gray-600 text-lg">
                                {lesson.description || "Bu ders için henüz bir açıklama girilmemiş."}
                            </p>
                            <div className="flex flex-wrap gap-4 pt-2">
                                <Badge variant="outline" className="px-4 py-1.5 rounded-full border-blue-200 text-blue-700 bg-blue-50">
                                    <Users className="h-4 w-4 mr-2" />
                                    {lesson.students.length} Öğrenci
                                </Badge>
                                <Badge variant="outline" className="px-4 py-1.5 rounded-full border-indigo-200 text-indigo-700 bg-indigo-50">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    {lesson.sessions.length} Oturum
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="sessions" className="w-full">
                    <TabsList className="bg-white/50 border border-blue-100 p-1 rounded-xl mb-6">
                        <TabsTrigger value="sessions" className="rounded-lg px-8 data-[state=active]:bg-white data-[state=active]:text-blue-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            Oturumlar
                        </TabsTrigger>
                        <TabsTrigger value="syllabus" className="rounded-lg px-8 data-[state=active]:bg-white data-[state=active]:text-blue-600">
                            <List className="h-4 w-4 mr-2" />
                            Müfredat
                        </TabsTrigger>
                        {(!isStudent || isMember || canManage) && (
                            <TabsTrigger value="students" className="rounded-lg px-8 data-[state=active]:bg-white data-[state=active]:text-blue-600">
                                <Users className="h-4 w-4 mr-2" />
                                Öğrenciler
                            </TabsTrigger>
                        )}
                        {isAdminOrBoard && (
                            <TabsTrigger value="management" className="rounded-lg px-8 data-[state=active]:bg-white data-[state=active]:text-blue-600">
                                <Briefcase className="h-4 w-4 mr-2" />
                                Yönetim
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="sessions">
                        <AcademySessions
                            lessonId={lesson.id}
                            sessions={lesson.sessions}
                            canManage={canManage}
                            assignments={lesson.assignments}
                            students={lesson.students.map(s => ({
                                id: s.studentId,
                                firstName: s.student.firstName,
                                lastName: s.student.lastName
                            }))}
                        />
                    </TabsContent>

                    <TabsContent value="syllabus">
                        <AcademySyllabus
                            lessonId={lesson.id}
                            syllabus={lesson.syllabus}
                            canManage={canManage}
                        />
                    </TabsContent>

                    {(!isStudent || isMember || canManage) && (
                        <TabsContent value="students">
                            <AcademyStudents
                                lessonId={lesson.id}
                                students={lesson.students}
                                canManage={canManage}
                            />
                        </TabsContent>
                    )}

                    {isAdminOrBoard && (
                        <TabsContent value="management">
                            <AcademyAssignments
                                lessonId={lesson.id}
                                assignments={lesson.assignments}
                            />
                        </TabsContent>
                    )}
                </Tabs>
            </div>

            <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-blue-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
                        Eğitmenler
                    </h3>
                    <div className="space-y-4">
                        {lesson.assignments.length > 0 ? (
                            lesson.assignments.map((assignment) => (
                                <div key={assignment.id} className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-50">
                                    <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                                        {assignment.user.avatarUrl ? (
                                            <Image src={assignment.user.avatarUrl} alt={assignment.user.firstName || ''} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                                                {assignment.user.firstName ? assignment.user.firstName[0] : (assignment.user.username ? assignment.user.username[0] : '?')}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">
                                            {assignment.user.firstName} {assignment.user.lastName}
                                        </p>
                                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider p-0 h-auto text-blue-600 border-0">
                                            {assignment.role === 'ADMIN' ? 'Admin' :
                                                assignment.role === 'TUTOR' ? 'Eğitmen' :
                                                    assignment.role === 'ASISTAN' ? 'Asistan' : assignment.role}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm italic">Henüz atanmış eğitmen bulunmuyor.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
