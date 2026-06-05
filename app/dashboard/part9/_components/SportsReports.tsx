'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileBarChart, Printer, Download, Users, Trophy, Wallet, ClipboardCheck } from 'lucide-react';
import { useSportReport } from '@/app/hooks/use-sports';
import { getMatchResultMeta, formatSportCurrency } from '@/app/lib/sports';
import type { SportReport } from '@/types/sports';
import { format } from 'date-fns';

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default function SportsReports() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState<number | 'all'>(now.getMonth());

    const { data, isLoading } = useSportReport(year, month === 'all' ? undefined : month);
    const report = (data as SportReport | undefined) ?? null;
    const loading = isLoading;

    const periodLabel = month === 'all' ? `${year}` : `${MONTHS[month as number]} ${year}`;

    const exportCSV = () => {
        if (!report) return;
        const rows: string[][] = [
            ['Bilge Spor Kulübü Faaliyet Raporu', periodLabel],
            [],
            ['SPORCU', ''],
            ['Toplam Sporcu', String(report.athletes.total)],
            ['Aktif', String(report.athletes.byStatus.ACTIVE ?? 0)],
            ['Pasif', String(report.athletes.byStatus.PASSIVE ?? 0)],
            ['Askıda', String(report.athletes.byStatus.SUSPENDED ?? 0)],
            [],
            ['KATILIM', ''],
            ['Toplam Yoklama Kaydı', String(report.attendance.totalRecords)],
            ['Ortalama Katılım %', String(report.attendance.avgAttendance)],
            [],
            ['MÜSABAKA', ''],
            ['Toplam', String(report.matches.total)],
            ['Galibiyet', String(report.matches.wins)],
            ['Beraberlik', String(report.matches.draws)],
            ['Mağlubiyet', String(report.matches.losses)],
            [],
            ['AİDAT', ''],
            ['Tahakkuk', String(report.dues.billed)],
            ['Tahsil', String(report.dues.collected)],
            ['Bekleyen', String(report.dues.pending)],
            [],
            ['MALİYE', ''],
            ['Gelir', String(report.finance.income)],
            ['Gider', String(report.finance.expense)],
            ['Bakiye', String(report.finance.balance)],
        ];
        const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spor-rapor-${periodLabel.replace(' ', '-')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FileBarChart className="h-5 w-5 text-indigo-500" /> Faaliyet Raporları
                    </h2>
                    <p className="text-sm text-gray-500">Dönemlik sporcu, katılım, müsabaka, aidat ve maliye özeti.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Select value={String(month)} onValueChange={(v) => setMonth(v === 'all' ? 'all' : Number(v))}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Yıl</SelectItem>
                            {MONTHS.map((m, i) => (<SelectItem key={i} value={String(i)}>{m}</SelectItem>))}
                        </SelectContent>
                    </Select>
                    <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>{years.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}</SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Yazdır</Button>
                    <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" /> CSV</Button>
                </div>
            </div>

            {loading || !report ? (
                <Card className="border-gray-100"><CardContent className="p-12 text-center text-gray-400">Rapor hazırlanıyor...</CardContent></Card>
            ) : (
                <div className="space-y-5">
                    <div className="hidden print:block">
                        <h1 className="text-2xl font-bold">Bilge Spor Kulübü — Faaliyet Raporu</h1>
                        <p className="text-gray-500">{periodLabel}</p>
                    </div>

                    {/* Athletes */}
                    <Card className="border-gray-100 shadow-sm">
                        <CardContent className="p-5">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><Users className="h-4 w-4 text-indigo-500" /> Sporcular</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <Stat label="Toplam" value={report.athletes.total} />
                                <Stat label="Aktif" value={report.athletes.byStatus.ACTIVE ?? 0} color="text-green-600" />
                                <Stat label="Pasif" value={report.athletes.byStatus.PASSIVE ?? 0} color="text-gray-500" />
                                <Stat label="Askıda" value={report.athletes.byStatus.SUSPENDED ?? 0} color="text-amber-600" />
                            </div>
                            {report.athletes.byBranch.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {report.athletes.byBranch.map((b) => (
                                        <span key={b.name} className="text-xs bg-gray-100 rounded-full px-3 py-1 text-gray-600">{b.name}: <b>{b.count}</b></span>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Attendance + matches */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Card className="border-gray-100 shadow-sm">
                            <CardContent className="p-5">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><ClipboardCheck className="h-4 w-4 text-blue-500" /> Katılım</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <Stat label="Yoklama Kaydı" value={report.attendance.totalRecords} />
                                    <Stat label="Ortalama Katılım" value={`%${report.attendance.avgAttendance}`} color="text-blue-600" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-gray-100 shadow-sm">
                            <CardContent className="p-5">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><Trophy className="h-4 w-4 text-amber-500" /> Müsabakalar</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    <Stat label="Maç" value={report.matches.total} />
                                    <Stat label="G" value={report.matches.wins} color="text-green-600" />
                                    <Stat label="B" value={report.matches.draws} color="text-gray-500" />
                                    <Stat label="M" value={report.matches.losses} color="text-red-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Match list */}
                    {report.matches.list.length > 0 && (
                        <Card className="border-gray-100 shadow-sm">
                            <CardContent className="p-0">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                                            <th className="px-4 py-3">Tarih</th>
                                            <th className="px-4 py-3">Rakip</th>
                                            <th className="px-4 py-3 text-center">Skor</th>
                                            <th className="px-4 py-3 text-center">Sonuç</th>
                                            <th className="px-4 py-3">Derece</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.matches.list.map((m, i) => {
                                            const meta = getMatchResultMeta(m.result as any);
                                            return (
                                                <tr key={i} className="border-b border-gray-50">
                                                    <td className="px-4 py-2.5 text-gray-500">{format(new Date(m.date), 'dd.MM.yyyy')}</td>
                                                    <td className="px-4 py-2.5 font-medium text-gray-700">{m.opponent}</td>
                                                    <td className="px-4 py-2.5 text-center font-bold">{m.score}</td>
                                                    <td className="px-4 py-2.5 text-center"><span className={`text-xs px-2 py-0.5 rounded ${meta.color}`}>{meta.label}</span></td>
                                                    <td className="px-4 py-2.5 text-amber-600">{m.achievement || '-'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    )}

                    {/* Dues + finance */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Card className="border-gray-100 shadow-sm">
                            <CardContent className="p-5">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><Wallet className="h-4 w-4 text-green-500" /> Aidat Tahsilatı</h3>
                                <div className="space-y-2 text-sm">
                                    <Row label="Tahakkuk" value={formatSportCurrency(report.dues.billed)} />
                                    <Row label="Tahsil Edilen" value={formatSportCurrency(report.dues.collected)} color="text-green-600" />
                                    <Row label="Bekleyen" value={formatSportCurrency(report.dues.pending)} color="text-amber-600" />
                                    <Row label="Bekleyen / Gecikmiş Kayıt" value={`${report.dues.pendingCount} / ${report.dues.overdueCount}`} />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-gray-100 shadow-sm">
                            <CardContent className="p-5">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3"><Wallet className="h-4 w-4 text-emerald-500" /> Maliye (TL)</h3>
                                <div className="space-y-2 text-sm">
                                    <Row label="Gelir" value={formatSportCurrency(report.finance.income)} color="text-green-600" />
                                    <Row label="Gider" value={formatSportCurrency(report.finance.expense)} color="text-red-500" />
                                    <Row label="Bakiye" value={formatSportCurrency(report.finance.balance)} color="text-indigo-600" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

function Stat({ label, value, color = 'text-gray-800' }: { label: string; value: React.ReactNode; color?: string }) {
    return (
        <div className="text-center bg-gray-50/60 rounded-xl p-3 border border-gray-100">
            <p className={`text-xl font-extrabold ${color}`}>{value}</p>
            <p className="text-[11px] text-gray-500">{label}</p>
        </div>
    );
}

function Row({ label, value, color = 'text-gray-800' }: { label: string; value: React.ReactNode; color?: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-gray-500">{label}</span>
            <span className={`font-bold ${color}`}>{value}</span>
        </div>
    );
}
