'use client';

import Loading from '@/app/components/Loading';
import { useEventsOverview } from '@/app/hooks/use-reports';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecentEvent, TutorEventStats } from '@/types/reports';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
    ArrowLeft,
    Calendar,
    Users,
    TrendingUp,
    Search,
    Trophy,
    UserCheck,
    Star,
    Clock,
    ChevronRight,
    ChevronLeft,
    CalendarDays,
    Zap
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function EventsOverviewPage() {
    const { data: report, isLoading, error } = useEventsOverview();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTutor, setSelectedTutor] = useState<TutorEventStats | null>(null);

    const filteredTutors = useMemo(() => {
        if (!report?.tutors) return [] as TutorEventStats[];
        return report.tutors.filter((tutor: TutorEventStats) =>
            tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tutor.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [report?.tutors, searchTerm]);

    // Pagination logic
    const totalPages = Math.ceil(filteredTutors.length / ITEMS_PER_PAGE);
    const paginatedTutors = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTutors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredTutors, currentPage]);

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

    const { summary } = report;

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
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Etkinlik Performans Özeti</h1>
                        <p className="text-gray-500 mt-1">Öğretmen bazlı etkinlik oluşturma ve katılım analizi.</p>
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
                            <p className="text-[10px] text-gray-400 mt-1 font-bold italic">TÜM ZAMANLAR</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-gray-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Aktif Öğretmen</CardTitle>
                            <Users className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">{summary.totalTutors}</div>
                            <p className="text-[10px] text-gray-400 mt-1 font-bold italic">SİSTEMDE KAYITLI</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-gray-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Ort. Katılım</CardTitle>
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
                            <div className="text-3xl font-bold">{summary.totalAttended}</div>
                            <p className="text-[10px] text-indigo-300 mt-1 font-bold italic">
                                {summary.totalRegistered} KAYIT ARASINDAN
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tutor Leaderboard / Table */}
                <Card className="shadow-sm border-gray-200 overflow-hidden">
                    <CardHeader className="bg-white border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-amber-500" />
                            <CardTitle className="text-lg font-bold text-gray-800">Öğretmen Performans Sıralaması</CardTitle>
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
                                        <th className="py-4 px-6 font-bold text-[10px] text-gray-400 uppercase tracking-widest text-center">Toplam</th>
                                        <th className="py-4 px-6 font-bold text-[10px] text-gray-400 uppercase tracking-widest text-center">Haftalık / Aylık</th>
                                        <th className="py-4 px-6 font-bold text-[10px] text-gray-400 uppercase tracking-widest text-center">Oran</th>
                                        <th className="py-4 px-6 font-bold text-[10px] text-gray-400 uppercase tracking-widest text-right">Detay</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginatedTutors.map((tutor: TutorEventStats, index: number) => {
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
                                                        <span className="text-sm font-black text-gray-700">{tutor.totalEvents}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="flex items-center gap-3">
                                                            <Badge variant="outline" className="text-[9px] font-bold border-indigo-100 text-indigo-600 bg-indigo-50/30">
                                                                {tutor.eventsThisWeek}H
                                                            </Badge>
                                                            <Badge variant="outline" className="text-[9px] font-bold border-cyan-100 text-cyan-600 bg-cyan-50/30">
                                                                {tutor.eventsThisMonth}A
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col items-center">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <Users className="h-3 w-3 text-gray-400" />
                                                            <span className="text-sm font-black text-gray-700">%{tutor.participationRate}</span>
                                                        </div>
                                                        <Progress value={tutor.participationRate} className="w-16 h-1 bg-gray-100" />
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedTutor(tutor)}
                                                        className="h-8 group-hover:bg-indigo-50 group-hover:text-indigo-600 font-bold text-[11px] px-3"
                                                    >
                                                        İncele <ChevronRight className="h-3 w-3 ml-1" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {filteredTutors.length === 0 && (
                            <div className="text-center py-20 text-gray-500">
                                <Search className="h-8 w-8 text-gray-200 mx-auto mb-3" />
                                <p className="font-medium text-gray-900">Sonuç bulunamadı.</p>
                                <p className="text-sm mt-1">Filtrelerinizle eşleşen öğretmen yok.</p>
                            </div>
                        )}

                        {/* Pagination Controls */}
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

                {/* Performance Insight Footer */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                            <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-1">Haftalık Yıldız</h4>
                            <p className="text-xs text-indigo-700/80 font-medium leading-relaxed">
                                Bu hafta en çok etkinlik gerçekleştiren öğretmenlerin motivasyonu sistemi canlı tutuyor.
                                Katılım oranlarını %80 üzerinde tutan öğretmenler ekstra tecrübe puanı kazanır.
                            </p>
                        </div>
                    </div>

                    <div className="bg-cyan-50/50 border border-cyan-100 rounded-2xl p-6 flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                            <Clock className="h-6 w-6 text-cyan-500" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-cyan-900 uppercase tracking-widest mb-1">Gelecek Planlaması</h4>
                            <p className="text-xs text-cyan-700/80 font-medium leading-relaxed">
                                Yaklaşan etkinlikleri düzenli olarak takip ederek öğrenci katılımını artırın.
                                Aylık bazda etkinlik sayısı azalan öğretmenler ile birebir görüşme yapılması önerilir.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tutor Detail Dialog */}
            <Dialog open={!!selectedTutor} onOpenChange={() => setSelectedTutor(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 border-0 shadow-2xl rounded-2xl">
                    {selectedTutor && (
                        <>
                            <DialogHeader className="p-6 bg-white border-b sticky top-0 z-10">
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-indigo-200">
                                                {selectedTutor.name[0]}
                                            </div>
                                            <div>
                                                <DialogTitle className="text-2xl font-black text-gray-900">{selectedTutor.name}</DialogTitle>
                                                <p className="text-sm font-bold text-gray-400">@{selectedTutor.username}</p>
                                                <Badge variant="outline" className="mt-1 font-bold border-indigo-100 text-indigo-600 bg-indigo-50/50">
                                                    Aktif Öğretmen
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Genel Başarı</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-3xl font-black text-indigo-600">%{selectedTutor.participationRate}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Toplam Etkinlik</p>
                                            <p className="text-lg font-black text-gray-700">{selectedTutor.totalEvents}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Haftalık / Aylık</p>
                                            <p className="text-lg font-black text-gray-700">{selectedTutor.eventsThisWeek}H / {selectedTutor.eventsThisMonth}A</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Toplam Katılım</p>
                                            <p className="text-lg font-black text-gray-700">{selectedTutor.totalAttended} / {selectedTutor.totalRegistered}</p>
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="flex-1 overflow-y-auto bg-white p-6">
                                <Tabs defaultValue="all" className="w-full">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex flex-col">
                                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Son Etkinlik Akışı</h3>
                                            <p className="text-[10px] text-gray-300 font-bold mt-1 italic">ATÖLYE: Part 2 ve Topluluk Etkinlikleri</p>
                                        </div>
                                        <TabsList className="bg-gray-100/50 p-1 rounded-lg h-8">
                                            <TabsTrigger value="all" className="text-[9px] font-black uppercase px-3 h-6">TÜMÜ</TabsTrigger>
                                            <TabsTrigger value="etkinlik" className="text-[9px] font-black uppercase px-3 h-6">ETKİNLİK</TabsTrigger>
                                            <TabsTrigger value="atölye" className="text-[9px] font-black uppercase px-3 h-6">ATÖLYE</TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <TabsContent value="etkinlik" className="mt-0">
                                        <EventList events={selectedTutor.recentEvents.filter((e: RecentEvent) => e.type === 'ETKİNLİK')} />
                                    </TabsContent>
                                    <TabsContent value="atölye" className="mt-0">
                                        <EventList events={selectedTutor.recentEvents.filter((e: RecentEvent) => e.type === 'ATÖLYE')} />
                                    </TabsContent>
                                </Tabs>

                                <div className="mt-8 bg-amber-50 rounded-2xl p-5 border border-amber-100/50 flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                        <Zap className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Stratejik Öneri</p>
                                        <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                            {selectedTutor.participationRate >= 75
                                                ? "Öğretmen yüksek katılım oranlarını koruyor. Deneyim paylaşımı için diğer öğretmenlerle bir araya getirilmesi faydalı olabilir."
                                                : "Katılım oranlarını artırmak için etkinlik içerikleri revize edilebilir veya öğrencilere yönelik hatırlatmalar sıkılaştırılabilir."
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 border-t flex justify-end">
                                <Button variant="outline" onClick={() => setSelectedTutor(null)} className="font-bold text-[11px] uppercase tracking-widest h-9 px-6 border-gray-200 bg-white">
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

function EventList({ events }: { events: RecentEvent[] }) {
    if (events.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-100 rounded-2xl">
                <CalendarDays className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Henüz etkinlik kaydı bulunmuyor.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {events.map((event: RecentEvent, idx: number) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/30 hover:bg-gray-50 transition-all group">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${event.type === 'ETKİNLİK' ? 'bg-indigo-50 text-indigo-600' : 'bg-cyan-50 text-cyan-600'
                        }`}>
                        <Zap className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-tighter">
                                {event.type} • {format(new Date(event.date), 'dd MMM yyyy', { locale: tr })}
                            </span>
                            <Badge variant="outline" className="text-[9px] font-black border-gray-100 text-gray-400">
                                {event.attended} / {event.registered} KATILIM
                            </Badge>
                        </div>
                        <p className="text-sm font-bold text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
                            {event.title}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
