'use client';

import React from 'react';
import PerformancePanel from '@/app/dashboard/part9/_components/PerformancePanel';
import ManagerGuard from '@/app/dashboard/part9/_components/ManagerGuard';

export default function Part7SportsPerformancePage() {
    return (
        <ManagerGuard>
            <PerformancePanel />
        </ManagerGuard>
    );
}
