'use client';

import React from 'react';
import SportsFinance from '@/app/dashboard/part9/_components/SportsFinance';
import ManagerGuard from '@/app/dashboard/part9/_components/ManagerGuard';

export default function Part7SportsFinancePage() {
    return (
        <ManagerGuard>
            <SportsFinance />
        </ManagerGuard>
    );
}
