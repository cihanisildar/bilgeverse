/**
 * Satılabilir paketler ve içerdikleri modüller (part).
 *
 * Uygulama zaten `app/lib/parts.tsx` içinde 11 numaralı modüle bölünmüş durumda;
 * paketler bunların üstüne bir gruplama katmanıdır. Bir kuruma paket açılır,
 * gerekirse tekil modül eklenir (`extraParts`) veya çıkarılır (`excludedParts`).
 *
 * Paketler DB'de `Int[]` olarak tutulur (Postgres enum değil): ileride 5. paket
 * eklemek veya bir modülü başka pakete taşımak böylece salt kod değişikliği olur,
 * migration gerektirmez.
 */

export interface PackageDef {
  id: number;
  /** Kısa ad — süper admin panelinde ve rozetlerde kullanılır */
  name: string;
  /** Müşteriye gösterilen tam ad */
  label: string;
  description: string;
  parts: number[];
}

export const PACKAGES: PackageDef[] = [
  {
    id: 1,
    name: 'Bilgeverse',
    label: 'Paket 1 — Bilgeverse',
    description:
      'Puan ve tecrübe yönetimi, liderlik tablosu, mağaza, kullanıcı ve dönem yönetimi, raporlar, duyuru panosu, istek ve dilek kutusu',
    parts: [7],
  },
  {
    id: 2,
    name: 'Değerler Halkası',
    label: 'Paket 2 — Değerler Halkası',
    description: 'Değerler Halkası, beceri atölyeleri ve akademi',
    parts: [2, 4, 11],
  },
  {
    id: 3,
    name: 'Kurumsallık',
    label: 'Paket 3 — Kurumsallık Paketi',
    description:
      'Yönetim kurulu, insan kaynağı, gençlik merkezi, maliye, spor kulübü ve sosyal medya',
    parts: [1, 3, 6, 8, 9, 10],
  },
  {
    id: 4,
    name: 'Koçluk ve Danışmanlık',
    label: 'Paket 4 — Koçluk ve Danışmanlık',
    description: 'Koçluk ve danışmanlık süreçleri',
    parts: [5],
  },
];

export const PACKAGE_IDS = PACKAGES.map((p) => p.id);

/** Herhangi bir pakette yer alan tüm modüller (kapsam testi için). */
export const ALL_PACKAGED_PARTS = Array.from(
  new Set(PACKAGES.flatMap((p) => p.parts))
).sort((a, b) => a - b);

export interface OrgEntitlements {
  packageIds: number[];
  extraParts: number[];
  excludedParts: number[];
}

/**
 * Kurumun açık modül (part) listesini hesaplar.
 * Sıra önemli: `excludedParts` her zaman kazanır, böylece bir modülün
 * geri alınması belirsizliğe yer bırakmaz.
 */
export function getOrgAllowedParts(org: Partial<OrgEntitlements> | null | undefined): number[] {
  if (!org) return [];
  const enabled = new Set<number>();

  for (const pkg of PACKAGES) {
    if (org.packageIds?.includes(pkg.id)) {
      for (const partId of pkg.parts) enabled.add(partId);
    }
  }
  for (const partId of org.extraParts ?? []) enabled.add(partId);
  for (const partId of org.excludedParts ?? []) enabled.delete(partId);

  return Array.from(enabled).sort((a, b) => a - b);
}

/** Bir modülün hangi pakete ait olduğunu döndürür (süper admin arayüzü için). */
export function getPackageForPart(partId: number): PackageDef | undefined {
  return PACKAGES.find((p) => p.parts.includes(partId));
}
