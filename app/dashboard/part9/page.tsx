import { requireAuth } from '@/app/lib/auth-utils';
import SportsOverview from './_components/SportsOverview';

export default async function Part9Page() {
    await requireAuth({ partId: 9 });
    return <SportsOverview />;
}
