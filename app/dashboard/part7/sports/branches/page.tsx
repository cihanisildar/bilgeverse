'use client';

import React from 'react';
import BranchList from '@/app/dashboard/part9/BranchList';
import ManagerGuard from '@/app/dashboard/part9/_components/ManagerGuard';

export default function Part7SportsBranchesPage() {
    return (
        <ManagerGuard>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <BranchList />
            </div>
        </ManagerGuard>
    );
}
