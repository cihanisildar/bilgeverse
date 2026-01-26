"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, MapPin, Plus, List, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { CreateWorkshopModal } from './CreateWorkshopModal';

interface Workshop {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    assignments: any[];
    students: Array<{ studentId: string }>;
    _count: {
        students: number;
        activities: number;
    };
}

export function WorkshopCard({ workshop, role, isJoined }: { workshop: Workshop; role: string; isJoined: boolean }) {

    return (
        <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm group overflow-hidden flex flex-col h-full">
            {workshop.imageUrl ? (
                <div className="relative h-48 w-full overflow-hidden">
                    <Image
                        src={workshop.imageUrl}
                        alt={workshop.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                </div>
            ) : (
                <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.4),transparent_50%)]"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(255,165,0,0.4),transparent_50%)]"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                            <div className="text-white/30 text-8xl font-black blur-[2px] select-none uppercase">
                                {workshop.name.charAt(0)}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center text-white/90 text-7xl font-black drop-shadow-2xl select-none uppercase">
                                {workshop.name.charAt(0)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <CardHeader className="flex-none">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-xl font-bold group-hover:text-amber-600 transition-colors line-clamp-1">
                        {workshop.name}
                    </CardTitle>
                    {isJoined && <Badge className="bg-green-100 text-green-700 hover:bg-green-200 flex-none">Katıldın</Badge>}
                </div>
                <CardDescription className="line-clamp-2 mt-2 h-10">{workshop.description || "Açıklama belirtilmemiş."}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-orange-500" />
                        <span>{workshop._count.students} Öğrenci Kayıtlı</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-amber-500" />
                        <span>{workshop._count.activities} Faaliyet Oluşturuldu</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-none flex gap-2 pt-0">
                <Link href={`/dashboard/part4/workshops/${workshop.id}`} className="flex-1">
                    <Button variant="outline" className="w-full border-amber-200 text-amber-700 hover:bg-amber-50">
                        Detaylar
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}

export function WorkshopList({ workshops, role, userId }: { workshops: Workshop[]; role: string; userId?: string }) {
    if (workshops.length === 0) {
        return (
            <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-amber-200">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
                    <List className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Henüz Atölye Yok</h3>
                <p className="text-gray-500 mt-2">Şu anda sistemde tanımlı beceri atölyesi bulunmuyor.</p>
                {role === "ADMIN" && (
                    <CreateWorkshopModal>
                        <Button className="mt-6 bg-amber-600 hover:bg-amber-700 text-white">Yeni Atölye Oluştur</Button>
                    </CreateWorkshopModal>
                )}
            </div>
        );
    }

    // For students, separate enrolled and non-enrolled workshops
    if (role === 'STUDENT' && userId) {
        const enrolledWorkshops = workshops.filter(w =>
            w.students.some(s => s.studentId === userId)
        );
        const notEnrolledWorkshops = workshops.filter(w =>
            !w.students.some(s => s.studentId === userId)
        );

        return (
            <div className="space-y-8">
                {enrolledWorkshops.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                                Katıldığın Atölyeler
                            </span>
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                                {enrolledWorkshops.length}
                            </Badge>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {enrolledWorkshops.map((w) => (
                                <WorkshopCard
                                    key={w.id}
                                    workshop={w}
                                    role={role}
                                    isJoined={w.students.some(s => s.studentId === userId)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {notEnrolledWorkshops.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600">
                                Diğer Atölyeler
                            </span>
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">
                                {notEnrolledWorkshops.length}
                            </Badge>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {notEnrolledWorkshops.map((w) => (
                                <WorkshopCard
                                    key={w.id}
                                    workshop={w}
                                    role={role}
                                    isJoined={w.students.some(s => s.studentId === userId)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // For non-students (tutors, admins, etc.), show normal unified view
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workshops.map((w) => (
                <WorkshopCard
                    key={w.id}
                    workshop={w}
                    role={role}
                    isJoined={userId ? w.students.some(s => s.studentId === userId) : false}
                />
            ))}
        </div>
    );
}
