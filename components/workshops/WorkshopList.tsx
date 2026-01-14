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
    _count: {
        students: number;
        activities: number;
    };
}

export function WorkshopCard({ workshop, role }: { workshop: Workshop; role: string }) {
    const isJoined = false; // This would come from a hook or state

    return (
        <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm group overflow-hidden">
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
                <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500 transform origin-left transition-transform duration-300 group-hover:scale-x-110"></div>
            )}
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold group-hover:text-amber-600 transition-colors">
                        {workshop.name}
                    </CardTitle>
                    {isJoined && <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Katıldın</Badge>}
                </div>
                <CardDescription className="line-clamp-2 mt-2">{workshop.description || "Açıklama belirtilmemiş."}</CardDescription>
            </CardHeader>
            <CardContent>
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
            <CardFooter className="flex gap-2">
                <Link href={`/dashboard/part4/workshops/${workshop.id}`} className="flex-1">
                    <Button variant="outline" className="w-full border-amber-200 text-amber-700 hover:bg-amber-50">
                        Detaylar
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}

export function WorkshopList({ workshops, role }: { workshops: Workshop[]; role: string }) {
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

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workshops.map((w) => (
                <WorkshopCard key={w.id} workshop={w} role={role} />
            ))}
        </div>
    );
}
