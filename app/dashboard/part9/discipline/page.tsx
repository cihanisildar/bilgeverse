'use client';

import React from 'react';
import DisciplinePanel from '../_components/DisciplinePanel';
import ManagerGuard from '../_components/ManagerGuard';

/**
 * Disiplin YÖNETİMİ — tüm kulübün kayıtları ve yönetmelik düzenleme.
 * Sporcunun kendi kayıtları için /dashboard/part9/my-discipline var.
 */
export default function Page() {
    return (
        <ManagerGuard>
            <DisciplinePanel />
        </ManagerGuard>
    );
}
