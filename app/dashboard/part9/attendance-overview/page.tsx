'use client';

import React from 'react';
import AttendanceOverview from '../_components/AttendanceOverview';
import ManagerGuard from '../_components/ManagerGuard';

export default function Page() {
    return (
        <ManagerGuard>
            <AttendanceOverview />
        </ManagerGuard>
    );
}
