'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import { FinanceCurrency, FinanceType } from '@prisma/client';
import { categoriesFor, formatCurrency, getCategoryLabel } from '@/app/lib/finance';
import { FinanceTransaction } from '@/types/finance';
import { getFinanceTransactions } from '@/app/actions/finance';
import TransactionDialog from './TransactionDialog';
import TransactionTable from './TransactionTable';

interface LedgerTabProps {
    type: FinanceType;
}

/** Sum transaction amounts grouped by currency. */
function sumByCurrency(items: FinanceTransaction[]): { currency: FinanceCurrency; total: number }[] {
    const map = new Map<FinanceCurrency, number>();
    for (const t of items) {
        map.set(t.currency, (map.get(t.currency) ?? 0) + t.amount);
    }
    return Array.from(map.entries()).map(([currency, total]) => ({ currency, total }));
}

export default function LedgerTab({ type }: LedgerTabProps) {
    const isIncome = type === 'INCOME';
    const categories = categoriesFor(type);

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<FinanceTransaction | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['finance-transactions', type, search, categoryFilter],
        queryFn: async () => {
            const res = await getFinanceTransactions({
                type,
                search: search || undefined,
                category: categoryFilter === 'ALL' ? undefined : categoryFilter,
            });
            if (res.error) throw new Error(res.error);
            return res.data ?? [];
        },
    });

    const transactions = data ?? [];

    // For expenses, group by category (req 5: show expenses under category headings).
    const grouped = useMemo(() => {
        if (isIncome) return null;
        const byCat = new Map<string, FinanceTransaction[]>();
        for (const t of transactions) {
            if (!byCat.has(t.category)) byCat.set(t.category, []);
            byCat.get(t.category)!.push(t);
        }
        return categories
            .map((c) => ({ category: c.value, label: c.label, items: byCat.get(c.value) ?? [] }))
            .filter((g) => g.items.length > 0);
    }, [transactions, isIncome, categories]);

    const openAdd = () => {
        setEditing(null);
        setDialogOpen(true);
    };
    const openEdit = (t: FinanceTransaction) => {
        setEditing(t);
        setDialogOpen(true);
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-1 flex-col sm:flex-row gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Kaynak / açıklama ara..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-full sm:w-52">
                            <SelectValue placeholder="Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tüm kategoriler</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                    {c.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    onClick={openAdd}
                    className={
                        isIncome
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {isIncome ? 'Yeni Gelir' : 'Yeni Gider'}
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
                </div>
            ) : isIncome ? (
                <Card className="border-none shadow-sm">
                    <CardContent className="pt-6">
                        <TransactionTable
                            transactions={transactions}
                            onEdit={openEdit}
                            emptyText="Henüz gelir kaydı yok."
                        />
                    </CardContent>
                </Card>
            ) : grouped && grouped.length > 0 ? (
                <div className="space-y-4">
                    {grouped.map((g) => (
                        <Card key={g.category} className="border-none shadow-sm">
                            <CardHeader className="pb-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <CardTitle className="text-base">{g.label}</CardTitle>
                                    <div className="flex flex-wrap gap-3 text-sm font-semibold text-rose-600">
                                        {sumByCurrency(g.items).map((s) => (
                                            <span key={s.currency}>{formatCurrency(s.total, s.currency)}</span>
                                        ))}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <TransactionTable transactions={g.items} onEdit={openEdit} hideCategory />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-none shadow-sm">
                    <CardContent>
                        <div className="py-12 text-center text-sm text-muted-foreground">
                            Henüz gider kaydı yok.
                        </div>
                    </CardContent>
                </Card>
            )}

            <TransactionDialog
                isOpen={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                    setEditing(null);
                }}
                type={type}
                transaction={editing}
            />
        </div>
    );
}
