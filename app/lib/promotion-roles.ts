import { UserRole } from '@prisma/client';

/**
 * Terfi sisteminin rol sözlüğü.
 *
 * Etiketler uygulamanın geri kalanıyla aynı: TUTOR = "Rehber",
 * ASISTAN = "Lider", BOARD_MEMBER = "Yönetim Kurulu Üyesi". (Terfi ekranları
 * eskiden TUTOR'a "Öğretmen" diyordu; Kullanıcı Yönetimi, haftalık raporlar ve
 * sol menü hep "Rehber"/"Lider" dediği için burası onlara hizalandı.)
 *
 * Dosya BİLİNÇLİ olarak saf: hem server action'lardan hem client
 * bileşenlerinden import ediliyor.
 */
export const ROLE_LABELS: Record<string, string> = {
    [UserRole.ADMIN]: 'Yönetici',
    [UserRole.BOARD_MEMBER]: 'Yönetim Kurulu Üyesi',
    [UserRole.TUTOR]: 'Rehber',
    [UserRole.ASISTAN]: 'Lider',
    [UserRole.STUDENT]: 'Öğrenci',
    [UserRole.DONOR]: 'Bağışçı',
    [UserRole.ATHLETE]: 'Sporcu',
};

export function roleLabel(role: string | null | undefined): string {
    return (role && ROLE_LABELS[role]) || role || '—';
}

/** Bir kullanıcının rollerini "Rehber, Lider" gibi tek satıra çevirir. */
export function rolesLabel(roles: string[] | null | undefined, fallback?: string | null): string {
    const list = (roles ?? []).filter(Boolean);
    if (list.length === 0) return roleLabel(fallback);
    return list.map(roleLabel).join(', ');
}

export interface PromotionTarget {
    value: UserRole;
    label: string;
    description: string;
}

/**
 * Terfi ile verilebilecek hedef roller.
 *
 * ADMIN bilinçli olarak YOK: yönetici yetkisi terfi süreciyle değil, Kullanıcı
 * Yönetimi'nden elle verilir.
 */
export const PROMOTION_TARGETS: PromotionTarget[] = [
    {
        value: UserRole.TUTOR,
        label: 'Rehber',
        description: 'Kendi grubunu yönetir, yoklama alır, puan verir',
    },
    {
        value: UserRole.ASISTAN,
        label: 'Lider',
        description: 'Bir rehbere yardım eder; onaylarken hangi rehbere bağlanacağı seçilir',
    },
    {
        value: UserRole.BOARD_MEMBER,
        label: 'Yönetim Kurulu Üyesi',
        description: 'Yönetim Kurulu bölümüne erişir; onaylanınca kurul listesine eklenir',
    },
];

export const PROMOTION_TARGET_VALUES = PROMOTION_TARGETS.map((t) => t.value) as UserRole[];

export function isPromotionTarget(v: unknown): v is UserRole {
    return typeof v === 'string' && (PROMOTION_TARGET_VALUES as string[]).includes(v);
}

/** Terfi havuzuna girebilecek mevcut roller (kurul üyesi ve yönetici hariç). */
export const PROMOTABLE_FROM_ROLES: UserRole[] = [
    UserRole.STUDENT,
    UserRole.ASISTAN,
    UserRole.TUTOR,
];
