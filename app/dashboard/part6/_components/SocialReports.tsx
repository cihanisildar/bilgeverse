'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileBarChart, Printer, Download, Send, Eye, Heart, Users, TrendingUp } from 'lucide-react';

import { useSocialReport } from '@/app/hooks/use-social';
import { getPlatformMeta, getStatusMeta, getContentTypeLabel } from '@/app/lib/social';

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

const fmt = (n: number) => n.toLocaleString('tr-TR');

export default function SocialReports() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);

    const { data: report, isLoading } = useSocialReport(year, month);

    const handlePrint = () => window.print();

    const handleCsv = () => {
        if (!report) return;
        const rows: string[][] = [
            ['Sosyal Medya Aylık Raporu', `${MONTHS[month - 1]} ${year}`],
            [],
            ['Toplam Üretilen İçerik', String(report.totalProduced)],
            ['Paylaşılan', String(report.publishedCount)],
            ['Toplam Görüntülenme', String(report.totalViews)],
            ['Toplam Etkileşim', String(report.totalEngagement)],
            ['Toplam Erişim', String(report.totalReach)],
            ['Ortalama Etkileşim Oranı (%)', report.engagementRate.toFixed(1)],
            [],
            ['Platform Dağılımı', 'Adet'],
            ...Object.entries(report.byPlatform).map(([k, v]) => [getPlatformMeta(k).label, String(v)]),
            [],
            ['Durum Dağılımı', 'Adet'],
            ...Object.entries(report.byStatus).map(([k, v]) => [getStatusMeta(k).label, String(v)]),
            [],
            ['İçerik Türü Dağılımı', 'Adet'],
            ...Object.entries(report.byContentType).map(([k, v]) => [getContentTypeLabel(k === 'OTHER' ? null : k), String(v)]),
            [],
            ['Ekip Üyesi', 'Üretilen İçerik'],
            ...report.members.map((m) => [m.name, String(m.count)]),
        ];
        const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sosyal-medya-rapor-${year}-${month}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const summaryCards = report
        ? [
            { label: 'Üretilen İçerik', value: fmt(report.totalProduced), icon: Send, color: 'text-teal-600', bg: 'bg-teal-50' },
            { label: 'Görüntülenme', value: fmt(report.totalViews), icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Etkileşim', value: fmt(report.totalEngagement), icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Erişim', value: fmt(report.totalReach), icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
        ]
        : [];

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FileBarChart className="h-4 w-4" /> Aylık üretim & paylaşım raporu
                    </div>
                    <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrint} className="border-teal-200 text-teal-600 hover:bg-teal-50">
                        <Printer className="h-4 w-4 mr-1.5" /> Yazdır
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCsv} disabled={!report} className="border-teal-200 text-teal-600 hover:bg-teal-50">
                        <Download className="h-4 w-4 mr-1.5" /> CSV
                    </Button>
                </div>
            </div>

            <div className="hidden print:block">
                <h1 className="text-xl font-bold">Sosyal Medya Raporu — {MONTHS[month - 1]} {year}</h1>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>
            ) : !report || report.totalProduced === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="py-12 text-center text-sm text-gray-500">
                        {MONTHS[month - 1]} {year} için üretilmiş içerik bulunmuyor.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {summaryCards.map((s) => {
                            const Icon = s.icon;
                            return (
                                <Card key={s.label} className="border-0 shadow-sm">
                                    <CardContent className="p-5 flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-xl ${s.bg} ${s.color} flex items-center justify-center`}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                                            <div className="text-xs text-gray-500 font-medium">{s.label}</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <Card className="border-0 shadow-sm bg-gradient-to-r from-teal-50 to-cyan-50">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="h-5 w-5 text-teal-600" />
                                <span className="text-sm font-semibold text-gray-700">Ortalama Etkileşim Oranı</span>
                            </div>
                            <span className="text-2xl font-bold text-teal-700">%{report.engagementRate.toFixed(1)}</span>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Distribution title="Platform Dağılımı" rows={report.byPlatform} total={report.totalProduced} labelFn={(k) => getPlatformMeta(k).label} />
                        <Distribution title="Durum Dağılımı" rows={report.byStatus} total={report.totalProduced} labelFn={(k) => getStatusMeta(k).label} />
                        <Distribution title="İçerik Türü" rows={report.byContentType} total={report.totalProduced} labelFn={(k) => getContentTypeLabel(k === 'OTHER' ? null : k)} />
                    </div>

                    {/* Members */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-3"><CardTitle className="text-base">Ekip Üyesi Üretimi</CardTitle></CardHeader>
                        <CardContent>
                            {report.members.length === 0 ? (
                                <p className="text-sm text-gray-500">Kayıt yok.</p>
                            ) : (
                                <div className="space-y-2">
                                    {report.members.map((m) => {
                                        const pct = report.totalProduced > 0 ? Math.round((m.count / report.totalProduced) * 100) : 0;
                                        return (
                                            <div key={m.name}>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-700 font-medium">{m.name}</span>
                                                    <span className="text-gray-500">{m.count} içerik</span>
                                                </div>
                                                <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                                                    <div className="h-1.5 rounded-full bg-teal-400" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top posts */}
                    {report.topPosts.length > 0 && (
                        <Card className="border-0 shadow-sm">
                            <CardHeader className="pb-3"><CardTitle className="text-base">En Çok Etkileşim Alan İçerikler</CardTitle></CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                                                <th className="py-2 font-semibold">Başlık</th>
                                                <th className="py-2 font-semibold">Platform</th>
                                                <th className="py-2 font-semibold text-right">Görüntülenme</th>
                                                <th className="py-2 font-semibold text-right">Etkileşim</th>
                                                <th className="py-2 font-semibold text-right">Erişim</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {report.topPosts.map((p) => (
                                                <tr key={p.id} className="border-b border-gray-50">
                                                    <td className="py-2.5 font-medium text-gray-700">{p.title}</td>
                                                    <td className="py-2.5 text-gray-500">{getPlatformMeta(p.platform).label}</td>
                                                    <td className="py-2.5 text-right">{fmt(p.views)}</td>
                                                    <td className="py-2.5 text-right">{fmt(p.engagement)}</td>
                                                    <td className="py-2.5 text-right">{fmt(p.reach)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}

function Distribution({ title, rows, total, labelFn }: { title: string; rows: Record<string, number>; total: number; labelFn: (k: string) => string }) {
    const entries = Object.entries(rows).sort((a, b) => b[1] - a[1]);
    return (
        <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
            <CardContent>
                {entries.length === 0 ? (
                    <p className="text-sm text-gray-500">Kayıt yok.</p>
                ) : (
                    <div className="space-y-2.5">
                        {entries.map(([k, v]) => {
                            const pct = total > 0 ? Math.round((v / total) * 100) : 0;
                            return (
                                <div key={k}>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">{labelFn(k)}</span>
                                        <span className="font-medium text-gray-700">{v} (%{pct})</span>
                                    </div>
                                    <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                                        <div className="h-1.5 rounded-full bg-teal-400" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
