"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { CreateLessonModal } from './CreateLessonModal';
import { AcademyLesson } from '@/types/academy';
import { UserRole } from '@prisma/client';

export function LessonCard({ lesson, isJoined }: { lesson: AcademyLesson; isJoined: boolean }) {
    return (
        <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm group overflow-hidden flex flex-col h-full">
            {lesson.imageUrl ? (
                <div className="relative h-48 w-full overflow-hidden">
                    <Image
                        src={lesson.imageUrl}
                        alt={lesson.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                </div>
            ) : (
                <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-blue-400 via-indigo-500 to-blue-600">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.4),transparent_50%)]"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(79,70,229,0.4),transparent_50%)]"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                            <div className="text-white/30 text-8xl font-black blur-[2px] select-none uppercase">
                                {lesson.name.charAt(0)}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center text-white/90 text-7xl font-black drop-shadow-2xl select-none uppercase">
                                {lesson.name.charAt(0)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <CardHeader className="flex-none">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-xl font-bold group-hover:text-blue-600 transition-colors line-clamp-1">
                        {lesson.name}
                    </CardTitle>
                    {isJoined && <Badge className="bg-green-100 text-green-700 hover:bg-green-200 flex-none">Kayıtlı</Badge>}
                </div>
                <CardDescription className="line-clamp-2 mt-2 h-10">{lesson.description || "Açıklama belirtilmemiş."}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-indigo-500" />
                        <span>{lesson._count?.students || 0} Öğrenci Kayıtlı</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <GraduationCap className="h-4 w-4 mr-2 text-blue-500" />
                        <span>{lesson.assignments?.length || 0} Eğitmen/Asistan</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-none flex gap-2 pt-0">
                <Link href={`/dashboard/part11/lesson/${lesson.id}`} className="flex-1">
                    <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                        İncele
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}

export function LessonList({ lessons, role, userId }: { lessons: AcademyLesson[]; role: UserRole; userId: string }) {
    if (lessons.length === 0) {
        return (
            <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-blue-200">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                    <GraduationCap className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Henüz Ders Yok</h3>
                <p className="text-gray-500 mt-2">Şu anda sistemde tanımlı akademi dersi bulunmuyor.</p>
                {([UserRole.ADMIN, UserRole.BOARD_MEMBER] as UserRole[]).includes(role) && (
                    <CreateLessonModal>
                        <Button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white">Yeni Ders Oluştur</Button>
                    </CreateLessonModal>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => {
                const isJoined = lesson.students?.some(s => s.studentId === userId) || false;
                return (
                    <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        isJoined={isJoined}
                    />
                );
            })}
        </div>
    );
}
