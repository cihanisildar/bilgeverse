'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCenterTasks, upsertCenterTask, deleteCenterTask } from '@/app/actions/center';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ArrowLeft, ClipboardList, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const STATUSES = {
    TODO: { label: 'Yapılacak', color: 'bg-gray-100 text-gray-600 border-gray-200' },
    IN_PROGRESS: { label: 'Devam Ediyor', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    DONE: { label: 'Tamamlandı', color: 'bg-green-100 text-green-700 border-green-200' },
};
const statusMeta = (s: string) => STATUSES[(s as keyof typeof STATUSES)] || STATUSES.TODO;

type Task = { id: string; title: string; description: string | null; status: string; dueDate: string | null };
const EMPTY = { id: undefined as string | undefined, title: '', description: '', status: 'TODO', dueDate: '' };

export default function CenterTasksPage() {
    const qc = useQueryClient();
    const { data: result, isLoading } = useQuery({ queryKey: ['center-tasks'], queryFn: () => getCenterTasks() });
    const rows: Task[] = (result?.data as Task[]) || [];

    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY });
    const [toDelete, setToDelete] = useState<Task | null>(null);

    const invalidate = () => qc.invalidateQueries({ queryKey: ['center-tasks'] });
    const saveMutation = useMutation({ mutationFn: (data: typeof form) => upsertCenterTask(data), onSuccess: (res) => { if (res.error) return toast.error(res.error); toast.success('Kaydedildi'); invalidate(); setDialogOpen(false); } });
    const deleteMutation = useMutation({ mutationFn: (id: string) => deleteCenterTask(id), onSuccess: (res) => { if (res.error) return toast.error(res.error); toast.success('Silindi'); invalidate(); setToDelete(null); } });
    const quickStatus = useMutation({ mutationFn: (t: Task & { status: string }) => upsertCenterTask({ id: t.id, title: t.title, description: t.description, status: t.status, dueDate: t.dueDate }), onSuccess: () => invalidate() });

    const openNew = () => { setForm({ ...EMPTY }); setDialogOpen(true); };
    const openEdit = (t: Task) => { setForm({ id: t.id, title: t.title, description: t.description || '', status: t.status, dueDate: t.dueDate ? format(new Date(t.dueDate), 'yyyy-MM-dd') : '' }); setDialogOpen(true); };

    const columns = ['TODO', 'IN_PROGRESS', 'DONE'] as const;

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <Link href="/dashboard/part10"><Button variant="ghost" className="mb-6"><ArrowLeft className="h-4 w-4 mr-2" />Gençlik Merkezine Dön</Button></Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg"><ClipboardList className="h-6 w-6 text-indigo-600" /></div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Görev Takibi</h1>
                            <p className="text-sm text-gray-500">Dernek müdürü iş takibi (to-do)</p>
                        </div>
                    </div>
                    <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 text-white"><Plus className="h-4 w-4 mr-2" />Görev Ekle</Button>
                </div>

                {isLoading ? (
                    <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {columns.map((col) => {
                            const meta = statusMeta(col);
                            const items = rows.filter((t) => t.status === col);
                            return (
                                <div key={col}>
                                    <div className="flex items-center justify-between mb-2 px-1">
                                        <h3 className="font-semibold text-gray-700">{meta.label}</h3>
                                        <Badge variant="outline" className={meta.color}>{items.length}</Badge>
                                    </div>
                                    <div className="space-y-2 min-h-[100px]">
                                        {items.map((t) => (
                                            <Card key={t.id} className="hover:shadow-md transition-shadow">
                                                <CardContent className="p-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="font-medium text-gray-800 text-sm">{t.title}</p>
                                                        <div className="flex gap-0.5 flex-shrink-0">
                                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(t)}><Pencil className="h-3 w-3 text-gray-400" /></Button>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setToDelete(t)}><Trash2 className="h-3 w-3 text-rose-400" /></Button>
                                                        </div>
                                                    </div>
                                                    {t.description && <p className="text-xs text-gray-500 mt-1">{t.description}</p>}
                                                    {t.dueDate && <p className="text-xs text-gray-400 mt-1">Hedef: {format(new Date(t.dueDate), 'dd.MM.yyyy')}</p>}
                                                    <Select value={t.status} onValueChange={(v) => quickStatus.mutate({ ...t, status: v })}>
                                                        <SelectTrigger className="h-7 text-xs mt-2"><SelectValue /></SelectTrigger>
                                                        <SelectContent>{columns.map((c) => <SelectItem key={c} value={c}>{statusMeta(c).label}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {items.length === 0 && <p className="text-xs text-gray-300 text-center py-4">Görev yok</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{form.id ? 'Görevi Düzenle' : 'Yeni Görev'}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1"><Label>Başlık *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Örn: Halı alınacak" /></div>
                        <div className="space-y-1"><Label>Açıklama</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Durum</Label>
                                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{Object.entries(STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1"><Label>Hedef Tarih</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">{saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)} title="Görev silinsin mi?" description={toDelete ? `"${toDelete.title}" silinecek.` : ''} loading={deleteMutation.isPending} />
        </div>
    );
}
