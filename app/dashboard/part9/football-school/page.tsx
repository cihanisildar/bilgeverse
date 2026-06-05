'use client';

import React from 'react';
import FootballSchool from '../_components/FootballSchool';
import ManagerGuard from '../_components/ManagerGuard';

export default function Page() {
    return (
        <ManagerGuard>
            <FootballSchool />
        </ManagerGuard>
    );
}
