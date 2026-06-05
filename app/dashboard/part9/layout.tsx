import ProtectedPartLayout from '@/app/components/auth/ProtectedPartLayout';
import React from 'react';
import SportsShell from './_components/SportsShell';

export default async function Part9Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedPartLayout partId={9}>
            <SportsShell>{children}</SportsShell>
        </ProtectedPartLayout>
    );
}
