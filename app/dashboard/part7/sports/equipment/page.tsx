'use client';

import React from 'react';
import EquipmentManager from '@/app/dashboard/part9/_components/EquipmentManager';
import ManagerGuard from '@/app/dashboard/part9/_components/ManagerGuard';

export default function Part7SportsEquipmentPage() {
    return (
        <ManagerGuard>
            <EquipmentManager />
        </ManagerGuard>
    );
}
