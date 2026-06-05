'use client';

import React from 'react';
import AthleteList from '../AthleteList';
import ManagerGuard from '../_components/ManagerGuard';

export default function Part9AthletesPage() {
    return (
        <ManagerGuard>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <AthleteList />
            </div>
        </ManagerGuard>
    );
}
