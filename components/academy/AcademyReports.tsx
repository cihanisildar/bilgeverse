"use client";

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Printer, Download, BarChart3, Users, CalendarCheck, Target, Coins } from 'lucide-react';
import { useAcademyLessonReport } from '@/app/hooks/use-academy-data';
import { AcademyLessonReport } from '@/types/academy';

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
        </div>
    );
}

export function AcademyReports({ lessonId }: { lessonId: string }) {
    const { data, isLoading, error } = useAcademyLessonReport(lessonId);
    const report = data as AcademyLessonReport | undefined;

    function exportCsv() {
        if (!report) return;
        const header = ['Ad Soyad', 'Kullanıcı Adı', 'Katılım Oranı (%)', 'Katıldığı Oturum', 'Devamsızlık', 'Tamamlanan Görev', 'Kazanılan Bilge Para'];
        const rows = report.studentReports.map((r) => [
            `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim(),
            r.student?.username || '',
            r.attendanceRate,
            r.attendedSessions,
            r.absentSessions,
            r.completedTasks,
            r.earnedPoints,
        ]);
        const csv = [header, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.summary.lessonName}-rapor.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                <p className="text-blue-600 font-medium italic">Rapor hazırlanıyor...</p>
            </div>
        );
    }

    if (error || !report) {
        return <p className="text-center text-red-500 py-20 font-medium">Rapor oluşturulamadı.</p>;
    }

    const { summary, studentReports } = report;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Faaliyet Raporu</h2>
                    <p className="text-gray-500 mt-1">
                        {new Date(summary.generatedAt).toLocaleString('tr-TR')} itibarıyla otomatik oluşturuldu.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.print()} className="rounded-2xl border-blue-200 text-blue-700 hover:bg-blue-50 font-bold">
                        <Printer className="h-4 w-4 mr-2" /> Yazdır / PDF
                    </Button>
                    <Button onClick={exportCsv} className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold">
                        <Download className="h-4 w-4 mr-2" /> CSV İndir
                    </Button>
                </div>
            </div>

            <div className="hidden print:block">
                <h1 className="text-2xl font-bold text-gray-900">{summary.lessonName} — Faaliyet Raporu</h1>
                <p className="text-sm text-gray-500">{new Date(summary.generatedAt).toLocaleString('tr-TR')}</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard icon={Users} label="Öğrenci" value={summary.totalStudents} color="bg-blue-50 text-blue-600" />
                <StatCard icon={CalendarCheck} label="Toplam Oturum" value={summary.totalSessions} color="bg-indigo-50 text-indigo-600" />
                <StatCard icon={BarChart3} label="Ort. Katılım" value={`%${summary.averageAttendanceRate}`} color="bg-green-50 text-green-600" />
                <StatCard icon={Target} label="Görev" value={summary.totalTasks} color="bg-purple-50 text-purple-600" />
                <StatCard icon={Coins} label="Toplam Bilge Para" value={summary.totalPointsAwarded} color="bg-amber-50 text-amber-600" />
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 border-none">
                            <TableHead className="font-bold py-4 pl-6 text-slate-700">Öğrenci</TableHead>
                            <TableHead className="font-bold py-4 text-slate-700 text-center">Katılım Oranı</TableHead>
                            <TableHead className="font-bold py-4 text-slate-700 text-center">Devamsızlık</TableHead>
                            <TableHead className="font-bold py-4 text-slate-700 text-center">Tamamlanan Görev</TableHead>
                            <TableHead className="font-bold py-4 pr-6 text-slate-700 text-center">Bilge Para</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {studentReports.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-gray-500 italic">Bu derse kayıtlı öğrenci bulunmuyor.</TableCell>
                            </TableRow>
                        ) : (
                            studentReports.map((r) => (
                                <TableRow key={r.studentId} className="hover:bg-slate-50/50 border-gray-50">
                                    <TableCell className="pl-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">{r.student?.firstName} {r.student?.lastName}</span>
                                            <span className="text-xs text-indigo-500 italic">@{r.student?.username}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-20 h-2 rounded-full bg-gray-100 overflow-hidden">
                                                <div className={`h-full rounded-full ${r.attendanceRate >= 70 ? 'bg-green-500' : r.attendanceRate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${r.attendanceRate}%` }} />
                                            </div>
                                            <span className="font-bold text-slate-700 text-sm w-10">%{r.attendanceRate}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center py-4 font-semibold text-red-600">{r.absentSessions}</TableCell>
                                    <TableCell className="text-center py-4 font-semibold text-slate-700">{r.completedTasks}</TableCell>
                                    <TableCell className="text-center pr-6 py-4 font-bold text-amber-600">{r.earnedPoints} BP</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
