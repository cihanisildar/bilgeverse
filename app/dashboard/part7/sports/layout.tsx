import { requireAuth } from '@/app/lib/auth-utils';
import React from 'react';
import SportsShell from '@/app/dashboard/part9/_components/SportsShell';

/**
 * Bilge Spor Kulübü'nün Bilgeverse (part7) içindeki bölümü.
 *
 * Sayfalar fiziksel olarak part7 altında durur — böylece kullanıcı Bilgeverse
 * kabuğundan (sol menüden) hiç çıkmaz. İçerik part9'a ait olduğu için kapı
 * `partId: 9` ile kurulur: `isAuthorized` önce kurumun Bilge Spor Kulübü
 * paketini, sonra rolü / `allowedParts` iznini arar. Kurumda paket yoksa ya da
 * kullanıcıya verilmediyse URL elle yazılsa bile geçilemez.
 *
 * Modülün 16 bölümü sol ana menüye DEĞİL, buradaki `SportsShell` menüsüne
 * açılır: ana menüde modül tek satırdır. Kabuk part9'la aynı bileşendir,
 * yalnız `basePath` farklıdır; "Ana Sayfaya Dön" gizli çünkü Bilgeverse'in
 * kendi sol menüsü zaten duruyor.
 */
export default async function Part7SportsLayout({ children }: { children: React.ReactNode }) {
    await requireAuth({ partId: 9 });

    return (
        <SportsShell basePath="/dashboard/part7/sports" backHref={null}>
            {children}
        </SportsShell>
    );
}
