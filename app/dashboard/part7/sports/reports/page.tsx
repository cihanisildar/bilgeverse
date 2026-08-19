'use client';

import React from 'react';
import SportsReports from '@/app/dashboard/part9/_components/SportsReports';
import ManagerGuard from '@/app/dashboard/part9/_components/ManagerGuard';

export default function Part7SportsReportsPage() {
    return (
        <ManagerGuard>
            <SportsReports />
        </ManagerGuard>
    );
}
