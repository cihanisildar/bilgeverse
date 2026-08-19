'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import AttendanceRecording from '@/app/dashboard/part9/AttendanceRecording';
import ManagerGuard from '@/app/dashboard/part9/_components/ManagerGuard';

export default function Part7SportsAttendancePage() {
    const router = useRouter();
    const params = useParams();
    const trainingId = params.trainingId as string;
    const backToSchedule = () => router.push('/dashboard/part7/sports/schedule');

    return (
        <ManagerGuard>
            <Button variant="ghost" className="mb-6 hover:bg-gray-100" onClick={backToSchedule}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Takvime Dön
            </Button>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <AttendanceRecording trainingId={trainingId} onBack={backToSchedule} />
            </div>
        </ManagerGuard>
    );
}
