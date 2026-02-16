import { ArrowLeft } from 'lucide-react';
import { PARTS } from '@/app/lib/parts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { requireAuth } from '@/app/lib/auth-utils';
import { AcademyDashboardContent } from '@/components/academy/AcademyDashboardContent';
import PartDocuments from '@/app/components/PartDocuments';

export default async function Part11Page() {
    const session = await requireAuth({ partId: 11 });
    const part = PARTS.find(p => p.id === 11);

    const userRoles = session.user.roles || [session.user.role];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Link href="/dashboard">
                    <Button variant="ghost" className="mb-6 hover:bg-gray-100 transition-all duration-200">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Ana Sayfaya Dön
                    </Button>
                </Link>

                <AcademyDashboardContent
                    userId={session.user.id}
                    role={session.user.role}
                    userRoles={userRoles}
                    partName={part?.name}
                    partDescription={part?.description}
                    documentsContent={<PartDocuments partId={11} gradientFrom="from-blue-600" gradientTo="to-indigo-600" />}
                />
            </div>
        </div>
    );
}
