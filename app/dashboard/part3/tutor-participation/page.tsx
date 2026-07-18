'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ClipboardCheck, ChevronDown, ChevronUp, Users, Search, ClipboardPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { getStudentsForTutor, adminTakeAttendanceForTutor } from '@/app/actions/attendance-sessions';
import { format } from 'date-fns';

type Student = { id: string; name: string; attended: number; totalSessions: number; rate: number };
type TutorRow = {
    tutorId: string;
    tutorName: string;
    isActive: boolean;
    groupSize: number;
    totalSessions: number;
    totalAttendances: number;
    participationRate: number;
    color: 'green' | 'yellow' | 'red' | 'none';
    students: Student[];
};

const COLOR_MAP = {
    green: { text: 'text-green-700', dot: 'bg-green-500', bar: 'bg-green-500', badge: 'bg-green-100 text-green-700 border-green-200', label: 'İyi' },
    yellow: { text: 'text-amber-700', dot: 'bg-amber-500', bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Orta' },
    red: { text: 'text-rose-700', dot: 'bg-rose-500', bar: 'bg-rose-500', badge: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Düşük' },
    none: { text: 'text-gray-500', dot: 'bg-gray-300', bar: 'bg-gray-300', badge: 'bg-gray-100 text-gray-500 border-gray-200', label: 'Veri Yok' },
};

export default function TutorParticipationPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['tutor-participation'],
        queryFn: async () => {
            const res = await fetch('/api/admin/tutor-participation');
            if (!res.ok) throw new Error('Yüklenemedi');
            return res.json();
        },
    });
    const qc = useQueryClient();
    const tutors: TutorRow[] = data?.tutors || [];
    const [expanded, setExpanded] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    // Admin "take attendance on behalf of rehber" dialog
    const [attTutor, setAttTutor] = useState<TutorRow | null>(null);
    const [attTitle, setAttTitle] = useState('Haftalık Buluşma');
    const [attDate, setAttDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [present, setPresent] = useState<Set<string>>(new Set());

    const { data: attStudentsRes, isLoading: attLoading } = useQuery({
        queryKey: ['tutor-students-for-attendance', attTutor?.tutorId],
        queryFn: () => getStudentsForTutor(attTutor!.tutorId),
        enabled: !!attTutor,
    });
    const attStudents: { id: string; firstName: string | null; lastName: string | null; username: string }[] = attStudentsRes?.data || [];

    const openAttendance = (t: TutorRow) => {
        setAttTutor(t);
        setAttTitle('Haftalık Buluşma');
        setAttDate(format(new Date(), 'yyyy-MM-dd'));
        setPresent(new Set());
    };
    const togglePresent = (id: string) => {
        setPresent((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const takeAttendance = useMutation({
        mutationFn: () => adminTakeAttendanceForTutor({
            tutorId: attTutor!.tutorId,
            title: attTitle,
            sessionDate: attDate,
            presentStudentIds: Array.from(present),
        }),
        onSuccess: (res) => {
            if (res.error) return toast.error(res.error);
            toast.success('Yoklama kaydedildi');
            qc.invalidateQueries({ queryKey: ['tutor-participation'] });
            setAttTutor(null);
        },
    });

    const filtered = tutors.filter((t) => t.tutorName.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                <Link href="/dashboard/part3">
                    <Button variant="ghost" className="mb-6"><ArrowLeft className="h-4 w-4 mr-2" />İnsan Kaynağına Dön</Button>
                </Link>

                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-100 rounded-lg"><ClipboardCheck className="h-6 w-6 text-emerald-600" /></div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Toplu Yoklama Özeti</h1>
                        <p className="text-sm text-gray-500">Rehberlerin grup haftalık katılım performansı</p>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" /> %60 ve üzeri (İyi)</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> %40–60 (Orta)</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500" /> %40 altı (Düşük)</div>
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Rehber ara..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                {isLoading ? (
                    <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}</div>
                ) : filtered.length === 0 ? (
                    <Card><CardContent className="py-12 text-center text-gray-500">Rehber bulunamadı.</CardContent></Card>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((t) => {
                            const c = COLOR_MAP[t.color];
                            const isOpen = expanded === t.tutorId;
                            return (
                                <Card key={t.tutorId} className="overflow-hidden">
                                    <button className="w-full text-left" onClick={() => setExpanded(isOpen ? null : t.tutorId)}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${c.dot}`} />
                                                    <div className="min-w-0">
                                                        <p className={`font-semibold truncate ${c.text}`}>{t.tutorName}</p>
                                                        <p className="text-xs text-gray-500 flex items-center gap-2">
                                                            <Users className="h-3 w-3" /> {t.groupSize} öğrenci · {t.totalSessions} buluşma
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    <div className="w-28 hidden sm:block">
                                                        <Progress value={t.participationRate} className="h-2" />
                                                    </div>
                                                    <Badge variant="outline" className={c.badge}>%{t.participationRate}</Badge>
                                                    {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </button>
                                    {isOpen && (
                                        <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                                            <div className="flex justify-end mb-3">
                                                <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => openAttendance(t)}>
                                                    <ClipboardPlus className="h-4 w-4 mr-1.5" /> Bu grup için yoklama al
                                                </Button>
                                            </div>
                                            {t.totalSessions === 0 ? (
                                                <p className="text-sm text-gray-500">Bu rehber henüz yoklama girmemiş.</p>
                                            ) : t.students.length === 0 ? (
                                                <p className="text-sm text-gray-500">Bu rehberin grubunda öğrenci bulunmuyor.</p>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    <p className="text-xs font-semibold text-gray-500 mb-2">Öğrenci katılımları ({t.totalSessions} buluşma üzerinden)</p>
                                                    {t.students.map((s) => {
                                                        const sc = s.rate >= 60 ? 'text-green-700' : s.rate >= 40 ? 'text-amber-700' : 'text-rose-700';
                                                        return (
                                                            <div key={s.id} className="flex items-center justify-between text-sm">
                                                                <span className="text-gray-700">{s.name}</span>
                                                                <span className={`font-medium ${sc}`}>{s.attended}/{s.totalSessions} · %{s.rate}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Admin: take attendance on behalf of a rehber */}
            <Dialog open={!!attTutor} onOpenChange={(o) => !o && setAttTutor(null)}>
                <DialogContent className="max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{attTutor ? `${attTutor.tutorName} · Yoklama Al` : ''}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><Label>Başlık</Label><Input value={attTitle} onChange={(e) => setAttTitle(e.target.value)} /></div>
                            <div className="space-y-1"><Label>Tarih</Label><Input type="date" value={attDate} onChange={(e) => setAttDate(e.target.value)} /></div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label>Katılan öğrenciler ({present.size}/{attStudents.length})</Label>
                                <button className="text-xs text-emerald-600" onClick={() => setPresent(new Set(attStudents.map((s) => s.id)))}>Tümünü seç</button>
                            </div>
                            {attLoading ? (
                                <div className="h-24 rounded-lg bg-gray-100 animate-pulse" />
                            ) : attStudents.length === 0 ? (
                                <p className="text-sm text-gray-500">Bu rehberin grubunda öğrenci bulunmuyor.</p>
                            ) : (
                                <div className="space-y-1 max-h-64 overflow-y-auto border border-gray-100 rounded-lg p-2">
                                    {attStudents.map((s) => (
                                        <label key={s.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 cursor-pointer">
                                            <Checkbox checked={present.has(s.id)} onCheckedChange={() => togglePresent(s.id)} />
                                            <span className="text-sm text-gray-700">{s.firstName || ''} {s.lastName || ''} <span className="text-gray-400">@{s.username}</span></span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAttTutor(null)}>İptal</Button>
                        <Button onClick={() => takeAttendance.mutate()} disabled={takeAttendance.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {takeAttendance.isPending ? 'Kaydediliyor...' : 'Yoklamayı Kaydet'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
