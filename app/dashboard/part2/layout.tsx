import ProtectedPartLayout from '@/app/components/auth/ProtectedPartLayout';
import React from 'react';

export default async function Part2Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedPartLayout partId={2}>
            {children}
        </ProtectedPartLayout>
    );
}
