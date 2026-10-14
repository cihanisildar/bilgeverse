'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { UserRole } from '@prisma/client';
import TrainingSchedule from '../TrainingSchedule';

export default function Part9SchedulePage() {
    const router = useRouter();
    const { user } = useAuth();
    const roles = user?.roles && user.roles.length > 0 ? user.roles : user?.role ? [user.role] : [];
    const isManager = roles.some((r) =>
        ([UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN, UserRole.BOARD_MEMBER] as UserRole[]).includes(r as UserRole)
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            {/* Öğrenci ve sporcular programı yalnızca görür; ekleme/silme/yoklama yönetime ait. */}
            <TrainingSchedule
                readOnly={!isManager}
                onSelectSession={(id) => isManager && router.push(`/dashboard/part9/attendance/${id}`)}
            />
        </div>
    );
}
