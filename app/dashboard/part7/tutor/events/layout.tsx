import { requireAuth } from '@/app/lib/auth-utils';
import React from 'react';

/**
 * Bu sayfa Bilgeverse (part7) adresinde duruyor ama içeriği Değerler
 * Halkası'na (part2) ait. Sayfa client bileşeni olduğu için paket kapısı
 * buraya, segment layout'una kuruldu: kurumda Paket 2 yoksa URL elle
 * yazılsa bile /dashboard'a düşer.
 */
export default async function Part7Part2GateLayout({ children }: { children: React.ReactNode }) {
    await requireAuth({ partId: 2 });
    return <>{children}</>;
}
