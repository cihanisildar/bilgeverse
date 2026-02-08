'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, ChevronRight, Users, MessageSquare, Info, Search, TrendingUp, CheckCircle, Star, Clock, ChevronLeft, Map, Bookmark, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { useSyllabusTracking } from '@/app/hooks/use-reports';
import Loading from '@/app/components/Loading';
import { useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { SyllabusTrackingReport, SyllabusTrackingData, TutorSyllabusProgress, SyllabusLesson, TutorSyllabusNote } from '@/types/reports';

const ITEMS_PER_PAGE = 8;

export default function SyllabusTrackingPage() {
    const { data: report, isLoading, error } = useSyllabusTracking();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedSyllabus, setSelectedSyllabus] = useState<SyllabusTrackingData | null>(null);

    const filteredSyllabuses = useMemo(() => {
        if (!report?.syllabuses) return [] as SyllabusTrackingData[];
        return report.syllabuses.filter((syllabus: SyllabusTrackingData) =>
            syllabus.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            syllabus.tutorName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [report?.syllabuses, searchTerm]);

    const totalPages = Math.ceil(filteredSyllabuses.length / ITEMS_PER_PAGE);
    const paginatedSyllabuses = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredSyllabuses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredSyllabuses, currentPage]);

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

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
                    <div>
                        <Link href="/dashboard/part3/reports">
                            <Button variant="ghost" className="mb-4 -ml-2 text-gray-500 hover:text-gray-800">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Raporlara Dön
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Müfredat Takip Raporu</h1>
                        <p className="text-gray-500 mt-1">İçeriklerin işlenme durumunu ve öğretmen bazlı ilerlemeleri izleyin.</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Müfredat veya öğretmen ara..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="pl-9 h-11 bg-white border-gray-200 rounded-xl shadow-sm focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* Summary Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <Card className="shadow-sm border-gray-200 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <BookOpen className="h-20 w-20" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Toplam Müfredat</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                                <Bookmark className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-3xl font-black text-gray-900">{report.summary.totalSyllabuses}</div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 whitespace-nowrap">SİSTEMDE TANIMLI</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-gray-200 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <TrendingUp className="h-20 w-20" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Genel İlerleme</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                <Sparkles className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                                <div className="text-3xl font-black text-indigo-600">%{report.summary.averageProgress}</div>
                                <Progress value={report.summary.averageProgress} className="h-1.5 mt-2 bg-indigo-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-gray-200 overflow-hidden relative bg-emerald-600 text-white border-0">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-white">
                            <CheckCircle className="h-20 w-20" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-black text-emerald-100 uppercase tracking-[0.2em]">Tamamlanan</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                                <CheckCircle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <div className="text-3xl font-black">{report.summary.completedSyllabuses}</div>
                                <p className="text-[10px] text-emerald-100/70 font-bold uppercase tracking-widest mt-0.5 whitespace-nowrap">MÜFREDAT BİTİRİLDİ</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {paginatedSyllabuses.map((syllabus: SyllabusTrackingData) => (
                        <Card key={syllabus.id} className="overflow-hidden shadow-sm border-gray-200 hover:border-indigo-200 hover:shadow-md transition-all group bg-white">
                            <div className="flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-gray-100">
                                {/* Left Section: Syllabus Info */}
                                <div className="p-6 xl:w-1/3 flex flex-col justify-between bg-gray-50/30">
                                    <div>
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
                                                <BookOpen className="h-6 w-6 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                            </div>
                                            <div className="text-right">
                                                <Badge variant="outline" className="text-[10px] font-black border-indigo-100 text-indigo-600 bg-white px-2.5 py-0.5">
                                                    {syllabus.progress}% BİTTİ
                                                </Badge>
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors tracking-tight">
                                            {syllabus.title}
                                        </h3>
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6">
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-gray-100 shadow-sm">
                                                <Users className="h-3.5 w-3.5 text-gray-400" />
                                                <span className="text-xs font-bold text-gray-700">{syllabus.tutorName}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-gray-100 shadow-sm">
                                                <Bookmark className="h-3.5 w-3.5 text-gray-400" />
                                                <span className="text-xs font-bold text-gray-700">{syllabus.totalTopics} Ders</span>
                                            </div>
                                            {syllabus.avgRating && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100 text-amber-700">
                                                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                                    <span className="text-xs font-black">{syllabus.avgRating}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => setSelectedSyllabus(syllabus)}
                                        className="w-full bg-white text-gray-900 border-gray-200 hover:bg-gray-900 hover:text-white transition-all font-black text-[11px] uppercase tracking-widest h-11 rounded-xl shadow-sm border-b-2 active:translate-y-0.5 active:border-b-0"
                                    >
                                        Detaylı Analiz <ChevronRight className="h-4 w-4 ml-1.5" />
                                    </Button>
                                </div>

                                {/* Right Section: Tutor/Classroom Progress Grid */}
                                <div className="p-6 flex-1 bg-white">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Öğretmen Bazlı İlerleme</h4>
                                        <Badge variant="ghost" className="text-[10px] font-bold text-gray-400">
                                            {syllabus.tutorProgress.length} AKTİF SINIF
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {syllabus.tutorProgress.map((tp: TutorSyllabusProgress) => (
                                            <div key={tp.tutorId} className="bg-gray-50/50 border border-transparent hover:border-indigo-100 hover:bg-indigo-50/30 rounded-2xl p-4 transition-all">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <p className="font-bold text-gray-900 group-hover:text-indigo-900 transition-colors text-sm">{tp.tutorName}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{tp.classroomName}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-sm font-black text-indigo-600 tracking-tighter">%{tp.progress}</span>
                                                    </div>
                                                </div>
                                                <Progress value={tp.progress} className="h-1.5 mb-2 bg-gray-100" />
                                                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    <span className="flex items-center gap-1">
                                                        <CheckCircle className="h-3 w-3 text-emerald-500" />
                                                        {tp.completedCount} / {syllabus.totalTopics}
                                                    </span>
                                                    {tp.lastTaughtDate && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {new Date(tp.lastTaughtDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {syllabus.tutorProgress.length === 0 && (
                                            <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center gap-2">
                                                <Users className="h-10 w-10 text-gray-100" />
                                                <p className="text-sm text-gray-300 font-bold uppercase tracking-widest px-8">Aktif takipte sınıf bulunmuyor.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {filteredSyllabuses.length === 0 && (
                        <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                                <Search className="h-8 w-8 text-gray-200" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Sonuç bulunamadı</h3>
                                <p className="text-sm text-gray-400 font-medium">Filtrelerinizle eşleşen müfredat veya öğretmen yok.</p>
                            </div>
                            <Button variant="outline" onClick={() => setSearchTerm('')} className="mt-2 font-bold text-xs uppercase tracking-widest">Aramayı Temizle</Button>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            Sayfa {currentPage} / {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="h-10 w-10 p-0 border-gray-200 rounded-xl"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="h-10 w-10 p-0 border-gray-200 rounded-xl"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Enhanced Lesson Details Dialog */}
            <Dialog open={!!selectedSyllabus} onOpenChange={() => setSelectedSyllabus(null)}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0 border-0 shadow-2xl rounded-3xl">
                    {selectedSyllabus && (
                        <>
                            <DialogHeader className="p-8 bg-white border-b relative">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100 shrink-0">
                                            <BookOpen className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight leading-tight">{selectedSyllabus.title}</DialogTitle>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px] font-black hover:bg-indigo-100 px-2 py-0.5">
                                                    MÜFREDAT ANALİZİ
                                                </Badge>
                                                <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                                    <Users className="h-3 w-3" /> {selectedSyllabus.tutorName}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100 shrink-0 min-w-[140px] text-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Genel Başarı</p>
                                        <span className="text-3xl font-black text-indigo-600 tracking-tighter">%{selectedSyllabus.progress}</span>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8">
                                <Tabs defaultValue="lessons" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-200/50 p-1.5 rounded-2xl h-14">
                                        <TabsTrigger value="lessons" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md text-[11px] font-black uppercase tracking-widest py-3">
                                            <BookOpen className="h-4 w-4 mr-2" /> DERS İÇERİKLERİ
                                        </TabsTrigger>
                                        <TabsTrigger value="notes" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md text-[11px] font-black uppercase tracking-widest py-3">
                                            <MessageSquare className="h-4 w-4 mr-2" /> ÖĞRETMEN NOTLARI
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="lessons" className="mt-0">
                                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                                            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ders Akışı</span>
                                                <div className="flex items-center gap-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> TAMAM</div>
                                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-200" /> BEKLEME</div>
                                                </div>
                                            </div>
                                            <div className="divide-y divide-gray-50">
                                                {selectedSyllabus.lessons.map((lesson: SyllabusLesson, index: number) => (
                                                    <div key={lesson.id} className="p-5 flex items-center justify-between group hover:bg-indigo-50/30 transition-all">
                                                        <div className="flex items-center gap-5 flex-1 min-w-0">
                                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                                <span className="text-[11px] font-black text-gray-400 group-hover:text-indigo-600">{index + 1}</span>
                                                            </div>
                                                            <span className="text-sm font-bold text-gray-800 truncate tracking-tight">{lesson.title}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 ml-6">
                                                            {selectedSyllabus.tutorProgress.map((tp: TutorSyllabusProgress) => {
                                                                const isCompleted = tp.completedLessonIds?.includes(lesson.id);
                                                                return (
                                                                    <div
                                                                        key={tp.tutorId}
                                                                        title={`${tp.tutorName}: ${isCompleted ? 'Tamamlandı' : 'Bekliyor'}`}
                                                                        className={`w-4 h-4 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-100 transition-all transform hover:scale-125 cursor-help ${isCompleted ? 'bg-emerald-500' : 'bg-gray-100'}`}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="notes" className="mt-0">
                                        {selectedSyllabus.tutorProgress.some((tp: TutorSyllabusProgress) => tp.latestNotes?.length > 0) ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {selectedSyllabus.tutorProgress.map((tp: TutorSyllabusProgress) => (
                                                    tp.latestNotes?.length > 0 && (
                                                        <div key={tp.tutorId} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all">
                                                            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-50">
                                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600">
                                                                    {tp.tutorName[0]}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-black text-gray-900 truncate">{tp.tutorName}</p>
                                                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter truncate">{tp.classroomName}</p>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-4">
                                                                {tp.latestNotes.map((note: TutorSyllabusNote, idx: number) => (
                                                                    <div key={idx} className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 relative group">
                                                                        <div className="flex justify-between items-center mb-2">
                                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[65%]">{note.lesson}</p>
                                                                            <Badge variant="ghost" className="text-[9px] font-bold text-gray-300 pointer-events-none">
                                                                                {new Date(note.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                                                                            </Badge>
                                                                        </div>
                                                                        <p className="text-[13px] text-gray-600 leading-relaxed font-medium">"{note.note}"</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-3">
                                                <MessageSquare className="h-12 w-12 text-gray-100" />
                                                <p className="text-sm text-gray-300 font-bold uppercase tracking-widest">Henüz bir ders notu paylaşılmamış.</p>
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </div>

                            <div className="p-6 bg-white border-t flex justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedSyllabus(null)}
                                    className="font-black text-[11px] uppercase tracking-widest h-12 px-8 border-gray-200 rounded-xl hover:bg-gray-900 hover:text-white transition-all shadow-sm"
                                >
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
