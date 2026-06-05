'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Wallet, Plus, Trash2, TrendingUp, TrendingDown, Scale, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSportTransactions, useSportFinanceSummary, useCreateSportTransaction, useDeleteSportTransaction } from '@/app/hooks/use-sports';
import { SPORT_INCOME_CATEGORIES, SPORT_EXPENSE_CATEGORIES, SPORT_CURRENCIES, getSportCategoryLabel, sportCategoriesFor, formatSportCurrency } from '@/app/lib/sports';
import { ReqMark, RequiredLegend } from './ReqMark';
import { format } from 'date-fns';

const EMPTY_FORM = { type: 'INCOME', amount: '', currency: 'TL', category: 'AIDAT', description: '', date: format(new Date(), 'yyyy-MM-dd') };

export default function SportsFinance() {
    const [typeFilter, setTypeFilter] = useState<string>('all');

    const { data: txs = [] } = useSportTransactions(typeFilter === 'all' ? undefined : { type: typeFilter as any });
    const { data: summary } = useSportFinanceSummary();
    const createTransaction = useCreateSportTransaction();
    const deleteTransaction = useDeleteSportTransaction();

    const [dialog, setDialog] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const onTypeChange = (type: string) => {
        const cats = sportCategoriesFor(type as any);
        setForm({ ...form, type, category: cats[0].value });
    };

    const save = () => {
        if (!form.amount) { toast.error('Tutar gerekli'); return; }
        createTransaction.mutate({
            type: form.type as any,
            amount: parseFloat(form.amount),
            currency: form.currency as any,
            category: form.category,
            description: form.description,
            transactionDate: new Date(form.date),
        }, {
            onSuccess: (res) => {
                if (!res.error) {
                    setDialog(false);
                    setForm(EMPTY_FORM);
                }
            },
        });
    };

    const confirmDelete = () => {
        if (!deletingId) return;
        deleteTransaction.mutate(deletingId);
        setDeletingId(null);
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-emerald-500" /> Spor Kulübü Maliyesi
                    </h2>
                    <p className="text-sm text-gray-500">Kulübe özel gelir/gider defteri (genel Maliye'den ayrı).</p>
                </div>
                <Button onClick={() => setDialog(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white"><Plus className="h-4 w-4 mr-2" /> Kayıt Ekle</Button>
            </div>

            {/* Summary */}
            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { l: 'Gelir', v: summary.income, icon: TrendingUp, c: 'text-green-600 bg-green-50' },
                        { l: 'Gider', v: summary.expense, icon: TrendingDown, c: 'text-red-600 bg-red-50' },
                        { l: 'Bakiye', v: summary.balance, icon: Scale, c: 'text-indigo-600 bg-indigo-50' },
                        { l: 'Futbol Okulu Tahsilatı', v: summary.duesIncome, icon: GraduationCap, c: 'text-amber-600 bg-amber-50' },
                    ].map((s) => {
                        const Icon = s.icon;
                        return (
                            <Card key={s.l} className="border-gray-100 shadow-sm">
                                <CardContent className="p-4">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.c}`}><Icon className="h-4 w-4" /></div>
                                    <p className="text-lg font-extrabold text-gray-900">{formatSportCurrency(s.v)}</p>
                                    <p className="text-[11px] text-gray-500">{s.l}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700">İşlemler</h3>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Tür" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tümü</SelectItem>
                        <SelectItem value="INCOME">Gelir</SelectItem>
                        <SelectItem value="EXPENSE">Gider</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card className="border-gray-100 shadow-sm">
                <CardContent className="p-0">
                    {txs.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">İşlem kaydı yok.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                                        <th className="px-4 py-3">Tarih</th>
                                        <th className="px-4 py-3">Kategori</th>
                                        <th className="px-4 py-3">Açıklama</th>
                                        <th className="px-4 py-3 text-right">Tutar</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {txs.map((t: any) => (
                                        <tr key={t.id} className="border-b border-gray-50 group">
                                            <td className="px-4 py-3 text-gray-500">{format(new Date(t.transactionDate), 'dd.MM.yyyy')}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className={`text-[10px] ${t.type === 'INCOME' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                    {getSportCategoryLabel(t.type, t.category)}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{t.description || '-'}</td>
                                            <td className={`px-4 py-3 text-right font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                                                {t.type === 'INCOME' ? '+' : '-'}{formatSportCurrency(t.amount, t.currency)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button size="sm" variant="ghost" onClick={() => setDeletingId(t.id)} className="text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={dialog} onOpenChange={setDialog}>
                <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader><DialogTitle>Yeni Maliye Kaydı</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5"><Label>Tür</Label>
                                <Select value={form.type} onValueChange={onTypeChange}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INCOME">Gelir</SelectItem>
                                        <SelectItem value="EXPENSE">Gider</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5"><Label>Kategori</Label>
                                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(form.type === 'INCOME' ? SPORT_INCOME_CATEGORIES : SPORT_EXPENSE_CATEGORIES).map((c) => (
                                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5"><Label>Tutar <ReqMark /></Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label>Para Birimi</Label>
                                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{SPORT_CURRENCIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5"><Label>Tarih</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                        <div className="space-y-1.5"><Label>Açıklama</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                        <RequiredLegend />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialog(false)}>İptal</Button>
                        <Button onClick={save} disabled={createTransaction.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">Kaydet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deletingId}
                onOpenChange={(open) => { if (!open) setDeletingId(null); }}
                onConfirm={confirmDelete}
                title="İşlem Kaydı Silinsin mi?"
                description="Bu maliye kaydı kalıcı olarak silinecektir. Bu işlem geri alınamaz."
                loading={deleteTransaction.isPending}
            />
        </div>
    );
}
