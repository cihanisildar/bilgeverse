'use client';

import React from 'react';
import DisciplinePanel from '@/app/dashboard/part9/_components/DisciplinePanel';
import ManagerGuard from '@/app/dashboard/part9/_components/ManagerGuard';

export default function Part7SportsDisciplinePage() {
    return (
        <ManagerGuard>
            <DisciplinePanel />
        </ManagerGuard>
    );
}
