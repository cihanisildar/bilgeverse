'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TrendingDown, TrendingUp, Scale, FileBarChart } from 'lucide-react';
import { getMonthlyReport } from '@/app/actions/finance';
import { formatCurrency, getCurrencyMeta } from '@/app/lib/finance';

const MONTHS = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export default function FinanceReports() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1); // 1-12

    const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);

    const { data: report, isLoading } = useQuery({
        queryKey: ['monthly-report', year, month],
        queryFn: async () => {
            const res = await getMonthlyReport(year, month);
            if (res.error) throw new Error(res.error);
            return res.data;
        },
    });

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileBarChart className="h-4 w-4" />
                    Ay sonu raporu
                </div>
                <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                    <SelectTrigger className="w-36">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {MONTHS.map((m, i) => (
                            <SelectItem key={i} value={String(i + 1)}>
                                {m}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                    <SelectTrigger className="w-28">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map((y) => (
                            <SelectItem key={y} value={String(y)}>
                                {y}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
                </div>
            ) : !report || report.currencies.length === 0 ? (
                <Card className="border-none shadow-sm">
                    <CardContent>
                        <div className="py-12 text-center text-sm text-muted-foreground">
                            {MONTHS[month - 1]} {year} için kayıtlı işlem bulunmuyor.
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {report.currencies.map((c) => {
                        const meta = getCurrencyMeta(c.currency);
                        const netNegative = c.net < 0;
                        return (
                            <Card key={c.currency} className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg">{meta.label}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="rounded-xl bg-emerald-50 p-4">
                                            <div className="flex items-center gap-2 text-emerald-700 text-sm">
                                                <TrendingUp className="h-4 w-4" /> Toplam Gelir
                                            </div>
                                            <div className="mt-1 text-xl font-bold text-emerald-700">
                                                {formatCurrency(c.totalIncome, c.currency)}
                                            </div>
                                        </div>
                                        <div className="rounded-xl bg-rose-50 p-4">
                                            <div className="flex items-center gap-2 text-rose-700 text-sm">
                                                <TrendingDown className="h-4 w-4" /> Toplam Gider
                                            </div>
                                            <div className="mt-1 text-xl font-bold text-rose-700">
                                                {formatCurrency(c.totalExpense, c.currency)}
                                            </div>
                                        </div>
                                        <div className={`rounded-xl p-4 ${netNegative ? 'bg-rose-50' : 'bg-indigo-50'}`}>
                                            <div className={`flex items-center gap-2 text-sm ${netNegative ? 'text-rose-700' : 'text-indigo-700'}`}>
                                                <Scale className="h-4 w-4" /> Net Bakiye
                                            </div>
                                            <div className={`mt-1 text-xl font-bold ${netNegative ? 'text-rose-700' : 'text-indigo-700'}`}>
                                                {formatCurrency(c.net, c.currency)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <CategoryList
                                            title="Gelir Dağılımı"
                                            rows={c.incomeByCategory}
                                            currency={c.currency}
                                            tone="emerald"
                                        />
                                        <CategoryList
                                            title="Gider Dağılımı"
                                            rows={c.expenseByCategory}
                                            currency={c.currency}
                                            tone="rose"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function CategoryList({
    title,
    rows,
    currency,
    tone,
}: {
    title: string;
    rows: { category: string; label: string; total: number }[];
    currency: any;
    tone: 'emerald' | 'rose';
}) {
    const total = rows.reduce((acc, r) => acc + r.total, 0);
    return (
        <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
            {rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">Kayıt yok.</p>
            ) : (
                <div className="space-y-2">
                    {rows.map((r) => {
                        const pct = total > 0 ? Math.round((r.total / total) * 100) : 0;
                        return (
                            <div key={r.category}>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">{r.label}</span>
                                    <span className="font-medium">{formatCurrency(r.total, currency)}</span>
                                </div>
                                <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                                    <div
                                        className={`h-1.5 rounded-full ${tone === 'emerald' ? 'bg-emerald-400' : 'bg-rose-400'}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
