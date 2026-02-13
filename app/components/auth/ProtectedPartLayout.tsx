import { requireAuth } from '@/app/lib/auth-utils';
import { isAuthorized } from '@/app/lib/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

interface ProtectedPartLayoutProps {
    children: React.ReactNode;
    partId: number;
}

/**
 * A reusable layout wrapper for Dashboard Parts that enforces session and role-based access control.
 * It provides a consistent "Access Denied" UI for unauthorized users.
 */
export default async function ProtectedPartLayout({
    children,
    partId,
}: ProtectedPartLayoutProps) {
    const session = await requireAuth();

    // Check permissions using the centralized utility
    if (!isAuthorized(session, partId)) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="mb-6 hover:bg-gray-100 transition-all duration-200">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Ana Sayfaya Dön
                        </Button>
                    </Link>
                    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-red-500 to-orange-500"></div>
                        <CardHeader>
                            <CardTitle className="text-2xl">Erişim Engellendi</CardTitle>
                            <CardDescription>Bu bölüme erişim yetkiniz bulunmamaktadır</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">Bu bölüm sadece yetkili kullanıcılar için erişilebilirdir. Eğer bir hata olduğunu düşünüyorsanız lütfen yönetici ile iletişime geçin.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
