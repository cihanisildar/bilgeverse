'use client';

import React from 'react';
import BranchList from '../BranchList';
import ManagerGuard from '../_components/ManagerGuard';

export default function Part9BranchesPage() {
    return (
        <ManagerGuard>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <BranchList />
            </div>
        </ManagerGuard>
    );
}
