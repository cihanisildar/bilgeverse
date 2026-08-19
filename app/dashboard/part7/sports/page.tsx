import { requireAuth } from '@/app/lib/auth-utils';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import SportsOverview from '@/app/dashboard/part9/_components/SportsOverview';

export default async function Part7SportsPage() {
    const session = await requireAuth({ partId: 9 });
    const roles = (session.user.roles || [session.user.role]) as UserRole[];
    const isManager = roles.some((r) =>
        ([UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN, UserRole.BOARD_MEMBER] as UserRole[]).includes(r)
    );
    // Sporcular yönetim özetini değil kendi panellerini görür (part9 ile aynı kural).
    if (!isManager) {
        redirect('/dashboard/part7/sports/me');
    }
    return <SportsOverview />;
}
