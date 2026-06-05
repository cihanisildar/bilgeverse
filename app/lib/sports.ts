import {
    FinanceCurrency,
    FinanceType,
    MembershipStatus,
    EquipmentStatus,
    MatchResult,
    TournamentStatus,
    FeeStatus,
    FeedbackStatus,
} from '@prisma/client';

/**
 * Shared constants, labels and helpers for the Bilge Spor Kulübü (part9) module.
 * Single source of truth for status taxonomies, colors and small calculations
 * (mirrors app/lib/finance.ts & app/lib/social.ts patterns).
 */

// --- #2 Üyelik durumu ---
export const MEMBERSHIP_STATUSES: {
    value: MembershipStatus;
    label: string;
    color: string;
}[] = [
    { value: 'ACTIVE', label: 'Aktif', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'PASSIVE', label: 'Pasif', color: 'bg-gray-100 text-gray-600 border-gray-200' },
    { value: 'SUSPENDED', label: 'Askıya Alındı', color: 'bg-amber-100 text-amber-700 border-amber-200' },
];

export function getMembershipMeta(value: MembershipStatus) {
    return MEMBERSHIP_STATUSES.find((s) => s.value === value) ?? MEMBERSHIP_STATUSES[0];
}

// --- #16 Ekipman durumu ---
export const EQUIPMENT_STATUSES: {
    value: EquipmentStatus;
    label: string;
    color: string;
}[] = [
    { value: 'IN_USE', label: 'Kullanımda', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'MAINTENANCE', label: 'Bakımda', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'OUT_OF_SERVICE', label: 'Kullanım Dışı', color: 'bg-red-100 text-red-700 border-red-200' },
];

export function getEquipmentStatusMeta(value: EquipmentStatus) {
    return EQUIPMENT_STATUSES.find((s) => s.value === value) ?? EQUIPMENT_STATUSES[0];
}

export const EQUIPMENT_CATEGORIES = [
    { value: 'FORMA', label: 'Forma' },
    { value: 'TOP', label: 'Top' },
    { value: 'ESOFMAN', label: 'Eşofman' },
    { value: 'AYAKKABI', label: 'Ayakkabı' },
    { value: 'EKIPMAN', label: 'Antrenman Ekipmanı' },
    { value: 'DIGER', label: 'Diğer' },
] as const;

// --- #12 Maç sonucu ---
export const MATCH_RESULTS: {
    value: MatchResult;
    label: string;
    color: string;
}[] = [
    { value: 'WIN', label: 'Galibiyet', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'DRAW', label: 'Beraberlik', color: 'bg-gray-100 text-gray-600 border-gray-200' },
    { value: 'LOSS', label: 'Mağlubiyet', color: 'bg-red-100 text-red-700 border-red-200' },
    { value: 'PENDING', label: 'Beklemede', color: 'bg-blue-100 text-blue-700 border-blue-200' },
];

export function getMatchResultMeta(value: MatchResult) {
    return MATCH_RESULTS.find((s) => s.value === value) ?? MATCH_RESULTS[3];
}

// --- #10 Turnuva durumu ---
export const TOURNAMENT_STATUSES: {
    value: TournamentStatus;
    label: string;
    color: string;
}[] = [
    { value: 'UPCOMING', label: 'Yaklaşan', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'ONGOING', label: 'Devam Ediyor', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'COMPLETED', label: 'Tamamlandı', color: 'bg-green-100 text-green-700 border-green-200' },
];

export function getTournamentStatusMeta(value: TournamentStatus) {
    return TOURNAMENT_STATUSES.find((s) => s.value === value) ?? TOURNAMENT_STATUSES[0];
}

// --- #17 Aidat durumu ---
export const FEE_STATUSES: {
    value: FeeStatus;
    label: string;
    color: string;
}[] = [
    { value: 'PAID', label: 'Ödendi', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'PENDING', label: 'Bekliyor', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'OVERDUE', label: 'Gecikmiş', color: 'bg-red-100 text-red-700 border-red-200' },
];

export function getFeeStatusMeta(value: FeeStatus) {
    return FEE_STATUSES.find((s) => s.value === value) ?? FEE_STATUSES[1];
}

// --- #21 Geri bildirim durumu ---
export const FEEDBACK_STATUSES: {
    value: FeedbackStatus;
    label: string;
    color: string;
}[] = [
    { value: 'NEW', label: 'Yeni', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'IN_REVIEW', label: 'İnceleniyor', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'RESOLVED', label: 'Çözüldü', color: 'bg-green-100 text-green-700 border-green-200' },
];

export function getFeedbackStatusMeta(value: FeedbackStatus) {
    return FEEDBACK_STATUSES.find((s) => s.value === value) ?? FEEDBACK_STATUSES[0];
}

export const FEEDBACK_CATEGORIES = [
    { value: 'REQUEST', label: 'Talep' },
    { value: 'COMPLAINT', label: 'Şikayet' },
    { value: 'SUGGESTION', label: 'Öneri' },
] as const;

export function getFeedbackCategoryLabel(value: string): string {
    return FEEDBACK_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

// --- #20 Duyuru türü ---
export const ANNOUNCEMENT_TYPES = [
    { value: 'ANNOUNCEMENT', label: 'Duyuru', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    { value: 'TRAINING_CHANGE', label: 'Antrenman Değişikliği', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'EVENT', label: 'Etkinlik', color: 'bg-green-100 text-green-700 border-green-200' },
] as const;

export function getAnnouncementTypeMeta(value: string) {
    return ANNOUNCEMENT_TYPES.find((t) => t.value === value) ?? ANNOUNCEMENT_TYPES[0];
}

// --- #9 Değerlendirme kategorileri ---
export const EVALUATION_CATEGORIES = [
    { value: 'PERFORMANS', label: 'Performans Notu' },
    { value: 'GOZLEM', label: 'Gözlem' },
    { value: 'GELISIM', label: 'Gelişim Değerlendirmesi' },
    { value: 'DAVRANIS', label: 'Davranış' },
] as const;

export function getEvaluationCategoryLabel(value: string): string {
    return EVALUATION_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

// --- #23 Spor kulübü maliye kategorileri (part9 ayrı defter) ---
export const SPORT_INCOME_CATEGORIES = [
    { value: 'AIDAT', label: 'Futbol Okulu Aidatı' },
    { value: 'BAGIS', label: 'Bağış / Sponsor' },
    { value: 'TURNUVA', label: 'Turnuva Geliri' },
    { value: 'DIGER', label: 'Diğer Gelir' },
] as const;

export const SPORT_EXPENSE_CATEGORIES = [
    { value: 'MALZEME', label: 'Malzeme / Ekipman' },
    { value: 'SAHA', label: 'Saha / Tesis Kirası' },
    { value: 'ANTRENOR', label: 'Antrenör / Personel' },
    { value: 'ULASIM', label: 'Ulaşım' },
    { value: 'TURNUVA', label: 'Turnuva / Müsabaka Gideri' },
    { value: 'DIGER', label: 'Diğer Gider' },
] as const;

export function getSportCategoryLabel(type: FinanceType, value: string): string {
    const list = type === 'EXPENSE' ? SPORT_EXPENSE_CATEGORIES : SPORT_INCOME_CATEGORIES;
    return list.find((c) => c.value === value)?.label ?? value;
}

export function sportCategoriesFor(type: FinanceType) {
    return type === 'EXPENSE' ? SPORT_EXPENSE_CATEGORIES : SPORT_INCOME_CATEGORIES;
}

// --- Para birimleri (Maliye ile aynı) ---
export const SPORT_CURRENCIES: {
    value: FinanceCurrency;
    label: string;
    symbol: string;
    unit?: string;
}[] = [
    { value: 'TL', label: 'Türk Lirası', symbol: '₺' },
    { value: 'USD', label: 'Dolar', symbol: '$' },
    { value: 'EUR', label: 'Euro', symbol: '€' },
    { value: 'GOLD', label: 'Altın', symbol: '', unit: 'gr' },
];

export function formatSportCurrency(amount: number, currency: FinanceCurrency = 'TL'): string {
    const meta = SPORT_CURRENCIES.find((c) => c.value === currency) ?? SPORT_CURRENCIES[0];
    const formatted = amount.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    if (meta.unit) return `${formatted} ${meta.unit}`;
    return `${formatted} ${meta.symbol}`.trim();
}

// --- #7 Seed disiplin yönetmeliği (suç/ceza referans listesi) ---
export const DEFAULT_DISCIPLINE_RULES: { code: string; offense: string; penalty: string }[] = [
    { code: 'D1', offense: 'Antrenmana mazeretsiz katılmamak', penalty: 'Sözlü uyarı' },
    { code: 'D2', offense: 'Tekrarlayan devamsızlık', penalty: 'Yazılı uyarı + bir maç kadro dışı' },
    { code: 'D3', offense: 'Antrenör/takım arkadaşına saygısızlık', penalty: 'Yazılı uyarı' },
    { code: 'D4', offense: 'Müsabakada sportmenliğe aykırı davranış', penalty: 'Bir müsabaka men cezası' },
    { code: 'D5', offense: 'Kulüp malzemesine kasıtlı zarar vermek', penalty: 'Zararın tazmini + uyarı' },
    { code: 'D6', offense: 'Ciddi disiplin ihlali / tekrar', penalty: 'Geçici üyelik askısı' },
];

// --- Hesaplama yardımcıları ---

/** #6 Devamsızlık oranı: (yok + izinli sayılmaz) -> sadece YOKTU / toplam. */
export function absenceRate(totalSessions: number, absentCount: number): number {
    if (totalSessions <= 0) return 0;
    return Math.round((absentCount / totalSessions) * 100);
}

/** #6 Katılım oranı yüzdesi. */
export function attendanceRate(totalSessions: number, presentCount: number): number {
    if (totalSessions <= 0) return 0;
    return Math.round((presentCount / totalSessions) * 100);
}

/** Yaş hesabı (doğum tarihinden). */
export function calcAge(birthDate?: Date | string | null): number | null {
    if (!birthDate) return null;
    const d = new Date(birthDate);
    if (isNaN(d.getTime())) return null;
    const diff = Date.now() - d.getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

/** Tarih belli gün içinde mi (lisans/sağlık raporu süre uyarısı için). */
export function isExpiringSoon(date?: Date | string | null, withinDays = 30): boolean {
    if (!date) return false;
    const d = new Date(date);
    if (isNaN(d.getTime())) return false;
    const limit = new Date();
    limit.setDate(limit.getDate() + withinDays);
    return d <= limit;
}
