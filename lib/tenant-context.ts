import { AsyncLocalStorage } from 'async_hooks';
import * as React from 'react';
import { getServerSession } from 'next-auth';

/**
 * `React.cache` yalnızca React/Next çalışma zamanında vardır. Bu modül
 * `scripts/**` içinden düz Node ile de yükleniyor (tsx); orada `cache`
 * tanımsız olduğu için import anında patlardı. Yoksa kimliğe dönen bir
 * sarmalayıcı kullanılır — script'lerde zaten oturum yok, bağlam
 * AsyncLocalStorage'dan geliyor, dolayısıyla önbelleğe gerek de yok.
 */
const requestCache: <T extends (...args: any[]) => any>(fn: T) => T =
  typeof (React as any).cache === 'function'
    ? (React as any).cache
    : (fn) => fn;

/**
 * İstek başına kurum (tenant) bağlamı.
 *
 * `lib/prisma.ts` içindeki tenant extension bu bağlamı okuyup her sorguya
 * `organizationId` filtresi ekler. İki kaynak vardır:
 *
 *  1. **Açık geçersiz kılma (AsyncLocalStorage).** Script'ler, süper admin
 *     işlemleri ve oturumun henüz olmadığı akışlar (login, herkese açık QR /
 *     müfredat sayfaları) `runAsOrg` / `runUnscoped` ile bağlamı kendileri
 *     kurar. Her zaman önceliklidir.
 *
 *  2. **Oturum.** Diğer her yerde bağlam `getServerSession` ile çözülür.
 *     Bu, Next 14 App Router'da server component / route handler / server
 *     action üçünde de çalışır — `next/headers` ile aynı mekanizma.
 *
 * Neden middleware'in enjekte ettiği header değil: o yaklaşım middleware
 * matcher'ının tüm rotaları kapsamasını gerektirir ve dışarıdan gönderilen
 * sahte bir `x-org-id` header'ına karşı her kod yolunda temizlik yapmayı
 * zorunlu kılar. Oturumdan okumak bu saldırı yüzeyini tamamen ortadan kaldırır.
 */

export interface TenantContext {
  organizationId: string | null;
  /** true ise sorgulara hiç kurum filtresi eklenmez (süper admin / script). */
  bypass?: boolean;
}

export class MissingTenantContextError extends Error {
  constructor(detail: string) {
    super(
      `Kurum bağlamı yok (${detail}). Bu sorgu bir oturum içinde çalışmıyorsa ` +
      `runAsOrg() veya runUnscoped() ile sarmalanmalıdır.`
    );
    this.name = 'MissingTenantContextError';
  }
}

const als = new AsyncLocalStorage<TenantContext>();

/**
 * Oturumdan kurumu çözer. `cache()` istek kapsamlıdır: bir istekte yüzlerce
 * sorgu olsa da JWT yalnız bir kez çözülür.
 */
const orgIdFromSession = requestCache(async (): Promise<string | null> => {
  try {
    // Dinamik import bilinçli: statik import
    //   lib/prisma → lib/tenant-context → auth.config → lib/prisma
    // şeklinde dairesel bir bağımlılık oluşturuyor. Modül yükleme sırasına
    // bağlı kırılganlığı tamamen ortadan kaldırmak için çağrı anında yüklenir.
    const { authOptions } = await import('@/app/api/auth/[...nextauth]/auth.config');
    const session = await getServerSession(authOptions);
    return session?.user?.organizationId ?? null;
  } catch {
    // İstek kapsamı dışında (build, script) oturum okunamaz.
    return null;
  }
});

export async function getTenantContext(): Promise<TenantContext | null> {
  const override = als.getStore();
  if (override) return override;

  const organizationId = await orgIdFromSession();
  return organizationId ? { organizationId } : null;
}

/** Belirli bir kurum adına çalıştırır (script'ler, herkese açık token akışları). */
export function runAsOrg<T>(organizationId: string, fn: () => Promise<T>): Promise<T> {
  return als.run({ organizationId }, fn);
}

/**
 * Kurum filtresi olmadan çalıştırır. Yalnızca süper admin işlemleri, login
 * akışı ve bakım script'leri için. Kullanımı `lib/prisma.ts` başındaki
 * allowlist ile sınırlıdır.
 */
export function runUnscoped<T>(fn: () => Promise<T>): Promise<T> {
  return als.run({ organizationId: null, bypass: true }, fn);
}
