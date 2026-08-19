/**
 * Multi-tenant sabitleri.
 *
 * Bu id'ler ELLE yazılmıştır ve asla üretilmez; bootstrap script'leri ve
 * şemadaki `@default(...)` aynı literal'lere bakar. Değiştirilirse
 * `prisma/schema.prisma` da güncellenmelidir.
 */

/** Mevcut (tek) kurumun id'si — göç sırasında tüm eski satırlar buraya bağlanır. */
export const ROOT_ORG_ID = 'org_bilgeder_000000000000001';
export const ROOT_ORG_CODE = 'BILGEDER';
export const ROOT_ORG_NAME = 'Bilgeder';

/** Süper adminlerin bağlı olduğu rezerve kurum. Hiçbir paketi yoktur. */
export const SYSTEM_ORG_ID = 'org_system_00000000000000001';
export const SYSTEM_ORG_CODE = 'SYSTEM';
export const SYSTEM_ORG_NAME = 'Sistem Yönetimi';

/** Kullanıcının giremeyeceği, rezerve kurum kodları. */
export const RESERVED_ORG_CODES = [SYSTEM_ORG_CODE];

/**
 * `organizationId` kolonlarının veritabanı varsayılanı.
 *
 * Göç sırasında varsayılan ROOT_ORG_ID idi; eski satırlar tek seferde
 * doldurulsun diye. Artık öyle DEĞİL ve bu bilinçli:
 *
 *   Prisma extension'ı her yazmaya `organizationId` enjekte eder. Bir gün bir
 *   yazma yolu bu enjeksiyonu atlarsa (iç içe ilişki create'i gibi), varsayılan
 *   hâlâ ROOT_ORG_ID olsaydı satır SESSİZCE Bilgeder'e yazılırdı — yani başka
 *   bir kurumun verisi kök kuruma karışırdı. Bu sentinel ile o satır hiçbir
 *   kuruma ait olmaz: kimse göremez (fail-closed) ve
 *   `scripts/audit-tenant-rows.ts` onu "geçersiz kuruma bağlı" olarak yakalar.
 *
 * Şemada `@default(...)` olarak KALMASININ sebebi tip ergonomisi: varsayılan
 * kaldırılırsa Prisma `organizationId`'yi her `create` çağrısında zorunlu hâle
 * getirir ve 800'den fazla çağrı yeri derlenmez.
 */
export const NO_ORG_SENTINEL = '__NO_ORG__';

/** Kurum kodunu normalize eder (girişte ve kayıtta aynı fonksiyon kullanılır). */
export function normalizeOrgCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Kurum kodu kurallarını doğrular. Kod hem oluşturmada hem düzenlemede
 * aynı kurallardan geçsin diye tek yerde tutulur.
 *
 * Hata varsa mesaj, geçerliyse null döner.
 */
export function validateOrgCode(code: string): string | null {
  const normalized = normalizeOrgCode(code);

  if (RESERVED_ORG_CODES.includes(normalized)) {
    return `"${normalized}" rezerve bir kurum kodudur, kullanılamaz.`;
  }
  if (!/^[A-Z0-9_-]{3,20}$/.test(normalized)) {
    return 'Kurum kodu 3-20 karakter olmalı ve yalnız harf, rakam, - ve _ içermelidir.';
  }
  return null;
}
