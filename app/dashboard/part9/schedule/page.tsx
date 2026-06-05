'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import TrainingSchedule from '../TrainingSchedule';

export default function Part9SchedulePage() {
    const router = useRouter();
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <TrainingSchedule onSelectSession={(id) => router.push(`/dashboard/part9/attendance/${id}`)} />
        </div>
    );
}
