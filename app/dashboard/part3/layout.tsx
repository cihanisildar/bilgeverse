import ProtectedPartLayout from '@/app/components/auth/ProtectedPartLayout';
import React from 'react';

export default async function Part3Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedPartLayout partId={3}>
            {children}
        </ProtectedPartLayout>
    );
}
