import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { requireAuth } from '@/app/lib/auth-utils';
import { LessonDetailsClient } from '@/components/academy/LessonDetailsClient';

export default async function StudentLessonDetailsPage({ params }: { params: { id: string } }) {
    const session = await requireAuth({ partId: 11 });
    const userRoles = session.user.roles || [session.user.role];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Link href="/dashboard/part7/student/academy">
                    <Button variant="ghost" className="mb-6 hover:bg-gray-100 transition-all duration-200">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Akademiye Dön
                    </Button>
                </Link>

                <LessonDetailsClient 
                   lessonId={params.id} 
                   userId={session.user.id} 
                   userRoles={userRoles} 
                   basePath="/dashboard/part7/student/academy"
                />
            </div>
        </div>
    );
}
