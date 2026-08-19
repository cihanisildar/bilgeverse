'use client';

// Sporcunun kendi paneli. İki yerden render ediliyor:
//   /dashboard/part9/me                 → Bilge Spor Kulübü kabuğu içinde
//   /dashboard/part7/student/sports     → Bilgeverse kabuğu içinde
// Bu yüzden kendi başlık/çerçevesini kurmaz, sadece içeriği döndürür.

import { useQuery } from '@tanstack/react-query';
import { getMyAthleteOverview } from '@/app/actions/athlete-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Dumbbell, Trophy, ClipboardCheck, LineChart, Megaphone, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const ATTENDANCE_LABEL: Record<string, { label: string; className: string }> = {
    YAPILDI: { label: 'Katıldı', className: 'bg-green-100 text-green-700 border-green-200' },
    YOKTU: { label: 'Katılmadı', className: 'bg-red-100 text-red-700 border-red-200' },
    YAPILMADI: { label: 'Yapılmadı', className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

function fmtDate(d: string | Date) {
    try {
        return format(new Date(d), 'd MMM yyyy', { locale: tr });
    } catch {
        return '';
    }
}

export default function AthleteMyPanel() {
    const { data: result, isLoading } = useQuery({
        queryKey: ['my-athlete-overview'],
        queryFn: () => getMyAthleteOverview(),
    });

    if (isLoading) {
        return (
            <div className="grid gap-4">
                {[0, 1, 2].map((i) => <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />)}
            </div>
        );
    }

    if (result?.error || !result?.data) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Dumbbell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{result?.error || 'Sporcu profiliniz bulunamadı. Lütfen kulüp yönetimiyle iletişime geçin.'}</p>
            </div>
        );
    }

    const { profile, upcomingTrainings, attendances, performances, announcements, stats } = result.data as any;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white">
                <h1 className="text-2xl font-bold">
                    {profile.user.firstName} {profile.user.lastName}
                </h1>
                <div className="flex flex-wrap gap-2 mt-3">
                    {profile.branches.map((b: any) => (
                        <Badge key={b.id} className="bg-white/20 text-white border-white/30">
                            <Dumbbell className="h-3 w-3 mr-1" /> {b.name}
                        </Badge>
                    ))}
                    {profile.branches.length === 0 && (
                        <span className="text-white/80 text-sm">Henüz bir branşa atanmadınız.</span>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm">
                    <CardContent className="p-5 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-50 text-green-600"><ClipboardCheck className="h-5 w-5" /></div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.attendanceRate != null ? `%${stats.attendanceRate}` : '-'}</p>
                            <p className="text-xs text-gray-500">Katılım Oranı</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="p-5 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><CalendarDays className="h-5 w-5" /></div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{upcomingTrainings.length}</p>
                            <p className="text-xs text-gray-500">Yaklaşan Antrenman</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="p-5 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-50 text-amber-600"><LineChart className="h-5 w-5" /></div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{performances.length}</p>
                            <p className="text-xs text-gray-500">Performans Kaydı</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming trainings */}
            <Card className="border-none shadow-sm">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CalendarDays className="h-5 w-5 text-indigo-600" /> Antrenman Programı</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {upcomingTrainings.length === 0 && <p className="text-sm text-gray-500">Yaklaşan antrenman bulunmuyor.</p>}
                    {upcomingTrainings.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${t.type === 'MATCH' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                    {t.type === 'MATCH' ? <Trophy className="h-4 w-4" /> : <Dumbbell className="h-4 w-4" />}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800">{t.title}</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-2">
                                        <Clock className="h-3 w-3" /> {t.startTime || ''} {t.location && (<><MapPin className="h-3 w-3 ml-1" /> {t.location}</>)}
                                    </p>
                                </div>
                            </div>
                            <span className="text-sm font-medium text-gray-600">{fmtDate(t.date)}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* My attendance */}
            <Card className="border-none shadow-sm">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-green-600" /> Yoklamalarım</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    {attendances.length === 0 && <p className="text-sm text-gray-500">Henüz yoklama kaydınız yok.</p>}
                    {attendances.map((a: any) => {
                        const meta = ATTENDANCE_LABEL[a.status] || ATTENDANCE_LABEL.YAPILMADI;
                        return (
                            <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100">
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{a.training.title}</p>
                                    <p className="text-xs text-gray-500">{fmtDate(a.training.date)}</p>
                                </div>
                                <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* My performance */}
            <Card className="border-none shadow-sm">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><LineChart className="h-5 w-5 text-amber-600" /> Performansım</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    {performances.length === 0 && <p className="text-sm text-gray-500">Henüz performans kaydınız yok.</p>}
                    {performances.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100">
                            <div>
                                <p className="text-sm font-medium text-gray-800">{p.training.title}</p>
                                <p className="text-xs text-gray-500">{fmtDate(p.training.date)}{p.notes ? ` · ${p.notes}` : ''}</p>
                            </div>
                            <span className="text-sm font-bold text-amber-700">{p.value}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Announcements */}
            <Card className="border-none shadow-sm">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Megaphone className="h-5 w-5 text-rose-600" /> Duyurular</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {announcements.length === 0 && <p className="text-sm text-gray-500">Duyuru bulunmuyor.</p>}
                    {announcements.map((a: any) => (
                        <div key={a.id} className="p-3 rounded-xl border border-gray-100 bg-rose-50/30">
                            <div className="flex items-center justify-between">
                                <p className="font-medium text-gray-800">{a.title}</p>
                                <span className="text-xs text-gray-400">{fmtDate(a.createdAt)}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{a.content}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
