'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CircleDollarSign, Plus, Bell, Wallet, Phone, CheckCircle2 } from 'lucide-react';
import { useAthletes } from '@/app/hooks/use-athlete-data';
import { useFootballFees, useDuesReminders, useGenerateMonthlyFees, useRecordFeePayment, useSendDuesReminder } from '@/app/hooks/use-sports';
import { getFeeStatusMeta, formatSportCurrency } from '@/app/lib/sports';
import { ReqMark, RequiredLegend } from './ReqMark';
import { format } from 'date-fns';

export default function FootballSchool() {
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const { data: fees = [] } = useFootballFees(statusFilter === 'all' ? undefined : { status: statusFilter as any });
    const { data: reminders = [] } = useDuesReminders();
    const { data: allAthletes = [] } = useAthletes();
    const schoolCount = allAthletes.filter((a: any) => a.footballSchool).length;

    const generateFeesMutation = useGenerateMonthlyFees();
    const recordPaymentMutation = useRecordFeePayment();
    const sendReminderMutation = useSendDuesReminder();

    const [genDialog, setGenDialog] = useState(false);
    const [genForm, setGenForm] = useState({ month: format(new Date(), 'yyyy-MM'), amount: '' });

    const [payDialog, setPayDialog] = useState(false);
    const [payFee, setPayFee] = useState<any>(null);
    const [payForm, setPayForm] = useState({ amount: '', date: format(new Date(), 'yyyy-MM-dd'), description: '' });

    const handleGenerate = () => {
        if (!genForm.amount) return;
        const [y, m] = genForm.month.split('-').map(Number);
        generateFeesMutation.mutate(
            { periodMonth: new Date(y, m - 1, 1), amount: parseFloat(genForm.amount) },
            { onSuccess: (res) => { if (!res.error) setGenDialog(false); } }
        );
    };

    const openPay = (fee: any) => {
        setPayFee(fee);
        const remaining = fee.amount - (fee.paidTotal ?? 0);
        setPayForm({ amount: remaining > 0 ? remaining.toString() : '', date: format(new Date(), 'yyyy-MM-dd'), description: '' });
        setPayDialog(true);
    };

    const handlePay = () => {
        if (!payForm.amount || !payFee) return;
        recordPaymentMutation.mutate(
            { feeId: payFee.id, payment: { amount: parseFloat(payForm.amount), date: new Date(payForm.date), description: payForm.description } },
            { onSuccess: (res) => { if (!res.error) setPayDialog(false); } }
        );
    };

    const handleRemind = (feeId: string) => sendReminderMutation.mutate(feeId);

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <CircleDollarSign className="h-5 w-5 text-green-500" /> Futbol Okulu Aidatları
                    </h2>
                    <p className="text-sm text-gray-500">{schoolCount} futbol okulu sporcusu · aidat ve ödeme takibi.</p>
                </div>
                <Button onClick={() => setGenDialog(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white"><Plus className="h-4 w-4 mr-2" /> Aylık Aidat Oluştur</Button>
            </div>

            {/* Reminders */}
            {reminders.length > 0 && (
                <Card className="border-red-100 bg-red-50/40 shadow-sm">
                    <CardContent className="p-4">
                        <h3 className="text-sm font-bold text-red-700 flex items-center gap-2 mb-3">
                            <Bell className="h-4 w-4" /> Borçlu Sporcular ({reminders.length})
                        </h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {reminders.map((f) => {
                                const meta = getFeeStatusMeta(f.status);
                                return (
                                    <div key={f.id} className="flex items-center justify-between gap-3 bg-white rounded-lg p-3 border border-red-100">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-800">{f.athlete.user.firstName} {f.athlete.user.lastName}</p>
                                            <p className="text-xs text-gray-400">
                                                {format(new Date(f.periodMonth), 'MMMM yyyy')} · {formatSportCurrency(f.amount)}
                                                {f.athlete.parentPhone && (<span className="inline-flex items-center gap-1 ml-2"><Phone className="h-3 w-3" />{f.athlete.parentPhone}</span>)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Badge variant="outline" className={`text-[10px] ${meta.color}`}>{meta.label}</Badge>
                                            <Button size="sm" variant="outline" onClick={() => handleRemind(f.id)} className="text-xs"><Bell className="h-3.5 w-3.5 mr-1" /> Hatırlat</Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Fee list */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700">Aidat Kayıtları</h3>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-44"><SelectValue placeholder="Durum" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tümü</SelectItem>
                        <SelectItem value="PAID">Ödendi</SelectItem>
                        <SelectItem value="PENDING">Bekliyor</SelectItem>
                        <SelectItem value="OVERDUE">Gecikmiş</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card className="border-gray-100 shadow-sm">
                <CardContent className="p-0">
                    {fees.length === 0 ? (
                        <div className="p-10 text-center text-gray-400"><Wallet className="h-8 w-8 mx-auto mb-2 text-gray-300" />Aidat kaydı yok.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                                        <th className="px-4 py-3">Sporcu</th>
                                        <th className="px-4 py-3">Dönem</th>
                                        <th className="px-4 py-3 text-right">Tutar</th>
                                        <th className="px-4 py-3 text-right">Ödenen</th>
                                        <th className="px-4 py-3 text-center">Durum</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fees.map((f) => {
                                        const meta = getFeeStatusMeta(f.status);
                                        const paid = f.paidTotal ?? 0;
                                        return (
                                            <tr key={f.id} className="border-b border-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-700">{f.athlete.user.firstName} {f.athlete.user.lastName}</td>
                                                <td className="px-4 py-3 text-gray-500">{format(new Date(f.periodMonth), 'MMM yyyy')}</td>
                                                <td className="px-4 py-3 text-right">{formatSportCurrency(f.amount)}</td>
                                                <td className="px-4 py-3 text-right text-green-600">{formatSportCurrency(paid)}</td>
                                                <td className="px-4 py-3 text-center"><Badge variant="outline" className={`text-[10px] ${meta.color}`}>{meta.label}</Badge></td>
                                                <td className="px-4 py-3 text-right">
                                                    {f.status !== 'PAID' ? (
                                                        <Button size="sm" variant="outline" onClick={() => openPay(f)} className="text-xs">Ödeme Al</Button>
                                                    ) : (
                                                        <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Generate dialog */}
            <Dialog open={genDialog} onOpenChange={setGenDialog}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader><DialogTitle>Aylık Aidat Oluştur</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <p className="text-sm text-gray-500">Tüm futbol okulu sporcularına seçili ay için aidat kaydı oluşturulur. Var olanlar atlanır.</p>
                        <div className="space-y-1.5"><Label>Dönem (Ay)</Label><Input type="month" value={genForm.month} onChange={(e) => setGenForm({ ...genForm, month: e.target.value })} /></div>
                        <div className="space-y-1.5"><Label>Aidat Tutarı (₺) <ReqMark /></Label><Input type="number" value={genForm.amount} onChange={(e) => setGenForm({ ...genForm, amount: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGenDialog(false)}>İptal</Button>
                        <Button onClick={handleGenerate} className="bg-indigo-600 hover:bg-indigo-700 text-white">Oluştur</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Payment dialog */}
            <Dialog open={payDialog} onOpenChange={setPayDialog}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader><DialogTitle>Ödeme Kaydı</DialogTitle></DialogHeader>
                    {payFee && (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-500">
                                {payFee.athlete.user.firstName} {payFee.athlete.user.lastName} · {format(new Date(payFee.periodMonth), 'MMMM yyyy')}
                            </p>
                            <div className="space-y-1.5"><Label>Tutar (₺) <ReqMark /></Label><Input type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label>Tarih</Label><Input type="date" value={payForm.date} onChange={(e) => setPayForm({ ...payForm, date: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label>Açıklama</Label><Input value={payForm.description} onChange={(e) => setPayForm({ ...payForm, description: e.target.value })} /></div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPayDialog(false)}>İptal</Button>
                        <Button onClick={handlePay} className="bg-green-600 hover:bg-green-700 text-white">Ödemeyi Kaydet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
