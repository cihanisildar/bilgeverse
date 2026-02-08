import ProtectedPartLayout from '@/app/components/auth/ProtectedPartLayout';
import React from 'react';

export default async function Part1Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedPartLayout partId={1}>
            {children}
        </ProtectedPartLayout>
    );
}
