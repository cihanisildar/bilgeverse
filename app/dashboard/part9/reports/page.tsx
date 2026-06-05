'use client';

import React from 'react';
import SportsReports from '../_components/SportsReports';
import ManagerGuard from '../_components/ManagerGuard';

export default function Page() {
    return (
        <ManagerGuard>
            <SportsReports />
        </ManagerGuard>
    );
}
