'use client';

import React from 'react';
import PerformancePanel from '../_components/PerformancePanel';
import ManagerGuard from '../_components/ManagerGuard';

export default function Page() {
    return (
        <ManagerGuard>
            <PerformancePanel />
        </ManagerGuard>
    );
}
