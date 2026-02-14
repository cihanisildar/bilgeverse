'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/app/contexts/AuthContext';
import { UserRole } from '@prisma/client';

export default function Part9StatsPage() {
    const router = useRouter();
    const { user } = useAuth();

    const roles = user?.roles && user.roles.length > 0 ? user.roles : [user?.role];
    const isOnlyAthlete = roles.length === 1 && roles.includes(UserRole.ATHLETE);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Button
                    variant="ghost"
                    className="mb-6 hover:bg-gray-100 transition-all duration-200"
                    onClick={() => router.push('/dashboard/part9')}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Bölüm 9'a Dön
                </Button>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                            {isOnlyAthlete ? 'Performansım' : 'Performans Analizi'}
                        </span>
                    </h1>
                    <p className="text-gray-600">
                        {isOnlyAthlete
                            ? 'Gelişim grafikleriniz ve performans verileriniz'
                            : 'Sporcuların gelişim metrikleri ve istatistiksel verileri'}
                    </p>
                </div>

                <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                    <CardHeader className="bg-indigo-600 text-white pb-8">
                        <CardTitle className="text-2xl">{isOnlyAthlete ? 'Performans Metriklerim' : 'Gelişmiş İstatistikler'}</CardTitle>
                        <CardDescription className="text-indigo-100">
                            {isOnlyAthlete
                                ? 'Gelişim grafikleriniz ve performans verileriniz yakında burada olacak.'
                                : 'Performans metrikleri yakında görselleştirilecek.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-96 flex items-center justify-center text-gray-400 bg-white">
                        <div className="text-center">
                            <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                                <BarChart3 className="h-10 w-10 text-indigo-400 opacity-50" />
                            </div>
                            <p className="text-lg font-medium text-gray-600">Veriler toplandıkça burası dolacaktır.</p>
                            <p className="text-sm">Analiz modülü hazırlık aşamasındadır.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
