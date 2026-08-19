'use client';

import React from 'react';
import AthleteList from '@/app/dashboard/part9/AthleteList';
import ManagerGuard from '@/app/dashboard/part9/_components/ManagerGuard';

export default function Part7SportsAthletesPage() {
    return (
        <ManagerGuard>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <AthleteList />
            </div>
        </ManagerGuard>
    );
}
