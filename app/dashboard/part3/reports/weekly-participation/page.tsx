'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Users, TrendingUp, Search, Trophy, UserCheck, Star, Clock, ChevronRight, ChevronLeft, CalendarDays, Zap, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useWeeklyParticipation } from '@/app/hooks/use-reports';
import Loading from '@/app/components/Loading';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { WeeklyParticipationReport, TutorWeeklyStats, WeeklySession } from '@/types/reports';

const ITEMS_PER_PAGE = 10;

export default function WeeklyParticipationPage() {
    const { data: report, isLoading, error } = useWeeklyParticipation();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTeacher, setSelectedTeacher] = useState<TutorWeeklyStats | null>(null);

    const filteredTeachers = useMemo(() => {
        if (!report?.tutorStats) return [] as TutorWeeklyStats[];
        return report.tutorStats.filter((tutor: TutorWeeklyStats) =>
            tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tutor.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [report?.tutorStats, searchTerm]);

    // Pagination logic
    const totalPages = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE);
    const paginatedTeachers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTeachers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredTeachers, currentPage]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    if (isLoading) {
        return <Loading fullScreen />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-12 text-red-600 font-medium bg-white rounded-xl shadow-sm border border-red-100">
                        Hata: {error.message}
                    </div>
                </div>
            </div>
        );
    }

    if (!report) return null;

    const { summary, weekStart, weekEnd } = report;

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link href="/dashboard/part3/reports">
                            <Button variant="ghost" className="mb-4 -ml-2 text-gray-500 hover:text-gray-800">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Raporlara Dön
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Genel Katılım Raporu</h1>
                        <p className="text-gray-500 mt-1">
                            {format(new Date(weekStart), 'dd MMMM yyyy', { locale: tr })} - {format(new Date(weekEnd), 'dd MMMM yyyy', { locale: tr })} tarihleri arası genel katılım analizi.
                        </p>
                    </div>
                </div>

                {/* Global Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="shadow-sm border-gray-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Toplam Etkinlik</CardTitle>
                            <Calendar className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">{summary.totalEvents}</div>
                            <p className="text-[10px] text-gray-400 mt-1 font-bold italic">DÖNEMLİK TOPLAM</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-gray-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Aktif Öğretmen</CardTitle>
                            <Users className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">{summary.activeTutors}</div>
                            <p className="text-[10px] text-gray-400 mt-1 font-bold italic">{summary.totalTutors} ÖĞRETMEN İÇİNDEN</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-gray-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Genel Ort. Katılım</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">%{summary.avgParticipation}</div>
                            <Progress value={summary.avgParticipation} className="h-1 mt-2 bg-gray-100" />
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-gray-200 bg-indigo-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold text-indigo-200 uppercase tracking-widest">Toplam Katılım</CardTitle>
                            <UserCheck className="h-4 w-4 text-indigo-300" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{summary.totalAttendance}</div>
                            <p className="text-[10px] text-indigo-300 mt-1 font-bold italic">
                                {summary.totalRegistered} KAYIT ARASINDAN
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Teacher Leaderboard */}
                <Card className="shadow-sm border-gray-200 overflow-hidden">
                    <CardHeader className="bg-white border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-amber-500" />
                            <CardTitle className="text-lg font-bold text-gray-800">Genel Öğretmen Başarı Tablosu</CardTitle>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Öğretmen ara..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="pl-9 h-9 text-sm border-gray-200"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50 text-left border-b border-gray-100">
                                        <th className="py-4 px-6 font-bold text-[10px] text-gray-400 uppercase tracking-widest">Sıra</th>
                                        <th className="py-4 px-6 font-bold text-[10px] text-gray-400 uppercase tracking-widest">Öğretmen</th>
                                        <th className="py-4 px-6 font-bold text-[10px] text-gray-400 uppercase tracking-widest text-center">Haftalık Etkinlik</th>
                                        <th className="py-4 px-6 font-bold text-[10px] text-gray-400 uppercase tracking-widest text-center">Katılım Oranı</th>
                                        <th className="py-4 px-6 font-bold text-[10px] text-gray-400 uppercase tracking-widest text-center">Katılım/Kayıt</th>
                                        <th className="py-4 px-6 font-bold text-[10px] text-gray-400 uppercase tracking-widest text-right">Detay</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginatedTeachers.map((tutor: TutorWeeklyStats, index: number) => {
                                        const globalIndex = ((currentPage - 1) * ITEMS_PER_PAGE) + index;
                                        return (
                                            <tr key={tutor.id} className="group hover:bg-gray-50/80 transition-colors">
                                                <td className="py-4 px-6">
                                                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ${globalIndex === 0 ? 'bg-amber-100 text-amber-600' :
                                                        globalIndex === 1 ? 'bg-gray-100 text-gray-600' :
                                                            globalIndex === 2 ? 'bg-orange-100 text-orange-600' :
                                                                'bg-gray-50 text-gray-400'
                                                        }`}>
                                                        {globalIndex + 1}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600">
                                                            {tutor.name[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{tutor.name}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">@{tutor.username}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                                                        <Calendar className="h-3 w-3 text-gray-400" />
                                                        <span className="text-sm font-black text-gray-700">{tutor.eventsCreated}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col items-center">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <TrendingUp className="h-3 w-3 text-gray-400" />
                                                            <span className="text-sm font-black text-gray-700">%{tutor.participationRate}</span>
                                                        </div>
                                                        <Progress value={tutor.participationRate} className="w-16 h-1 bg-gray-100" />
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <Badge variant="outline" className="text-[10px] font-bold border-gray-100 text-gray-600">
                                                        {tutor.totalAttendance} / {tutor.totalRegistered}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedTeacher(tutor)}
                                                        className="h-8 group-hover:bg-indigo-50 group-hover:text-indigo-600 font-bold text-[11px] px-3"
                                                    >
                                                        Oturumları Gör <ChevronRight className="h-3 w-3 ml-1" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {filteredTeachers.length === 0 && (
                            <div className="text-center py-20 text-gray-500">
                                <Search className="h-8 w-8 text-gray-200 mx-auto mb-3" />
                                <p className="font-medium text-gray-900">Sonuç bulunamadı.</p>
                                <p className="text-sm mt-1">Bu hafta için verisi olan öğretmen bulunamadı.</p>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white">
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                    Sayfa {currentPage} / {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                        className="h-8 w-8 p-0 border-gray-200"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        className="h-8 w-8 p-0 border-gray-200"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Footer Insight Cards */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                            <Award className="h-6 w-6 text-indigo-500" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-1">Haftalık Katılım Hedefi</h4>
                            <p className="text-xs text-indigo-700/80 font-medium leading-relaxed">
                                Haftalık ortalama katılımın %70 üzerinde olması, platformun öğrenci tarafındaki etkisini gösterir.
                                En çok oturum düzenleyen öğretmenlerin başarılarını kutlayın.
                            </p>
                        </div>
                    </div>

                    <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                            <Star className="h-6 w-6 text-amber-500" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1">En İyi Performans</h4>
                            <p className="text-xs text-amber-700/80 font-medium leading-relaxed">
                                Bu hafta öne çıkan öğretmenler, öğrencilerin derslere katılımını teşvik etmede başarılı olanlardır.
                                Onların uyguladığı yöntemleri diğer öğretmenlerle paylaşmak sistemi güçlendirir.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Teacher Detail Dialog */}
            <Dialog open={!!selectedTeacher} onOpenChange={() => setSelectedTeacher(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 border-0 shadow-2xl rounded-2xl">
                    {selectedTeacher && (
                        <>
                            <DialogHeader className="p-6 bg-white border-b sticky top-0 z-10">
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-indigo-200">
                                                {selectedTeacher.name[0]}
                                            </div>
                                            <div>
                                                <DialogTitle className="text-2xl font-black text-gray-900">{selectedTeacher.name}</DialogTitle>
                                                <p className="text-sm font-bold text-gray-400">@{selectedTeacher.username}</p>
                                                <Badge variant="outline" className="mt-1 font-bold border-indigo-100 text-indigo-600 bg-indigo-50/50">
                                                    Haftalık Performans
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Haftalık Oran</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-3xl font-black text-indigo-600">%{selectedTeacher.participationRate}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Oturum Sayısı</p>
                                            <p className="text-lg font-black text-gray-700">{selectedTeacher.eventsCreated}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Katılım / Kayıt</p>
                                            <p className="text-lg font-black text-gray-700">{selectedTeacher.totalAttendance} / {selectedTeacher.totalRegistered}</p>
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="flex-1 overflow-y-auto bg-white p-6">
                                <div className="space-y-3">
                                    {selectedTeacher.weeklySessions.length === 0 ? (
                                        <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-100 rounded-2xl">
                                            <CalendarDays className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Bu hafta henüz oturum yapılmadı.</p>
                                        </div>
                                    ) : (
                                        selectedTeacher.weeklySessions.map((session: WeeklySession, idx: number) => (
                                            <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/30 hover:bg-gray-50 transition-all group">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${session.type === 'ETKİNLİK' ? 'bg-indigo-50 text-indigo-600' : 'bg-cyan-50 text-cyan-600'
                                                    }`}>
                                                    <Zap className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-tighter">
                                                            {session.type} • {format(new Date(session.date), 'dd MMMM EEEE', { locale: tr })}
                                                        </span>
                                                        <Badge variant="outline" className="text-[9px] font-black border-gray-100 text-gray-400">
                                                            %{Math.round((session.attended / (session.registered || 1)) * 100)} KATILIM
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
                                                        {session.title}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-medium">
                                                        {session.attended} Öğrenci Katıldı / {session.registered} Kayıt
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 border-t flex justify-end">
                                <Button variant="outline" onClick={() => setSelectedTeacher(null)} className="font-bold text-[11px] uppercase tracking-widest h-9 px-6 border-gray-200 bg-white">
                                    Kapat
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
