import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import SociometricAnalysis from './SociometricAnalysis';

export default async function SociometricPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect('/login');
    }

    const isAdmin = session.user.role === 'ADMIN';
    const isTutor = session.user.role === 'TUTOR';

    if (!isAdmin && !isTutor) {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Link href="/dashboard/part2">
                    <Button variant="ghost" className="mb-6 hover:bg-gray-100 transition-all duration-200">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Part 2&apos;ye Dön
                    </Button>
                </Link>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-600">
                            Sosyometrik Analiz
                        </span>
                    </h1>
                    <p className="text-gray-600">
                        Sınıf dinamiklerini, lider öğrencileri, izole öğrencileri ve ortak arkadaş ağlarını görüntüleyin
                    </p>
                </div>

                <SociometricAnalysis
                    userId={session.user.id}
                    userRole={session.user.role}
                />
            </div>
        </div>
    );
}
