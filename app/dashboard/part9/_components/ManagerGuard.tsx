'use client';

import React from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { UserRole } from '@prisma/client';
import { Lock } from 'lucide-react';

/** Client guard: only admins/coaches see the children. Athletes get a notice. */
export default function ManagerGuard({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const roles = user?.roles && user.roles.length > 0 ? user.roles : user?.role ? [user.role] : [];
    const isManager = roles.some((r) =>
        ([UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN, UserRole.BOARD_MEMBER] as UserRole[]).includes(r as UserRole)
    );

    if (!isManager) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Lock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
            </div>
        );
    }

    return <>{children}</>;
}
