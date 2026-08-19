'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRecurringTasks, upsertRecurringTask, deleteRecurringTask, completeRecurringTask } from '@/app/actions/center';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AlarmClock, Plus, Pencil, Trash2, AlertTriangle, Repeat, Check, Undo2, BellRing } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { REPEAT_OPTIONS, repeatShortLabel, daysUntil, nextDueDate } from '@/app/lib/recurring';

type Task = {
    id: string;
    title: string;
    dueDate: string;
    notes: string | null;
    isDone: boolean;
    repeat: string;
    leadDays: number;
    lastDoneAt: string | null;
};

const EMPTY = {
    id: undefined as string | undefined,
    title: '',
    dueDate: '',
    notes: '',
    repeat: 'MONTHLY',
    leadDays: 7,
};

function fmt(d: string | Date) {
    return format(new Date(d), 'd MMMM yyyy', { locale: tr });
}

/** Kalan güne göre aciliyet metni */
function remainingText(days: number) {
    if (days < 0) return `${Math.abs(days)} gün gecikti`;
    if (days === 0) return 'Bugün';
    return `${days} gün kaldı`;
}

export default function RecurringTasksView() {
    const qc = useQueryClient();
    const { data: result, isLoading } = useQuery({ queryKey: ['recurring-tasks'], queryFn: () => getRecurringTasks() });
    const rows: Task[] = (result?.data as unknown as Task[]) || [];

    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY });
    const [toDelete, setToDelete] = useState<Task | null>(null);

    const invalidate = () => qc.invalidateQueries({ queryKey: ['recurring-tasks'] });

    const saveMutation = useMutation({
        mutationFn: (data: typeof form) => upsertRecurringTask(data),
        onSuccess: (res) => {
            if (res.error) return toast.error(res.error);
            toast.success('Kaydedildi');
            invalidate();
            setDialogOpen(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteRecurringTask(id),
        onSuccess: (res) => {
            if (res.error) return toast.error(res.error);
            toast.success('Silindi');
            invalidate();
            setToDelete(null);
        },
    });

    const completeMutation = useMutation({
        mutationFn: ({ id, done }: { id: string; done: boolean }) => completeRecurringTask(id, done),
        onSuccess: (res, vars) => {
            if (res.error) return toast.error(res.error);
            const next = res.data as unknown as Task | null;
            // Tekrarlı işlerde kayıt kapanmaz, sıradaki tarihe ilerler.
            if (vars.done && next && !next.isDone) {
                toast.success(`Yapıldı — sıradaki tarih: ${fmt(next.dueDate)}`);
            } else {
                toast.success(vars.done ? 'Tamamlandı' : 'Geri alındı');
            }
            invalidate();
        },
    });

    const openNew = () => {
        setForm({ ...EMPTY });
        setDialogOpen(true);
    };

    const openEdit = (t: Task) => {
        setForm({
            id: t.id,
            title: t.title,
            dueDate: format(new Date(t.dueDate), 'yyyy-MM-dd'),
            notes: t.notes || '',
            repeat: t.repeat || 'NONE',
            leadDays: t.leadDays ?? 7,
        });
        setDialogOpen(true);
    };

    // Hatırlatma penceresine girenler (her işin kendi leadDays değerine göre)
    const reminders = rows.filter((t) => !t.isDone && daysUntil(t.dueDate) <= (t.leadDays ?? 7));

    // Seçilen tekrar aralığının bir sonraki tarihi — kullanıcı kaydetmeden görsün.
    const previewNext = form.dueDate ? nextDueDate(new Date(form.dueDate), form.repeat) : null;

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-100 rounded-lg"><AlarmClock className="h-6 w-6 text-rose-600" /></div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Süreli İşler</h1>
                        <p className="text-sm text-gray-500">
                            İşi bir kez tanımlayın, tekrar aralığını seçin — &quot;Yapıldı&quot; dediğinizde bir sonraki tarihe kendisi ilerler.
                        </p>
                    </div>
                </div>
                <Button onClick={openNew} className="bg-rose-600 hover:bg-rose-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />Süreli İş Ekle
                </Button>
            </div>

            {reminders.length > 0 && (
                <Card className="mb-6 border-2 border-rose-300 bg-rose-50/60">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <BellRing className="h-5 w-5 text-rose-600" />
                            <p className="font-semibold text-rose-800">
                                Hatırlatma — {reminders.length} işin zamanı geldi
                            </p>
                        </div>
                        <ul className="space-y-1.5">
                            {reminders.map((t) => {
                                const days = daysUntil(t.dueDate);
                                return (
                                    <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
                                        <span className="text-gray-800 min-w-0 truncate">
                                            <span className="font-medium">{t.title}</span>
                                            <span className="text-gray-500"> — {fmt(t.dueDate)}</span>
                                        </span>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Badge className={days < 0 ? 'bg-red-600 text-white' : 'bg-rose-100 text-rose-700 border-rose-200'}>
                                                {remainingText(days)}
                                            </Badge>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 border-rose-300 text-rose-700 hover:bg-rose-100"
                                                onClick={() => completeMutation.mutate({ id: t.id, done: true })}
                                                disabled={completeMutation.isPending}
                                            >
                                                <Check className="h-3.5 w-3.5 mr-1" />Yapıldı
                                            </Button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {isLoading ? (
                <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}</div>
            ) : rows.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-gray-500">Kayıt bulunamadı.</CardContent></Card>
            ) : (
                <div className="space-y-2">
                    {rows.map((t) => {
                        const days = daysUntil(t.dueDate);
                        const urgent = !t.isDone && days <= (t.leadDays ?? 7);
                        const soon = !t.isDone && !urgent && days <= 30;
                        const isRecurring = !!t.repeat && t.repeat !== 'NONE';
                        return (
                            <Card key={t.id} className={`transition-shadow ${urgent ? 'border-2 border-red-400 bg-red-50/50' : soon ? 'border border-amber-300 bg-amber-50/30' : ''} ${t.isDone ? 'opacity-60' : ''}`}>
                                <CardContent className="p-4 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className={`font-semibold ${t.isDone ? 'line-through text-gray-400' : urgent ? 'text-red-700' : 'text-gray-800'}`}>{t.title}</p>
                                            <Badge variant="outline" className="bg-white text-gray-600 border-gray-200">
                                                <Repeat className="h-3 w-3 mr-1" />{repeatShortLabel(t.repeat)}
                                            </Badge>
                                            {urgent && (
                                                <Badge className="bg-red-100 text-red-700 border-red-200">
                                                    <AlertTriangle className="h-3 w-3 mr-1" />{remainingText(days)}
                                                </Badge>
                                            )}
                                            {soon && <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">{days} gün kaldı</Badge>}
                                            {t.isDone && <Badge variant="outline" className="bg-gray-100 text-gray-500">Tamamlandı</Badge>}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Hedef: {fmt(t.dueDate)}
                                            {!t.isDone && <> · {t.leadDays ?? 7} gün önceden hatırlat</>}
                                            {t.lastDoneAt && <> · Son yapılış: {fmt(t.lastDoneAt)}</>}
                                        </p>
                                        {t.notes && <p className="text-xs text-gray-400 mt-1">{t.notes}</p>}
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                        {t.isDone ? (
                                            <Button variant="ghost" size="sm" onClick={() => completeMutation.mutate({ id: t.id, done: false })} disabled={completeMutation.isPending}>
                                                <Undo2 className="h-4 w-4 mr-1 text-gray-500" />Geri al
                                            </Button>
                                        ) : (
                                            <Button variant="ghost" size="sm" onClick={() => completeMutation.mutate({ id: t.id, done: true })} disabled={completeMutation.isPending}>
                                                <Check className="h-4 w-4 mr-1 text-emerald-600" />
                                                {isRecurring ? 'Yapıldı' : 'Tamamla'}
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4 text-gray-500" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => setToDelete(t)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{form.id ? 'Süreli İşi Düzenle' : 'Yeni Süreli İş'}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1">
                            <Label>Başlık *</Label>
                            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Örn: Abonelik sözleşmesi yenileme" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Tekrar Aralığı *</Label>
                                <Select value={form.repeat} onValueChange={(v) => setForm({ ...form, repeat: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {REPEAT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>Kaç gün önceden hatırlatılsın *</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={365}
                                    value={form.leadDays}
                                    onChange={(e) => setForm({ ...form, leadDays: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label>İlk Hedef Tarih *</Label>
                            <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                            {previewNext && (
                                <p className="text-xs text-gray-500">
                                    Bu tarihte &quot;Yapıldı&quot; dediğinizde sıradaki hedef: <span className="font-medium">{fmt(previewNext)}</span>
                                </p>
                            )}
                            {form.repeat === 'NONE' && (
                                <p className="text-xs text-gray-500">Tekrarsız iş bir kez yapılır ve kapanır.</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label>Not</Label>
                            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="bg-rose-600 hover:bg-rose-700 text-white">
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!toDelete}
                onOpenChange={(o) => !o && setToDelete(null)}
                onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
                title="Süreli iş silinsin mi?"
                description={toDelete ? `"${toDelete.title}" silinecek.` : ''}
                loading={deleteMutation.isPending}
            />
        </>
    );
}
