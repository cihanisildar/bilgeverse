import ProtectedPartLayout from '@/app/components/auth/ProtectedPartLayout';
import React from 'react';

export default async function Part10Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedPartLayout partId={10}>
            {children}
        </ProtectedPartLayout>
    );
}
