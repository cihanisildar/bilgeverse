'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import TrainingSchedule from '@/app/dashboard/part9/TrainingSchedule';

export default function Part7SportsSchedulePage() {
    const router = useRouter();
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            {/* Yoklama ekranı da Bilgeverse içinde kalsın diye part7 rotasına gidiyor */}
            <TrainingSchedule onSelectSession={(id) => router.push(`/dashboard/part7/sports/attendance/${id}`)} />
        </div>
    );
}
