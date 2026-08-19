import { requireAuth } from '@/app/lib/auth-utils';
import React from 'react';
import SocialShell from '@/app/dashboard/part6/_components/SocialShell';

/**
 * Sosyal Medya'nın (part6) Bilgeverse (part7) içindeki bölümü.
 *
 * Spor Kulübü bölümüyle aynı kalıp: rotalar part7 altında olduğu için kullanıcı
 * Bilgeverse kabuğundan çıkmaz, ama içerik part6'ya ait olduğundan kapı
 * `partId: 6` ile kurulur — kurumda Sosyal Medya paketi yoksa ya da kullanıcıya
 * verilmediyse URL elle yazılsa bile geçilemez.
 *
 * Bölümler (İçerikler, Takvim, Fikir Havuzu...) sol ana menüye değil buradaki
 * `SocialShell` menüsüne açılır; ana menüde modül tek satırdır.
 */
export default async function Part7SocialLayout({ children }: { children: React.ReactNode }) {
    await requireAuth({ partId: 6 });

    return (
        <SocialShell basePath="/dashboard/part7/social" backHref={null}>
            {children}
        </SocialShell>
    );
}
