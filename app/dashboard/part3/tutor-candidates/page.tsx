'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTutorCandidates, upsertTutorCandidate, deleteTutorCandidate } from '@/app/actions/hr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ArrowLeft, UserSearch, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

const STATUSES = [
    { value: 'CONSIDERING', label: 'Değerlendiriliyor', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'INTERVIEWED', label: 'Görüşüldü', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    { value: 'WAITING', label: 'Hazırda Bekliyor', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'APPROVED', label: 'Onaylandı', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'REJECTED', label: 'Uygun Değil', color: 'bg-rose-100 text-rose-700 border-rose-200' },
];
const statusMeta = (v: string) => STATUSES.find((s) => s.value === v) ?? STATUSES[0];

type Candidate = { id: string; firstName: string; lastName: string; phone: string | null; status: string; decision: string | null; notes: string | null };

const EMPTY = { id: undefined as string | undefined, firstName: '', lastName: '', phone: '', status: 'CONSIDERING', decision: '', notes: '' };

export default function TutorCandidatesPage() {
    const qc = useQueryClient();
    const { data: result, isLoading } = useQuery({ queryKey: ['tutor-candidates'], queryFn: () => getTutorCandidates() });
    const rows: Candidate[] = (result?.data as Candidate[]) || [];

    const [search, setSearch] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY });
    const [toDelete, setToDelete] = useState<Candidate | null>(null);

    const saveMutation = useMutation({
        mutationFn: (data: typeof form) => upsertTutorCandidate(data),
        onSuccess: (res) => {
            if (res.error) return toast.error(res.error);
            toast.success('Kaydedildi');
            qc.invalidateQueries({ queryKey: ['tutor-candidates'] });
            setDialogOpen(false);
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteTutorCandidate(id),
        onSuccess: (res) => {
            if (res.error) return toast.error(res.error);
            toast.success('Silindi');
            qc.invalidateQueries({ queryKey: ['tutor-candidates'] });
            setToDelete(null);
        },
    });

    const openNew = () => { setForm({ ...EMPTY }); setDialogOpen(true); };
    const openEdit = (c: Candidate) => {
        setForm({ id: c.id, firstName: c.firstName, lastName: c.lastName, phone: c.phone || '', status: c.status, decision: c.decision || '', notes: c.notes || '' });
        setDialogOpen(true);
    };

    const filtered = rows.filter((c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                <Link href="/dashboard/part3">
                    <Button variant="ghost" className="mb-6"><ArrowLeft className="h-4 w-4 mr-2" />İnsan Kaynağına Dön</Button>
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg"><UserSearch className="h-6 w-6 text-indigo-600" /></div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Rehber Adayları</h1>
                            <p className="text-sm text-gray-500">Rehber olarak düşünülen kişiler ve haklarında alınan kararlar</p>
                        </div>
                    </div>
                    <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 text-white"><Plus className="h-4 w-4 mr-2" />Aday Ekle</Button>
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Ara..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                {isLoading ? (
                    <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}</div>
                ) : filtered.length === 0 ? (
                    <Card><CardContent className="py-12 text-center text-gray-500">Kayıt bulunamadı.</CardContent></Card>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((c) => {
                            const meta = statusMeta(c.status);
                            return (
                                <Card key={c.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-gray-800">{c.firstName} {c.lastName}</p>
                                                <Badge variant="outline" className={meta.color}>{meta.label}</Badge>
                                            </div>
                                            {c.phone && <p className="text-sm text-gray-500">{c.phone}</p>}
                                            {c.decision && <p className="text-sm text-gray-700 mt-1"><span className="font-medium">Karar:</span> {c.decision}</p>}
                                            {c.notes && <p className="text-xs text-gray-400 mt-1">{c.notes}</p>}
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4 text-gray-500" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => setToDelete(c)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
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
                    <DialogHeader><DialogTitle>{form.id ? 'Aday Düzenle' : 'Yeni Rehber Adayı'}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><Label>Ad *</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
                            <div className="space-y-1"><Label>Soyad *</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><Label>Telefon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                            <div className="space-y-1">
                                <Label>Durum</Label>
                                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1"><Label>Alınan Karar</Label><Textarea value={form.decision} onChange={(e) => setForm({ ...form, decision: e.target.value })} rows={2} placeholder="Bu aday hakkında ne karar aldınız?" /></div>
                        <div className="space-y-1"><Label>Not</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!toDelete}
                onOpenChange={(o) => !o && setToDelete(null)}
                onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
                title="Aday kaydı silinsin mi?"
                description={toDelete ? `${toDelete.firstName} ${toDelete.lastName} kaydı silinecek.` : ''}
                loading={deleteMutation.isPending}
            />
        </div>
    );
}
