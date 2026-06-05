import { FinanceCurrency, FinanceType } from '@prisma/client';

/**
 * Shared constants and labels for the Maliye (Finance) module.
 * Categories are stored as plain strings on FinanceTransaction.category so that
 * income and expense taxonomies can evolve independently.
 */

// --- Expense categories (req: personel / kira / etkinlik / dernek malzeme) ---
export const EXPENSE_CATEGORIES = [
    { value: 'PERSONEL', label: 'Personel Gideri' },
    { value: 'KIRA', label: 'Kira Gideri' },
    { value: 'ETKINLIK', label: 'Etkinlik Gideri' },
    { value: 'MALZEME', label: 'Dernek Malzeme Gideri' },
    { value: 'DIGER', label: 'Diğer Gider' },
] as const;

// --- Income sources / categories (req: bağış / ödeme / diğer gelirler) ---
export const INCOME_CATEGORIES = [
    { value: 'BAGIS', label: 'Bağış' },
    { value: 'ODEME', label: 'Ödeme' },
    { value: 'DIGER', label: 'Diğer Gelir' },
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['value'];
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number]['value'];

export function getCategoryLabel(type: FinanceType, value: string): string {
    const list = type === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    return list.find((c) => c.value === value)?.label ?? value;
}

export function categoriesFor(type: FinanceType) {
    return type === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
}

// --- Currencies (req: TL / DOLAR / EURO / ALTIN) ---
export const CURRENCIES: {
    value: FinanceCurrency;
    label: string;
    symbol: string;
    /** unit shown after the amount, e.g. "gr" for gold */
    unit?: string;
}[] = [
    { value: 'TL', label: 'Türk Lirası', symbol: '₺' },
    { value: 'USD', label: 'Dolar', symbol: '$' },
    { value: 'EUR', label: 'Euro', symbol: '€' },
    { value: 'GOLD', label: 'Altın', symbol: '', unit: 'gr' },
];

export const CURRENCY_VALUES: FinanceCurrency[] = CURRENCIES.map((c) => c.value);

export function getCurrencyMeta(currency: FinanceCurrency) {
    return CURRENCIES.find((c) => c.value === currency) ?? CURRENCIES[0];
}

/**
 * Format an amount with its currency symbol/unit using Turkish locale.
 * e.g. formatCurrency(1500, 'TL') -> "1.500,00 ₺"; formatCurrency(15, 'GOLD') -> "15,00 gr"
 */
export function formatCurrency(amount: number, currency: FinanceCurrency): string {
    const meta = getCurrencyMeta(currency);
    const formatted = amount.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    if (meta.unit) return `${formatted} ${meta.unit}`;
    return `${formatted} ${meta.symbol}`.trim();
}

/** Map a free-text donation currency string to a FinanceCurrency enum value. */
export function mapDonationCurrency(currency?: string | null): FinanceCurrency {
    switch ((currency || 'TL').toUpperCase()) {
        case 'USD':
        case 'DOLAR':
        case '$':
            return 'USD';
        case 'EUR':
        case 'EURO':
        case '€':
            return 'EUR';
        case 'GOLD':
        case 'ALTIN':
            return 'GOLD';
        default:
            return 'TL';
    }
}
