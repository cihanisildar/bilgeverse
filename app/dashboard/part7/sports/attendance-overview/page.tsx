'use client';

import React from 'react';
import AttendanceOverview from '@/app/dashboard/part9/_components/AttendanceOverview';
import ManagerGuard from '@/app/dashboard/part9/_components/ManagerGuard';

export default function Part7SportsAttendanceOverviewPage() {
    return (
        <ManagerGuard>
            <AttendanceOverview />
        </ManagerGuard>
    );
}
