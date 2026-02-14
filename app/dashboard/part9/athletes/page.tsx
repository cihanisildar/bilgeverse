'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import AthleteList from '../AthleteList';
import { useAuth } from '@/app/contexts/AuthContext';
import { UserRole } from '@prisma/client';

export default function Part9AthletesPage() {
    const router = useRouter();
    const { user } = useAuth();

    const roles = user?.roles && user.roles.length > 0 ? user.roles : [user?.role];
    const isOnlyAthlete = roles.length === 1 && roles.includes(UserRole.ATHLETE);

    if (isOnlyAthlete) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
            </div>
        );
    }

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
                            Sporcu Yönetimi
                        </span>
                    </h1>
                    <p className="text-gray-600">Sistemdeki sporcuları ve profillerini yönetin</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <AthleteList />
                </div>
            </div>
        </div>
    );
}
