'use client';

import Loading from '@/app/components/Loading';
import { useAttendanceAlerts } from '@/app/hooks/use-reports';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AttendanceAlertsReport, StudentAlert, MissedActivity } from '@/types/reports';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, ArrowLeft, Calendar, ChevronLeft, ChevronRight, Info, Mail, Phone, School, Search, TrendingDown, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

const ITEMS_PER_PAGE = 10;

export default function AttendanceAlertsPage() {
    const { data: report, isLoading, error } = useAttendanceAlerts();
    const [selectedStudent, setSelectedStudent] = useState<StudentAlert | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClassroom, setSelectedClassroom] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Dynamic classrooms list from report data
    const classrooms = useMemo(() => {
        if (!report?.alerts) return [] as string[];
        const uniqueClassrooms = new Set<string>();
        report.alerts.forEach((student: StudentAlert) => {
            if (student.classroomName) uniqueClassrooms.add(student.classroomName);
        });
        return Array.from(uniqueClassrooms).sort();
    }, [report?.alerts]);

    // Search and Filter logic
    const filteredAlerts = useMemo(() => {
        if (!report?.alerts) return [] as StudentAlert[];
        return report.alerts.filter((student: StudentAlert) => {
            const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.username.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesClassroom = selectedClassroom === 'all' || student.classroomName === selectedClassroom;

            return matchesSearch && matchesClassroom;
        });
    }, [report?.alerts, searchTerm, selectedClassroom]);

    // Pagination logic
    const totalPages = Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE);
    const paginatedAlerts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAlerts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAlerts, currentPage]);

    // Reset page when search or filter changes
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleClassroomChange = (value: string) => {
        setSelectedClassroom(value);
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
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link href="/dashboard/part3/reports">
                            <Button variant="ghost" className="mb-4 -ml-2 text-gray-500 hover:text-gray-800">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Raporlara Dön
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Devamsızlık Uyarıları</h1>
                        <p className="text-gray-500 mt-1">%{report.summary.threshold} devam eşiğinin altındaki öğrenciler ve kaçırdıkları etkinlikler.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="shadow-sm border-gray-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Toplam Öğrenci</CardTitle>
                            <Users className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">{report.summary.totalStudents}</div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-gray-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Dikkat Gereken</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-orange-600">{report.summary.studentsNeedingAttention}</div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-gray-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Ortalama Devam</CardTitle>
                            <TrendingDown className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">{report.summary.averageAttendance}%</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-sm border-gray-200 overflow-hidden">
                    <CardHeader className="bg-white border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle className="text-lg font-bold text-gray-800">Uyarı Listesi</CardTitle>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <div className="relative w-full sm:w-48">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Öğrenci ara..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="pl-9 h-9 text-sm border-gray-200"
                                />
                            </div>
                            <Select value={selectedClassroom} onValueChange={handleClassroomChange}>
                                <SelectTrigger className="sm:w-48 h-9 text-sm border-gray-200">
                                    <SelectValue placeholder="Sınıf Seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tüm Sınıflar</SelectItem>
                                    {classrooms.map((classroom: string) => (
                                        <SelectItem key={classroom} value={classroom}>{classroom}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {report.alerts.length === 0 ? (
                            <div className="text-center py-20 text-gray-500">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="h-8 w-8 text-green-500" />
                                </div>
                                <p className="font-medium text-gray-900">Harika! Tüm öğrenciler devam eşiğinin üzerinde.</p>
                                <p className="text-sm mt-1">Şu an için kritik bir devamsızlık uyarısı bulunmuyor.</p>
                            </div>
                        ) : filteredAlerts.length === 0 ? (
                            <div className="text-center py-20 text-gray-500">
                                <p className="font-medium text-gray-900">Sonuç bulunamadı.</p>
                                <p className="text-sm mt-1">Filtrelerinizle eşleşen öğrenci yok.</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50/50 text-left border-b border-gray-100">
                                                <th className="py-4 px-6 font-bold text-[10px] text-gray-400 uppercase tracking-widest">Öğrenci</th>
                                                <th className="py-4 px-6 font-bold text-[10px] text-gray-400 uppercase tracking-widest text-center">Sınıf</th>
                                                <th className="py-4 px-6 font-bold text-[10px] text-gray-400 uppercase tracking-widest text-center">Katılım Oranı</th>
                                                <th className="py-4 px-6 font-bold text-[10px] text-gray-400 uppercase tracking-widest text-center">Durum</th>
                                                <th className="py-4 px-6 font-bold text-[10px] text-gray-400 uppercase tracking-widest text-right">İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {paginatedAlerts.map((student: StudentAlert) => (
                                                <tr key={student.id} className="group hover:bg-gray-50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500">
                                                                {student.name[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900">{student.name}</p>
                                                                <p className="text-xs text-gray-500 font-medium">@{student.username}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <Badge variant="outline" className="text-[10px] font-bold border-gray-200 text-gray-500">
                                                            {student.classroomName}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-sm font-black text-gray-700">{student.attendancePercentage}%</span>
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                                                {student.attendedCount} / {student.totalPotential}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <Badge
                                                            variant={student.attendancePercentage < 50 ? 'destructive' : 'secondary'}
                                                            className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5"
                                                        >
                                                            {student.attendancePercentage < 50 ? 'KRİTİK' : 'DİKKAT'}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setSelectedStudent(student)}
                                                            className="h-8 group-hover:bg-indigo-50 group-hover:text-indigo-600 font-bold text-[11px] px-3"
                                                        >
                                                            Detaylar <ChevronRight className="h-3 w-3 ml-1" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

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
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Attendance Details Dialog */}
            <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 border-0 shadow-2xl rounded-2xl">
                    {selectedStudent && (
                        <>
                            <DialogHeader className="p-6 bg-white border-b sticky top-0 z-10">
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <DialogTitle className="text-2xl font-black text-gray-900">{selectedStudent.name}</DialogTitle>
                                            <DialogDescription className="font-bold text-indigo-600 uppercase text-[10px] tracking-[0.2em] mt-0.5">
                                                Devamsızlık Analiz Raporu
                                            </DialogDescription>
                                        </div>
                                        <Badge variant="outline" className="h-10 px-4 text-xl font-black border-indigo-100 text-indigo-600 bg-indigo-50/30">
                                            {selectedStudent.attendancePercentage}%
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-500">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg">
                                            <School className="h-3.5 w-3.5 text-gray-400" />
                                            {selectedStudent.classroomName}
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg">
                                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                                            {selectedStudent.email || 'E-posta yok'}
                                        </div>
                                        {selectedStudent.phone && (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg">
                                                <Phone className="h-3.5 w-3.5 text-gray-400" />
                                                {selectedStudent.phone}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="flex-1 overflow-y-auto bg-white p-6">
                                <div className="space-y-6">
                                    <Tabs defaultValue="all" className="w-full">
                                        <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100/50 p-1 rounded-lg">
                                            <TabsTrigger value="all" className="text-[10px] font-black uppercase tracking-widest">Tümü</TabsTrigger>
                                            <TabsTrigger value="etkinlik" className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Etkinlikler</TabsTrigger>
                                            <TabsTrigger value="oturum" className="text-[10px] font-black uppercase tracking-widest text-orange-600">Oturumlar</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="all" className="mt-0">
                                            <ActivityList activities={selectedStudent.missedActivities} />
                                        </TabsContent>

                                        <TabsContent value="etkinlik" className="mt-0">
                                            <ActivityList
                                                activities={selectedStudent.missedActivities.filter((a: MissedActivity) => a.type === 'EVENT')}
                                                emptyMessage="Kaçırılan etkinlik bulunamadı."
                                            />
                                        </TabsContent>

                                        <TabsContent value="oturum" className="mt-0">
                                            <ActivityList
                                                activities={selectedStudent.missedActivities.filter((a: MissedActivity) => a.type === 'SESSION')}
                                                emptyMessage="Kaçırılan oturum bulunamadı."
                                            />
                                        </TabsContent>
                                    </Tabs>

                                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100/50 flex gap-3">
                                        <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[11px] font-black text-amber-800 uppercase tracking-widest mb-1">Rehberlik Notu</p>
                                            <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                                Bu öğrenci haftalık oturumların ve etkinliklerin %{100 - selectedStudent.attendancePercentage}'sini kaçırmış durumda.
                                                Oturum devamsızlıkları genellikle sınıf içi motivasyon düşüklüğüne işaret eder.
                                                Tutoru ile iletişime geçilmesi önerilir.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 border-t flex justify-end">
                                <Button variant="outline" onClick={() => setSelectedStudent(null)} className="font-bold text-[11px] uppercase tracking-widest h-9 px-6 border-gray-200">
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

function ActivityList({ activities, emptyMessage = "Kaçırılan aktivite bulunamadı." }: { activities: MissedActivity[], emptyMessage?: string }) {
    if (activities.length === 0) {
        return (
            <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                <p className="text-sm text-gray-400 font-medium">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {activities.map((activity: MissedActivity, idx: number) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors group">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activity.type === 'EVENT' ? 'bg-indigo-50 text-indigo-500' : 'bg-orange-50 text-orange-500'
                        }`}>
                        {activity.type === 'EVENT' ? <Calendar className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                            <p className="text-[10px] font-black uppercase tracking-tight text-gray-400">
                                {activity.type === 'EVENT' ? 'Etkinlik' : 'Oturum'}
                            </p>
                            <span className="text-[10px] font-bold text-gray-300">
                                {new Date(activity.date).toLocaleDateString('tr-TR')}
                            </span>
                        </div>
                        <p className="text-sm font-bold text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
                            {activity.title}
                        </p>
                    </div>
                    <Badge variant="outline" className="bg-white text-[9px] font-black border-orange-100 text-orange-600 shrink-0">
                        {activity.status}
                    </Badge>
                </div>
            ))}
        </div>
    );
}
