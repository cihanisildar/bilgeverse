'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import AttendanceRecording from '../../AttendanceRecording';

export default function Part9AttendancePage() {
    const router = useRouter();
    const params = useParams();
    const trainingId = params.trainingId as string;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Button
                    variant="ghost"
                    className="mb-6 hover:bg-gray-100 transition-all duration-200"
                    onClick={() => router.push('/dashboard/part9/schedule')}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Takvime Dön
                </Button>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <AttendanceRecording
                        trainingId={trainingId}
                        onBack={() => router.push('/dashboard/part9/schedule')}
                    />
                </div>
            </div>
        </div>
    );
}
