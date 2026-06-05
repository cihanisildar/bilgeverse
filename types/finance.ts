import { FinanceCurrency, FinanceType } from '@prisma/client';

export interface FinanceTransaction {
    id: string;
    type: FinanceType;
    amount: number;
    currency: FinanceCurrency;
    category: string;
    source: string | null;
    description: string | null;
    transactionDate: Date;
    donationId: string | null;
    createdById: string | null;
    createdBy?: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
    } | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface FinanceActionResponse<T> {
    error: string | null;
    data: T | null;
}

export interface CreateTransactionData {
    type: FinanceType;
    amount: number;
    currency: FinanceCurrency;
    category: string;
    source?: string | null;
    description?: string | null;
    transactionDate: Date;
}

export interface UpdateTransactionData {
    amount?: number;
    currency?: FinanceCurrency;
    category?: string;
    source?: string | null;
    description?: string | null;
    transactionDate?: Date;
}

export interface FinanceFilters {
    type?: FinanceType;
    category?: string;
    currency?: FinanceCurrency;
    from?: Date;
    to?: Date;
    search?: string;
}

/** Per-currency balance + income/expense totals. */
export interface CurrencyBalance {
    currency: FinanceCurrency;
    income: number;
    expense: number;
    balance: number;
}

export interface FinanceSummary {
    balances: CurrencyBalance[];
    transactionCount: number;
}

export interface CategoryBreakdownRow {
    category: string;
    label: string;
    total: number;
}

/** Auto-generated monthly report (req 7). */
export interface MonthlyReport {
    year: number;
    month: number; // 1-12
    /** per-currency income/expense/net for the month */
    currencies: {
        currency: FinanceCurrency;
        totalIncome: number;
        totalExpense: number;
        net: number;
        incomeByCategory: CategoryBreakdownRow[];
        expenseByCategory: CategoryBreakdownRow[];
    }[];
    transactionCount: number;
}
