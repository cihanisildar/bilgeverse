import ProtectedPartLayout from '@/app/components/auth/ProtectedPartLayout';
import SocialShell from './_components/SocialShell';
import React from 'react';

export default async function Part6Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedPartLayout partId={6}>
            <SocialShell>{children}</SocialShell>
        </ProtectedPartLayout>
    );
}
