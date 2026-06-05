'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import { UserRole, FinanceType, FinanceCurrency, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { getCategoryLabel } from '@/app/lib/finance';
import {
    FinanceTransaction,
    FinanceActionResponse,
    CreateTransactionData,
    UpdateTransactionData,
    FinanceFilters,
    FinanceSummary,
    CurrencyBalance,
    MonthlyReport,
    CategoryBreakdownRow,
} from '@/types/finance';

const ALL_CURRENCIES: FinanceCurrency[] = ['TL', 'USD', 'EUR', 'GOLD'];

async function checkAuth() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        throw new Error('Unauthorized');
    }

    const user = session.user as any;
    const userRoles = (user.roles || [user.role].filter(Boolean)) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);
    const isBoardMember = userRoles.includes(UserRole.BOARD_MEMBER);

    if (!isAdmin && !isBoardMember) {
        throw new Error('Unauthorized');
    }
    return session;
}

const transactionInclude = {
    createdBy: {
        select: { id: true, firstName: true, lastName: true, username: true },
    },
} satisfies Prisma.FinanceTransactionInclude;

function serialize(t: Prisma.FinanceTransactionGetPayload<{ include: typeof transactionInclude }>): FinanceTransaction {
    return {
        id: t.id,
        type: t.type,
        amount: t.amount.toNumber(),
        currency: t.currency,
        category: t.category,
        source: t.source,
        description: t.description,
        transactionDate: t.transactionDate,
        donationId: t.donationId,
        createdById: t.createdById,
        createdBy: t.createdBy,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
    };
}

export async function getFinanceTransactions(
    filters: FinanceFilters = {}
): Promise<FinanceActionResponse<FinanceTransaction[]>> {
    try {
        await checkAuth();

        const where: Prisma.FinanceTransactionWhereInput = {};
        if (filters.type) where.type = filters.type;
        if (filters.category) where.category = filters.category;
        if (filters.currency) where.currency = filters.currency;
        if (filters.from || filters.to) {
            where.transactionDate = {};
            if (filters.from) where.transactionDate.gte = filters.from;
            if (filters.to) where.transactionDate.lte = filters.to;
        }
        if (filters.search) {
            where.OR = [
                { description: { contains: filters.search, mode: 'insensitive' } },
                { source: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const transactions = await prisma.financeTransaction.findMany({
            where,
            include: transactionInclude,
            orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
        });

        return { error: null, data: transactions.map(serialize) };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'İşlemler getirilemedi';
        console.error('Error fetching finance transactions:', error);
        return { error: message, data: null };
    }
}

export async function getFinanceSummary(): Promise<FinanceActionResponse<FinanceSummary>> {
    try {
        await checkAuth();

        const grouped = await prisma.financeTransaction.groupBy({
            by: ['currency', 'type'],
            _sum: { amount: true },
            _count: { _all: true },
        });

        const balances: CurrencyBalance[] = ALL_CURRENCIES.map((currency) => {
            const income = grouped.find((g) => g.currency === currency && g.type === 'INCOME')?._sum.amount?.toNumber() ?? 0;
            const expense = grouped.find((g) => g.currency === currency && g.type === 'EXPENSE')?._sum.amount?.toNumber() ?? 0;
            return { currency, income, expense, balance: income - expense };
        });

        const transactionCount = grouped.reduce((acc, g) => acc + g._count._all, 0);

        return { error: null, data: { balances, transactionCount } };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Özet getirilemedi';
        console.error('Error fetching finance summary:', error);
        return { error: message, data: null };
    }
}

export async function createFinanceTransaction(
    data: CreateTransactionData
): Promise<FinanceActionResponse<FinanceTransaction>> {
    try {
        const session = await checkAuth();

        if (!data.amount || data.amount <= 0) {
            return { error: 'Tutar 0’dan büyük olmalıdır', data: null };
        }
        if (!data.category) {
            return { error: 'Kategori seçilmelidir', data: null };
        }

        const transaction = await prisma.financeTransaction.create({
            data: {
                type: data.type,
                amount: new Prisma.Decimal(data.amount),
                currency: data.currency,
                category: data.category,
                source: data.source?.trim() || null,
                description: data.description?.trim() || null,
                transactionDate: data.transactionDate,
                createdById: (session.user as any).id ?? null,
            },
            include: transactionInclude,
        });

        revalidatePath('/dashboard/part8');
        return { error: null, data: serialize(transaction) };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'İşlem oluşturulamadı';
        console.error('Error creating finance transaction:', error);
        return { error: message, data: null };
    }
}

export async function updateFinanceTransaction(
    id: string,
    data: UpdateTransactionData
): Promise<FinanceActionResponse<FinanceTransaction>> {
    try {
        await checkAuth();

        const existing = await prisma.financeTransaction.findUnique({ where: { id } });
        if (!existing) return { error: 'İşlem bulunamadı', data: null };
        if (existing.donationId) {
            return {
                error: 'Bu gelir kaydı bir bağışa bağlıdır. Düzeltme için Bağışçılar bölümünü kullanın.',
                data: null,
            };
        }
        if (data.amount !== undefined && data.amount <= 0) {
            return { error: 'Tutar 0’dan büyük olmalıdır', data: null };
        }

        const transaction = await prisma.financeTransaction.update({
            where: { id },
            data: {
                ...(data.amount !== undefined ? { amount: new Prisma.Decimal(data.amount) } : {}),
                ...(data.currency !== undefined ? { currency: data.currency } : {}),
                ...(data.category !== undefined ? { category: data.category } : {}),
                ...(data.source !== undefined ? { source: data.source?.trim() || null } : {}),
                ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
                ...(data.transactionDate !== undefined ? { transactionDate: data.transactionDate } : {}),
            },
            include: transactionInclude,
        });

        revalidatePath('/dashboard/part8');
        return { error: null, data: serialize(transaction) };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'İşlem güncellenemedi';
        console.error('Error updating finance transaction:', error);
        return { error: message, data: null };
    }
}

export async function deleteFinanceTransaction(
    id: string
): Promise<{ error: string | null; success: boolean }> {
    try {
        await checkAuth();

        const existing = await prisma.financeTransaction.findUnique({ where: { id } });
        if (!existing) return { error: 'İşlem bulunamadı', success: false };
        if (existing.donationId) {
            return {
                error: 'Bu gelir kaydı bir bağışa bağlıdır. Silmek için Bağışçılar bölümünden ilgili bağışı silin.',
                success: false,
            };
        }

        await prisma.financeTransaction.delete({ where: { id } });

        revalidatePath('/dashboard/part8');
        return { error: null, success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'İşlem silinemedi';
        console.error('Error deleting finance transaction:', error);
        return { error: message, success: false };
    }
}

/**
 * Auto-generated monthly report (req 7): total income, total expense,
 * category-based distribution and net balance — computed per currency.
 */
export async function getMonthlyReport(
    year: number,
    month: number
): Promise<FinanceActionResponse<MonthlyReport>> {
    try {
        await checkAuth();

        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1); // exclusive upper bound

        const grouped = await prisma.financeTransaction.groupBy({
            by: ['currency', 'type', 'category'],
            where: { transactionDate: { gte: start, lt: end } },
            _sum: { amount: true },
            _count: { _all: true },
        });

        const usedCurrencies = ALL_CURRENCIES.filter((c) => grouped.some((g) => g.currency === c));

        const currencies = usedCurrencies.map((currency) => {
            const rows = grouped.filter((g) => g.currency === currency);

            const buildBreakdown = (type: FinanceType): CategoryBreakdownRow[] =>
                rows
                    .filter((r) => r.type === type)
                    .map((r) => ({
                        category: r.category,
                        label: getCategoryLabel(type, r.category),
                        total: r._sum.amount?.toNumber() ?? 0,
                    }))
                    .sort((a, b) => b.total - a.total);

            const incomeByCategory = buildBreakdown('INCOME');
            const expenseByCategory = buildBreakdown('EXPENSE');
            const totalIncome = incomeByCategory.reduce((acc, r) => acc + r.total, 0);
            const totalExpense = expenseByCategory.reduce((acc, r) => acc + r.total, 0);

            return {
                currency,
                totalIncome,
                totalExpense,
                net: totalIncome - totalExpense,
                incomeByCategory,
                expenseByCategory,
            };
        });

        const transactionCount = grouped.reduce((acc, g) => acc + g._count._all, 0);

        return { error: null, data: { year, month, currencies, transactionCount } };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Rapor oluşturulamadı';
        console.error('Error generating monthly report:', error);
        return { error: message, data: null };
    }
}
