'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import TrainingSchedule from '../TrainingSchedule';

export default function Part9SchedulePage() {
    const router = useRouter();

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
                            Antrenman & Maç Takvimi
                        </span>
                    </h1>
                    <p className="text-gray-600">Yaklaşan oturumları takip edin ve planlayın</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <TrainingSchedule onSelectSession={(id) => router.push(`/dashboard/part9/attendance/${id}`)} />
                </div>
            </div>
        </div>
    );
}
