'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRecurringTasks, upsertRecurringTask, deleteRecurringTask } from '@/app/actions/center';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ArrowLeft, AlarmClock, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

type Task = { id: string; title: string; dueDate: string; notes: string | null; isDone: boolean };
const EMPTY = { id: undefined as string | undefined, title: '', dueDate: '', notes: '', isDone: false };

// Days until due; negative = overdue
function daysUntil(due: string) {
    const d = new Date(due); d.setHours(23, 59, 59, 999);
    return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function RecurringTasksPage() {
    const qc = useQueryClient();
    const { data: result, isLoading } = useQuery({ queryKey: ['recurring-tasks'], queryFn: () => getRecurringTasks() });
    const rows: Task[] = (result?.data as unknown as Task[]) || [];

    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY });
    const [toDelete, setToDelete] = useState<Task | null>(null);

    const invalidate = () => qc.invalidateQueries({ queryKey: ['recurring-tasks'] });
    const saveMutation = useMutation({ mutationFn: (data: typeof form) => upsertRecurringTask(data), onSuccess: (res) => { if (res.error) return toast.error(res.error); toast.success('Kaydedildi'); invalidate(); setDialogOpen(false); } });
    const deleteMutation = useMutation({ mutationFn: (id: string) => deleteRecurringTask(id), onSuccess: (res) => { if (res.error) return toast.error(res.error); toast.success('Silindi'); invalidate(); setToDelete(null); } });
    const toggleDone = useMutation({ mutationFn: (t: Task) => upsertRecurringTask({ id: t.id, title: t.title, dueDate: format(new Date(t.dueDate), 'yyyy-MM-dd'), notes: t.notes, isDone: !t.isDone }), onSuccess: () => invalidate() });

    const openNew = () => { setForm({ ...EMPTY }); setDialogOpen(true); };
    const openEdit = (t: Task) => { setForm({ id: t.id, title: t.title, dueDate: format(new Date(t.dueDate), 'yyyy-MM-dd'), notes: t.notes || '', isDone: t.isDone }); setDialogOpen(true); };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/dashboard/part10"><Button variant="ghost" className="mb-6"><ArrowLeft className="h-4 w-4 mr-2" />Gençlik Merkezine Dön</Button></Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-100 rounded-lg"><AlarmClock className="h-6 w-6 text-rose-600" /></div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Süreli İşler</h1>
                            <p className="text-sm text-gray-500">Kira zammı, abonelik yenileme gibi süreli işler — hedef tarih yaklaşınca kırmızı yanar</p>
                        </div>
                    </div>
                    <Button onClick={openNew} className="bg-rose-600 hover:bg-rose-700 text-white"><Plus className="h-4 w-4 mr-2" />Süreli İş Ekle</Button>
                </div>

                {isLoading ? (
                    <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}</div>
                ) : rows.length === 0 ? (
                    <Card><CardContent className="py-12 text-center text-gray-500">Kayıt bulunamadı.</CardContent></Card>
                ) : (
                    <div className="space-y-2">
                        {rows.map((t) => {
                            const days = daysUntil(t.dueDate);
                            const urgent = !t.isDone && days <= 7; // due within a week or overdue
                            const soon = !t.isDone && days > 7 && days <= 30;
                            return (
                                <Card key={t.id} className={`transition-shadow ${urgent ? 'border-2 border-red-400 bg-red-50/50' : soon ? 'border border-amber-300 bg-amber-50/30' : ''} ${t.isDone ? 'opacity-60' : ''}`}>
                                    <CardContent className="p-4 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Switch checked={t.isDone} onCheckedChange={() => toggleDone.mutate(t)} />
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className={`font-semibold ${t.isDone ? 'line-through text-gray-400' : urgent ? 'text-red-700' : 'text-gray-800'}`}>{t.title}</p>
                                                    {urgent && <Badge className="bg-red-100 text-red-700 border-red-200"><AlertTriangle className="h-3 w-3 mr-1" />{days < 0 ? `${Math.abs(days)} gün gecikti` : days === 0 ? 'Bugün' : `${days} gün kaldı`}</Badge>}
                                                    {soon && <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">{days} gün kaldı</Badge>}
                                                </div>
                                                <p className="text-xs text-gray-500">Hedef: {format(new Date(t.dueDate), 'dd MMMM yyyy')}</p>
                                                {t.notes && <p className="text-xs text-gray-400 mt-1">{t.notes}</p>}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4 text-gray-500" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => setToDelete(t)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{form.id ? 'Süreli İşi Düzenle' : 'Yeni Süreli İş'}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1"><Label>Başlık *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Örn: Abonelik sözleşmesi yenileme" /></div>
                        <div className="space-y-1"><Label>Hedef Tarih *</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
                        <div className="space-y-1"><Label>Not</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                        <div className="flex items-center gap-2"><Switch checked={form.isDone} onCheckedChange={(v) => setForm({ ...form, isDone: v })} /><Label>Tamamlandı</Label></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="bg-rose-600 hover:bg-rose-700 text-white">{saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)} title="Süreli iş silinsin mi?" description={toDelete ? `"${toDelete.title}" silinecek.` : ''} loading={deleteMutation.isPending} />
        </div>
    );
}
