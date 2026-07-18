import { requireAuth } from '@/app/lib/auth-utils';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import SportsOverview from './_components/SportsOverview';

export default async function Part9Page() {
    const session = await requireAuth({ partId: 9 });
    const roles = (session.user.roles || [session.user.role]) as UserRole[];
    const isManager = roles.some((r) =>
        ([UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN, UserRole.BOARD_MEMBER] as UserRole[]).includes(r)
    );
    // Athletes get their own read-only panel instead of the manager overview
    if (!isManager) {
        redirect('/dashboard/part9/me');
    }
    return <SportsOverview />;
}
