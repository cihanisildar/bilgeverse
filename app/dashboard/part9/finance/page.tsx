'use client';

import React from 'react';
import SportsFinance from '../_components/SportsFinance';
import ManagerGuard from '../_components/ManagerGuard';

export default function Page() {
    return (
        <ManagerGuard>
            <SportsFinance />
        </ManagerGuard>
    );
}
