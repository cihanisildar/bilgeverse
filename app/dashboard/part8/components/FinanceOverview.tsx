'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { getFinanceSummary } from '@/app/actions/finance';
import { formatCurrency, getCurrencyMeta } from '@/app/lib/finance';

export default function FinanceOverview() {
    const { data: summary, isLoading } = useQuery({
        queryKey: ['finance-summary'],
        queryFn: async () => {
            const res = await getFinanceSummary();
            if (res.error) throw new Error(res.error);
            return res.data;
        },
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
                ))}
            </div>
        );
    }

    const balances = (summary?.balances ?? []).filter(
        (b) => b.currency === 'TL' || b.income > 0 || b.expense > 0
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {balances.map((b) => {
                const meta = getCurrencyMeta(b.currency);
                const negative = b.balance < 0;
                return (
                    <Card key={b.currency} className="border-none shadow-sm bg-white overflow-hidden">
                        <div className={`h-1.5 ${negative ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                        <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {meta.label} Kasa
                            </CardTitle>
                            <Wallet className={`h-4 w-4 ${negative ? 'text-rose-500' : 'text-emerald-500'}`} />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className={`text-2xl font-bold ${negative ? 'text-rose-600' : 'text-gray-900'}`}>
                                {formatCurrency(b.balance, b.currency)}
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1 text-emerald-600">
                                    <TrendingUp className="h-3 w-3" />
                                    {formatCurrency(b.income, b.currency)}
                                </span>
                                <span className="flex items-center gap-1 text-rose-500">
                                    <TrendingDown className="h-3 w-3" />
                                    {formatCurrency(b.expense, b.currency)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
