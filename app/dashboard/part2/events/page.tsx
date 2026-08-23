'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    ArrowLeft, PartyPopper, Plus, Pencil, Trash2, Search, MapPin, Users, Star,
    Sparkles, Clock, PlayCircle, CheckCircle2, XCircle, Globe2, UserRound,
    CalendarDays, Tag, AlertTriangle, Eye,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * Değerler Halkası — Etkinlikler.
 *
 * Etkinlik verisi Bilgeverse (part7) ile ORTAK: aynı /api/events uçları, aynı
 * kayıtlar. Ayrı olan yalnızca bu yönetim ekranı — part7 sayfasına gidince
 * kullanıcı part7 kabuğuna (sidebar) düşüyordu ve yalnız Paket 2 alan kurum
 * o sayfayı hiç açamıyordu. Burada liste tarihe göre gruplanmış bir zaman
 * çizelgesi olarak duruyor; part7'deki düz kart ızgarasının kopyası değil.
 */

type EventRow = {
    id: string;
    title: string;
    description: string;
    startDateTime: string;
    location: string;
    capacity: number;
    points: number;
    experience: number;
    tags: string[];
    status: 'YAKINDA' | 'DEVAM_EDIYOR' | 'TAMAMLANDI' | 'IPTAL_EDILDI';
    eventScope: 'GLOBAL' | 'GROUP';
    enrolledStudents?: number;
    eventTypeId?: string;
    eventType?: { id: string; name: string; description?: string | null } | null;
    createdForTutorId?: string | null;
    createdBy?: { id: string; username: string; firstName?: string | null; lastName?: string | null } | null;
    period?: { id: string; name: string } | null;
};

type Tutor = { id: string; username: string; firstName?: string | null; lastName?: string | null };
type Period = { id: string; name: string; status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' };
type EventType = { id: string; name: string; description?: string | null };
type Participant = { id: string; username: string; firstName?: string | null; lastName?: string | null; status: string; registeredAt: string };

const STATUS_META = {
    YAKINDA: { label: 'Yaklaşıyor', badge: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500', icon: Clock },
    DEVAM_EDIYOR: { label: 'Devam ediyor', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: PlayCircle },
    TAMAMLANDI: { label: 'Tamamlandı', badge: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400', icon: CheckCircle2 },
    IPTAL_EDILDI: { label: 'İptal edildi', badge: 'bg-rose-100 text-rose-700 border-rose-200', dot: 'bg-rose-500', icon: XCircle },
} as const;

type StatusKey = keyof typeof STATUS_META;
const STATUS_KEYS = Object.keys(STATUS_META) as StatusKey[];
const statusMeta = (s: string) => STATUS_META[s as StatusKey] ?? STATUS_META.YAKINDA;

const personName = (p?: { firstName?: string | null; lastName?: string | null; username: string } | null) =>
    !p ? '—' : (p.firstName || p.lastName ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() : p.username);

const EMPTY_FORM = {
    id: undefined as string | undefined,
    title: '',
    description: '',
    startDate: '',
    startTime: '19:00',
    location: '',
    capacity: 20,
    points: 0,
    experience: 0,
    eventScope: 'GLOBAL' as 'GLOBAL' | 'GROUP',
    createdForTutorId: '',
    periodId: '',
    eventTypeId: '',
    tagsText: '',
};

async function getJson(url: string) {
    const res = await fetch(url, { credentials: 'include', headers: { 'Cache-Control': 'no-cache' } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'İstek başarısız oldu');
    return data;
}

export default function CircleEventsPage() {
    const qc = useQueryClient();
    const { isAdmin } = useAuth();

    const eventsQuery = useQuery({
        queryKey: ['circle-events'],
        queryFn: async () => ((await getJson('/api/events')).events || []) as EventRow[],
    });
    const tutorsQuery = useQuery({
        queryKey: ['circle-events', 'tutors'],
        queryFn: async () => ((await getJson('/api/admin/tutors')).tutors || []) as Tutor[],
        enabled: isAdmin,
    });
    const periodsQuery = useQuery({
        queryKey: ['circle-events', 'periods'],
        queryFn: async () => ((await getJson('/api/admin/periods')).periods || []) as Period[],
        enabled: isAdmin,
    });
    const typesQuery = useQuery({
        queryKey: ['circle-events', 'types'],
        queryFn: async () => ((await getJson('/api/event-types')).eventTypes || []) as EventType[],
    });

    const events = eventsQuery.data ?? [];
    const tutors = tutorsQuery.data ?? [];
    const periods = periodsQuery.data ?? [];
    const eventTypes = typesQuery.data ?? [];

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [scopeFilter, setScopeFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [toDelete, setToDelete] = useState<EventRow | null>(null);
    const [detail, setDetail] = useState<EventRow | null>(null);
    const [newTypeName, setNewTypeName] = useState('');

    const invalidate = () => qc.invalidateQueries({ queryKey: ['circle-events'] });

    // ---- filtre + gruplama -------------------------------------------------

    const filtered = useMemo(() => {
        const q = search.trim().toLocaleLowerCase('tr');
        return events
            .filter((e) => {
                if (statusFilter !== 'all' && e.status !== statusFilter) return false;
                if (scopeFilter !== 'all' && e.eventScope !== scopeFilter) return false;
                if (typeFilter !== 'all' && e.eventTypeId !== typeFilter) return false;
                if (!q) return true;
                return (
                    e.title.toLocaleLowerCase('tr').includes(q) ||
                    (e.description || '').toLocaleLowerCase('tr').includes(q) ||
                    (e.location || '').toLocaleLowerCase('tr').includes(q) ||
                    (e.tags || []).some((t) => t.toLocaleLowerCase('tr').includes(q))
                );
            })
            .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
    }, [events, search, statusFilter, scopeFilter, typeFilter]);

    /** Aynı güne düşen etkinlikler tek başlık altında toplanır. */
    const groupedByDay = useMemo(() => {
        const out: { date: Date; items: EventRow[] }[] = [];
        for (const e of filtered) {
            const d = new Date(e.startDateTime);
            const last = out[out.length - 1];
            if (last && isSameDay(last.date, d)) last.items.push(e);
            else out.push({ date: d, items: [e] });
        }
        return out;
    }, [filtered]);

    const stats = useMemo(() => {
        const seats = events.reduce((sum, e) => sum + (e.capacity || 0), 0);
        const taken = events.reduce((sum, e) => sum + (e.enrolledStudents || 0), 0);
        return {
            total: events.length,
            upcoming: events.filter((e) => e.status === 'YAKINDA').length,
            ongoing: events.filter((e) => e.status === 'DEVAM_EDIYOR').length,
            done: events.filter((e) => e.status === 'TAMAMLANDI').length,
            seats,
            taken,
            fill: seats > 0 ? Math.round((taken / seats) * 100) : 0,
        };
    }, [events]);

    // ---- mutasyonlar -------------------------------------------------------

    const saveMutation = useMutation({
        mutationFn: async (data: typeof form) => {
            const startDateTime = new Date(`${data.startDate}T${data.startTime || '00:00'}`).toISOString();
            const payload = {
                title: data.title.trim(),
                description: data.description.trim(),
                startDateTime,
                location: data.location.trim() || 'Online',
                capacity: Number(data.capacity) || 20,
                points: Number(data.points) || 0,
                experience: Number(data.experience) || 0,
                eventScope: data.eventScope,
                tags: data.tagsText.split(',').map((t) => t.trim()).filter(Boolean),
                periodId: data.periodId,
                eventTypeId: data.eventTypeId,
                createdForTutorId: data.eventScope === 'GROUP' ? data.createdForTutorId : undefined,
            };
            const res = await fetch(data.id ? `/api/events/${data.id}` : '/api/events', {
                method: data.id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.error || body.details || 'Etkinlik kaydedilemedi');
            return body;
        },
        onSuccess: (_d, vars) => {
            toast.success(vars.id ? 'Etkinlik güncellendi' : 'Etkinlik oluşturuldu');
            invalidate();
            setDialogOpen(false);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const statusMutation = useMutation({
        mutationFn: async ({ event, status }: { event: EventRow; status: StatusKey }) => {
            // PUT ucu tam gövde bekliyor; sadece durum değişse bile mevcut
            // değerleri geri göndermek gerekiyor.
            const res = await fetch(`/api/events/${event.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title: event.title,
                    description: event.description,
                    startDateTime: event.startDateTime,
                    location: event.location,
                    capacity: event.capacity,
                    points: event.points,
                    tags: event.tags || [],
                    eventTypeId: event.eventTypeId,
                    eventScope: event.eventScope,
                    status,
                }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.error || 'Durum güncellenemedi');
            return body;
        },
        onSuccess: (_d, vars) => {
            toast.success(`Durum "${statusMeta(vars.status).label}" olarak güncellendi`);
            invalidate();
            setDetail((d) => (d && d.id === vars.event.id ? { ...d, status: vars.status } : d));
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/events/${id}`, { method: 'DELETE', credentials: 'include' });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.error || 'Etkinlik silinemedi');
            return body;
        },
        onSuccess: () => {
            toast.success('Etkinlik silindi');
            invalidate();
            setToDelete(null);
            setDetail(null);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const createTypeMutation = useMutation({
        mutationFn: async (name: string) => {
            const res = await fetch('/api/admin/event-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.error || 'Etkinlik türü eklenemedi');
            return body.eventType as EventType;
        },
        onSuccess: (created) => {
            toast.success('Etkinlik türü eklendi');
            setNewTypeName('');
            setForm((f) => ({ ...f, eventTypeId: created.id }));
            qc.invalidateQueries({ queryKey: ['circle-events', 'types'] });
        },
        onError: (err: Error) => toast.error(err.message),
    });

    // ---- katılımcılar (detay çekmecesi) ------------------------------------

    const participantsQuery = useQuery({
        queryKey: ['circle-events', 'participants', detail?.id],
        queryFn: async () => ((await getJson(`/api/events/${detail!.id}/participants`)).participants || []) as Participant[],
        enabled: !!detail,
    });

    // ---- form yardımcıları -------------------------------------------------

    const activePeriodId = periods.find((p) => p.status === 'ACTIVE')?.id || periods[0]?.id || '';

    const openNew = () => {
        setForm({
            ...EMPTY_FORM,
            periodId: activePeriodId,
            eventTypeId: eventTypes[0]?.id || '',
            startDate: format(new Date(), 'yyyy-MM-dd'),
        });
        setDialogOpen(true);
    };

    const openEdit = (e: EventRow) => {
        const d = new Date(e.startDateTime);
        setForm({
            id: e.id,
            title: e.title,
            description: e.description || '',
            startDate: format(d, 'yyyy-MM-dd'),
            startTime: format(d, 'HH:mm'),
            location: e.location || '',
            capacity: e.capacity ?? 20,
            points: e.points ?? 0,
            experience: e.experience ?? 0,
            eventScope: e.eventScope,
            createdForTutorId: e.createdForTutorId || '',
            periodId: e.period?.id || activePeriodId,
            eventTypeId: e.eventTypeId || '',
            tagsText: (e.tags || []).join(', '),
        });
        setDialogOpen(true);
    };

    const formError = (() => {
        if (!form.title.trim()) return 'Başlık zorunludur';
        if (!form.description.trim()) return 'Açıklama zorunludur';
        if (!form.startDate) return 'Tarih zorunludur';
        if (!form.eventTypeId) return 'Etkinlik türü seçilmelidir';
        if (!form.id && !form.periodId) return 'Dönem seçilmelidir';
        if (form.eventScope === 'GROUP' && !form.createdForTutorId) return 'Grup etkinliğinde rehber seçilmelidir';
        return null;
    })();

    const isLoading = eventsQuery.isLoading;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <Link href="/dashboard/part2">
                    <Button variant="ghost" className="mb-6 hover:bg-gray-100 transition-all duration-200">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Değerler Halkasına Dön
                    </Button>
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg"><PartyPopper className="h-6 w-6 text-amber-600" /></div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Etkinlikler</h1>
                            <p className="text-sm text-gray-500">
                                Değerler Halkası etkinliklerini planlayın, doluluğu ve katılımı buradan takip edin.
                            </p>
                        </div>
                    </div>
                    {isAdmin && (
                        <Button onClick={openNew} className="bg-amber-600 hover:bg-amber-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />Etkinlik Ekle
                        </Button>
                    )}
                </div>

                {/* Özet şeridi */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <StatTile label="Toplam etkinlik" value={stats.total} icon={CalendarDays} tone="text-gray-700 bg-gray-100" />
                    <StatTile label="Yaklaşan" value={stats.upcoming} icon={Clock} tone="text-blue-700 bg-blue-100" />
                    <StatTile label="Devam eden" value={stats.ongoing} icon={PlayCircle} tone="text-emerald-700 bg-emerald-100" />
                    <StatTile label="Tamamlanan" value={stats.done} icon={CheckCircle2} tone="text-gray-600 bg-gray-100" />
                </div>

                {stats.seats > 0 && (
                    <Card className="mb-6 border-0 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-700">Genel doluluk</p>
                                <p className="text-sm text-gray-500">
                                    <span className="font-semibold text-gray-800">{stats.taken}</span> / {stats.seats} kontenjan
                                    <span className="ml-2 text-gray-400">%{stats.fill}</span>
                                </p>
                            </div>
                            <Progress value={stats.fill} className="h-2" />
                        </CardContent>
                    </Card>
                )}

                {/* Filtreler */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            className="pl-9 bg-white"
                            placeholder="Başlık, yer veya etiket ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Durum" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm durumlar</SelectItem>
                            {STATUS_KEYS.map((s) => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={scopeFilter} onValueChange={setScopeFilter}>
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Kapsam" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm kapsamlar</SelectItem>
                            <SelectItem value="GLOBAL">Kuruma açık</SelectItem>
                            <SelectItem value="GROUP">Gruba özel</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Tür" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm türler</SelectItem>
                            {eventTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* Zaman çizelgesi */}
                {isLoading ? (
                    <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />)}</div>
                ) : eventsQuery.isError ? (
                    <Card className="border-rose-200 bg-rose-50/60">
                        <CardContent className="py-10 text-center">
                            <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
                            <p className="text-rose-700 font-medium">Etkinlikler yüklenemedi</p>
                            <p className="text-sm text-rose-600 mt-1">{(eventsQuery.error as Error)?.message}</p>
                        </CardContent>
                    </Card>
                ) : filtered.length === 0 ? (
                    <Card>
                        <CardContent className="py-14 text-center text-gray-500">
                            <PartyPopper className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            {events.length === 0 ? 'Henüz etkinlik oluşturulmamış.' : 'Filtrelere uyan etkinlik bulunamadı.'}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {groupedByDay.map(({ date, items }) => (
                            <div key={date.toISOString()}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-bold text-gray-800">{format(date, 'd MMMM', { locale: tr })}</span>
                                        <span className="text-sm text-gray-400">{format(date, 'EEEE, yyyy', { locale: tr })}</span>
                                    </div>
                                    <div className="h-px bg-gray-200 flex-1" />
                                    <span className="text-xs text-gray-400">{items.length} etkinlik</span>
                                </div>

                                <div className="space-y-2">
                                    {items.map((e) => (
                                        <EventRowCard
                                            key={e.id}
                                            event={e}
                                            isAdmin={isAdmin}
                                            onDetail={() => setDetail(e)}
                                            onEdit={() => openEdit(e)}
                                            onDelete={() => setToDelete(e)}
                                            onStatus={(status) => statusMutation.mutate({ event: e, status })}
                                            statusPending={statusMutation.isPending}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- Ekle / Düzenle --- */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{form.id ? 'Etkinliği Düzenle' : 'Yeni Etkinlik'}</DialogTitle></DialogHeader>

                    <div className="space-y-3 py-2">
                        <div className="space-y-1">
                            <Label>Başlık *</Label>
                            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Örn: Değerler Halkası Kapanış Programı" />
                        </div>

                        <div className="space-y-1">
                            <Label>Açıklama *</Label>
                            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Tarih *</Label>
                                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label>Saat</Label>
                                <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label>Yer</Label>
                            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Boş bırakılırsa 'Online' kaydedilir" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Kapsam *</Label>
                                <Select value={form.eventScope} onValueChange={(v) => setForm({ ...form, eventScope: v as 'GLOBAL' | 'GROUP' })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GLOBAL">Kuruma açık</SelectItem>
                                        <SelectItem value="GROUP">Gruba özel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {form.eventScope === 'GROUP' && (
                                <div className="space-y-1">
                                    <Label>Rehber (grup) *</Label>
                                    <Select value={form.createdForTutorId} onValueChange={(v) => setForm({ ...form, createdForTutorId: v })}>
                                        <SelectTrigger><SelectValue placeholder="Rehber seçin" /></SelectTrigger>
                                        <SelectContent>
                                            {tutors.map((t) => <SelectItem key={t.id} value={t.id}>{personName(t)}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Etkinlik Türü *</Label>
                                <Select value={form.eventTypeId} onValueChange={(v) => setForm({ ...form, eventTypeId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Tür seçin" /></SelectTrigger>
                                    <SelectContent>
                                        {eventTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>Dönem *</Label>
                                <Select value={form.periodId} onValueChange={(v) => setForm({ ...form, periodId: v })} disabled={!!form.id}>
                                    <SelectTrigger><SelectValue placeholder="Dönem seçin" /></SelectTrigger>
                                    <SelectContent>
                                        {periods.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name}{p.status === 'ACTIVE' ? ' (aktif)' : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.id
                                    ? <p className="text-xs text-gray-400">Dönem sonradan değiştirilemez.</p>
                                    : <p className="text-xs text-gray-400">Liste yalnızca aktif dönemin etkinliklerini gösterir.</p>}
                            </div>
                        </div>

                        {/* Tür listesi boşsa kullanıcıyı part7'ye göndermeden burada tanımlatıyoruz. */}
                        {isAdmin && (
                            <div className="rounded-lg border border-dashed border-gray-300 p-3">
                                <Label className="text-xs text-gray-500">Aradığınız tür listede yok mu? Buradan ekleyin</Label>
                                <div className="flex gap-2 mt-1.5">
                                    <Input
                                        value={newTypeName}
                                        onChange={(e) => setNewTypeName(e.target.value)}
                                        placeholder="Yeni etkinlik türü adı"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => createTypeMutation.mutate(newTypeName.trim())}
                                        disabled={!newTypeName.trim() || createTypeMutation.isPending}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />Ekle
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label>Kontenjan</Label>
                                <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-1">
                                <Label>Puan</Label>
                                <Input type="number" min={0} value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-1">
                                <Label>Tecrübe</Label>
                                <Input type="number" min={0} value={form.experience} onChange={(e) => setForm({ ...form, experience: Number(e.target.value) })} />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label>Etiketler</Label>
                            <Input
                                value={form.tagsText}
                                onChange={(e) => setForm({ ...form, tagsText: e.target.value })}
                                placeholder="Virgülle ayırın: gezi, seminer"
                            />
                        </div>

                        {formError && (
                            <p className="text-sm text-rose-600 flex items-center gap-1.5">
                                <AlertTriangle className="h-4 w-4" />{formError}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                        <Button
                            onClick={() => saveMutation.mutate(form)}
                            disabled={!!formError || saveMutation.isPending}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- Detay çekmecesi --- */}
            <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                    {detail && (
                        <>
                            <SheetHeader>
                                <SheetTitle className="pr-6">{detail.title}</SheetTitle>
                            </SheetHeader>

                            <div className="mt-4 space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className={statusMeta(detail.status).badge}>{statusMeta(detail.status).label}</Badge>
                                    <Badge variant="outline" className="bg-white text-gray-600 border-gray-200">
                                        {detail.eventScope === 'GLOBAL'
                                            ? <><Globe2 className="h-3 w-3 mr-1" />Kuruma açık</>
                                            : <><UserRound className="h-3 w-3 mr-1" />Gruba özel</>}
                                    </Badge>
                                    {detail.eventType?.name && (
                                        <Badge variant="outline" className="bg-white text-gray-600 border-gray-200">
                                            <Tag className="h-3 w-3 mr-1" />{detail.eventType.name}
                                        </Badge>
                                    )}
                                </div>

                                <p className="text-sm text-gray-600 whitespace-pre-wrap">{detail.description}</p>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <DetailItem icon={CalendarDays} label="Tarih" value={format(new Date(detail.startDateTime), 'd MMMM yyyy, HH:mm', { locale: tr })} />
                                    <DetailItem icon={MapPin} label="Yer" value={detail.location || 'Online'} />
                                    <DetailItem icon={Star} label="Puan" value={`${detail.points ?? 0}`} />
                                    <DetailItem icon={Sparkles} label="Tecrübe" value={`${detail.experience ?? 0}`} />
                                    <DetailItem icon={Users} label="Kontenjan" value={`${detail.enrolledStudents ?? 0} / ${detail.capacity ?? 0}`} />
                                    <DetailItem icon={UserRound} label="Oluşturan" value={personName(detail.createdBy)} />
                                </div>

                                {isAdmin && (
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-gray-500">Durumu değiştir</Label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {STATUS_KEYS.map((s) => (
                                                <Button
                                                    key={s}
                                                    size="sm"
                                                    variant={detail.status === s ? 'default' : 'outline'}
                                                    disabled={statusMutation.isPending || detail.status === s}
                                                    onClick={() => statusMutation.mutate({ event: detail, status: s })}
                                                >
                                                    {STATUS_META[s].label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-2">
                                        Katılımcılar {participantsQuery.data ? `(${participantsQuery.data.length})` : ''}
                                    </p>
                                    {participantsQuery.isLoading ? (
                                        <div className="space-y-1.5">{[0, 1, 2].map((i) => <div key={i} className="h-8 rounded bg-gray-100 animate-pulse" />)}</div>
                                    ) : participantsQuery.isError ? (
                                        <p className="text-sm text-gray-500">Katılımcı listesi görüntülenemedi.</p>
                                    ) : (participantsQuery.data ?? []).length === 0 ? (
                                        <p className="text-sm text-gray-500">Henüz kayıt yok.</p>
                                    ) : (
                                        <ul className="divide-y rounded-lg border">
                                            {(participantsQuery.data ?? []).map((p) => (
                                                <li key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                                                    <span className="text-gray-700">{personName(p)}</span>
                                                    <span className="text-xs text-gray-400">
                                                        {format(new Date(p.registeredAt), 'd MMM', { locale: tr })}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {isAdmin && (
                                    <div className="flex gap-2 pt-2 border-t">
                                        <Button variant="outline" className="flex-1" onClick={() => { const e = detail; setDetail(null); openEdit(e); }}>
                                            <Pencil className="h-4 w-4 mr-2" />Düzenle
                                        </Button>
                                        <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => setToDelete(detail)}>
                                            <Trash2 className="h-4 w-4 mr-2" />Sil
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            <ConfirmDialog
                open={!!toDelete}
                onOpenChange={(o) => !o && setToDelete(null)}
                onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
                title="Etkinlik silinsin mi?"
                description={toDelete ? `"${toDelete.title}" ve etkinliğe ait tüm kayıtlar silinecek.` : ''}
                loading={deleteMutation.isPending}
            />
        </div>
    );
}

// ---------------------------------------------------------------------------

function StatTile({ label, value, icon: Icon, tone }: { label: string; value: number; icon: React.ElementType; tone: string }) {
    return (
        <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tone}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-2xl font-bold text-gray-800 leading-none">{value}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="rounded-lg bg-gray-50 p-2.5">
            <p className="text-xs text-gray-500 flex items-center gap-1"><Icon className="h-3.5 w-3.5" />{label}</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5 break-words">{value}</p>
        </div>
    );
}

function EventRowCard({
    event, isAdmin, onDetail, onEdit, onDelete, onStatus, statusPending,
}: {
    event: EventRow;
    isAdmin: boolean;
    onDetail: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onStatus: (s: StatusKey) => void;
    statusPending: boolean;
}) {
    const meta = statusMeta(event.status);
    const StatusIcon = meta.icon;
    const enrolled = event.enrolledStudents ?? 0;
    const capacity = event.capacity || 0;
    const fill = capacity > 0 ? Math.min(100, Math.round((enrolled / capacity) * 100)) : 0;
    const full = capacity > 0 && enrolled >= capacity;

    return (
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="flex">
                {/* Saat sütunu — zaman çizelgesi hissi buradan geliyor */}
                <div className="w-20 flex-shrink-0 bg-gray-50 flex flex-col items-center justify-center py-4 border-r">
                    <span className="text-lg font-bold text-gray-800">{format(new Date(event.startDateTime), 'HH:mm')}</span>
                    <span className={`mt-1.5 h-2 w-2 rounded-full ${meta.dot}`} />
                </div>

                <CardContent className="p-4 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <button onClick={onDetail} className="font-semibold text-gray-800 hover:text-amber-700 text-left truncate">
                                    {event.title}
                                </button>
                                <Badge variant="outline" className={meta.badge}>
                                    <StatusIcon className="h-3 w-3 mr-1" />{meta.label}
                                </Badge>
                                <Badge variant="outline" className="bg-white text-gray-500 border-gray-200">
                                    {event.eventScope === 'GLOBAL'
                                        ? <><Globe2 className="h-3 w-3 mr-1" />Kuruma açık</>
                                        : <><UserRound className="h-3 w-3 mr-1" />Gruba özel</>}
                                </Badge>
                                {event.eventType?.name && (
                                    <Badge variant="outline" className="bg-white text-gray-500 border-gray-200">
                                        <Tag className="h-3 w-3 mr-1" />{event.eventType.name}
                                    </Badge>
                                )}
                            </div>

                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.location || 'Online'}</span>
                                <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" />{event.points ?? 0} puan</span>
                                <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" />{event.experience ?? 0} tecrübe</span>
                            </p>

                            {capacity > 0 && (
                                <div className="mt-2 flex items-center gap-2 max-w-xs">
                                    <Progress value={fill} className="h-1.5 flex-1" />
                                    <span className={`text-xs whitespace-nowrap ${full ? 'text-rose-600 font-medium' : 'text-gray-500'}`}>
                                        <Users className="h-3 w-3 inline mr-0.5" />{enrolled}/{capacity}{full ? ' · dolu' : ''}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                            <Button variant="ghost" size="icon" onClick={onDetail} title="Detay">
                                <Eye className="h-4 w-4 text-gray-500" />
                            </Button>
                            {isAdmin && (
                                <>
                                    {event.status === 'YAKINDA' && (
                                        <Button
                                            variant="ghost" size="sm" className="text-emerald-700 hover:bg-emerald-50"
                                            disabled={statusPending} onClick={() => onStatus('DEVAM_EDIYOR')}
                                        >
                                            <PlayCircle className="h-4 w-4 mr-1" />Başlat
                                        </Button>
                                    )}
                                    {event.status === 'DEVAM_EDIYOR' && (
                                        <Button
                                            variant="ghost" size="sm" className="text-gray-700 hover:bg-gray-100"
                                            disabled={statusPending} onClick={() => onStatus('TAMAMLANDI')}
                                        >
                                            <CheckCircle2 className="h-4 w-4 mr-1" />Bitir
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" onClick={onEdit} title="Düzenle">
                                        <Pencil className="h-4 w-4 text-gray-500" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={onDelete} title="Sil">
                                        <Trash2 className="h-4 w-4 text-rose-500" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </div>
        </Card>
    );
}
