'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCheck, Users } from 'lucide-react';
import { useSportBranches } from '@/app/hooks/use-athlete-data';
import { useAttendanceOverview } from '@/app/hooks/use-sports';

export default function AttendanceOverview() {
    const [branchId, setBranchId] = useState<string>('all');
    
    const { data: branches = [] } = useSportBranches();
    const { data: rows = [], isLoading: loading } = useAttendanceOverview(branchId === 'all' ? undefined : branchId);

    const rateColor = (rate: number) =>
        rate >= 75 ? 'text-green-600' : rate >= 50 ? 'text-amber-600' : 'text-red-600';

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-indigo-500" /> Katılım & Devamsızlık
                    </h2>
                    <p className="text-sm text-gray-500">Sporcu bazında antrenman katılım ve devamsızlık oranları.</p>
                </div>
                <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger className="w-full sm:w-56">
                        <SelectValue placeholder="Branş" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Branşlar</SelectItem>
                        {branches.map((b) => (
                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Card className="border-gray-100 shadow-sm">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400">Yükleniyor...</div>
                    ) : rows.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                            Kayıt bulunamadı.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                                        <th className="px-4 py-3 font-semibold">Sporcu</th>
                                        <th className="px-4 py-3 font-semibold text-center">Toplam</th>
                                        <th className="px-4 py-3 font-semibold text-center">Katıldı</th>
                                        <th className="px-4 py-3 font-semibold text-center">Gelmedi</th>
                                        <th className="px-4 py-3 font-semibold text-center">Katılım %</th>
                                        <th className="px-4 py-3 font-semibold text-center">Devamsızlık %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r) => (
                                        <tr key={r.athleteId} className="border-b border-gray-50 hover:bg-gray-50/50">
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-gray-800">{r.name}</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {r.branches.map((b) => (
                                                        <Badge key={b.id} variant="secondary" className="text-[10px] px-1.5 py-0">{b.name}</Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600">{r.total}</td>
                                            <td className="px-4 py-3 text-center text-green-600 font-medium">{r.present}</td>
                                            <td className="px-4 py-3 text-center text-red-500 font-medium">{r.absent}</td>
                                            <td className={`px-4 py-3 text-center font-bold ${rateColor(r.attendanceRate)}`}>%{r.attendanceRate}</td>
                                            <td className="px-4 py-3 text-center font-medium text-gray-500">%{r.absenceRate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
