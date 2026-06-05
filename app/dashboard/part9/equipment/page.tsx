'use client';

import React from 'react';
import EquipmentManager from '../_components/EquipmentManager';
import ManagerGuard from '../_components/ManagerGuard';

export default function Page() {
    return (
        <ManagerGuard>
            <EquipmentManager />
        </ManagerGuard>
    );
}
