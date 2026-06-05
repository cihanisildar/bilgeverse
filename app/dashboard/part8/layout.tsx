import ProtectedPartLayout from '@/app/components/auth/ProtectedPartLayout';
import React from 'react';
import FinanceShell from './components/FinanceShell';

export default async function Part8Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedPartLayout partId={8}>
            <FinanceShell>{children}</FinanceShell>
        </ProtectedPartLayout>
    );
}
