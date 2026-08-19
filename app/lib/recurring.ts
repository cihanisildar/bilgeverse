import { addWeeks, addMonths, addYears } from 'date-fns';

/**
 * Süreli işlerin tekrar aralığı.
 *
 * Amaç: aynı iş her seferinde yeniden kaydedilmesin. İş bir kez tanımlanır,
 * "yapıldı" işaretlendiğinde kapanmaz — hedef tarihi bir sonraki tekrara ilerler.
 *
 * Bu dosya BİLİNÇLİ olarak saf tutulur (Prisma/oturum bağımlılığı yok), çünkü
 * hem server action'lardan hem client bileşenlerden import ediliyor.
 */
export const REPEAT_OPTIONS = [
    { value: 'NONE', label: 'Tekrarsız (tek seferlik)', short: 'Tek seferlik' },
    { value: 'WEEKLY', label: 'Haftada 1', short: 'Haftalık' },
    { value: 'MONTHLY', label: 'Ayda 1', short: 'Aylık' },
    { value: 'QUARTERLY', label: '3 ayda 1', short: '3 aylık' },
    { value: 'YEARLY', label: 'Yılda 1', short: 'Yıllık' },
] as const;

export type RepeatKind = (typeof REPEAT_OPTIONS)[number]['value'];

const VALUES = REPEAT_OPTIONS.map((o) => o.value) as readonly string[];

export function isRepeatKind(v: unknown): v is RepeatKind {
    return typeof v === 'string' && VALUES.includes(v);
}

export function repeatShortLabel(v: string): string {
    return REPEAT_OPTIONS.find((o) => o.value === v)?.short ?? 'Tek seferlik';
}

/** Bir tekrarın üzerine bir periyot ekler. */
function addOne(date: Date, repeat: RepeatKind): Date | null {
    switch (repeat) {
        case 'WEEKLY': return addWeeks(date, 1);
        case 'MONTHLY': return addMonths(date, 1);
        case 'QUARTERLY': return addMonths(date, 3);
        case 'YEARLY': return addYears(date, 1);
        default: return null;
    }
}

/**
 * `from` tarihinden sonraki ilk tekrar tarihi.
 *
 * İş uzun süre yapılmamışsa hedef tarih geçmişte kalmış olabilir; bu durumda
 * bugünü geçene kadar ilerletilir — yoksa "yapıldı" demek işi hâlâ gecikmiş
 * gösterirdi. Sonsuz döngüye karşı adım sayısı sınırlı.
 */
export function nextDueDate(from: Date, repeat: string, now: Date = new Date()): Date | null {
    if (!isRepeatKind(repeat) || repeat === 'NONE') return null;
    let next = addOne(from, repeat);
    if (!next) return null;
    for (let i = 0; i < 500 && next <= now; i++) {
        const step = addOne(next, repeat);
        if (!step) break;
        next = step;
    }
    return next;
}

/**
 * Hedef tarihe kalan gün sayısı; 0 = bugün, negatif = gecikmiş.
 * Saat farkı sonucu bozmasın diye iki taraf da gün başına çekiliyor.
 */
export function daysUntil(due: Date | string, now: Date = new Date()): number {
    const d = new Date(due);
    d.setHours(0, 0, 0, 0);
    const n = new Date(now);
    n.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - n.getTime()) / (1000 * 60 * 60 * 24));
}

/** İş hatırlatma penceresine girdi mi? (kendi leadDays değerine göre) */
export function isDueForReminder(task: { dueDate: Date | string; leadDays: number; isDone: boolean }, now: Date = new Date()): boolean {
    if (task.isDone) return false;
    return daysUntil(task.dueDate, now) <= (task.leadDays ?? 7);
}
