'use client';

import React from 'react';
import FootballSchool from '@/app/dashboard/part9/_components/FootballSchool';
import ManagerGuard from '@/app/dashboard/part9/_components/ManagerGuard';

export default function Part7SportsFootballSchoolPage() {
    return (
        <ManagerGuard>
            <FootballSchool />
        </ManagerGuard>
    );
}
