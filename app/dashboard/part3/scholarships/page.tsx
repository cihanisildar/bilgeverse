'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getScholarshipStudents, upsertScholarshipStudent, deleteScholarshipStudent } from '@/app/actions/hr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ArrowLeft, HandCoins, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

type Scholarship = {
    id: string;
    firstName: string;
    lastName: string;
    school: string | null;
    amount: number | string | null;
    startDate: string | null;
    isActive: boolean;
    notes: string | null;
};

const EMPTY = { id: undefined as string | undefined, firstName: '', lastName: '', school: '', amount: '', startDate: '', isActive: true, notes: '' };

export default function ScholarshipsPage() {
    const qc = useQueryClient();
    const { data: result, isLoading } = useQuery({ queryKey: ['scholarships'], queryFn: () => getScholarshipStudents() });
    const rows: Scholarship[] = (result?.data as Scholarship[]) || [];

    const [search, setSearch] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY });
    const [toDelete, setToDelete] = useState<Scholarship | null>(null);

    const saveMutation = useMutation({
        mutationFn: (data: typeof form) => upsertScholarshipStudent({
            ...data,
            amount: data.amount === '' ? null : Number(data.amount),
        }),
        onSuccess: (res) => {
            if (res.error) return toast.error(res.error);
            toast.success('Kaydedildi');
            qc.invalidateQueries({ queryKey: ['scholarships'] });
            setDialogOpen(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteScholarshipStudent(id),
        onSuccess: (res) => {
            if (res.error) return toast.error(res.error);
            toast.success('Silindi');
            qc.invalidateQueries({ queryKey: ['scholarships'] });
            setToDelete(null);
        },
    });

    const openNew = () => { setForm({ ...EMPTY }); setDialogOpen(true); };
    const openEdit = (s: Scholarship) => {
        setForm({
            id: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            school: s.school || '',
            amount: s.amount != null ? String(s.amount) : '',
            startDate: s.startDate ? format(new Date(s.startDate), 'yyyy-MM-dd') : '',
            isActive: s.isActive,
            notes: s.notes || '',
        });
        setDialogOpen(true);
    };

    const filtered = rows.filter((s) =>
        `${s.firstName} ${s.lastName} ${s.school || ''}`.toLowerCase().includes(search.toLowerCase())
    );

    const fmtAmount = (a: number | string | null) =>
        a != null ? `${Number(a).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺` : '-';

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                <Link href="/dashboard/part3">
                    <Button variant="ghost" className="mb-6"><ArrowLeft className="h-4 w-4 mr-2" />İnsan Kaynağına Dön</Button>
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg"><HandCoins className="h-6 w-6 text-amber-600" /></div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Burs Alan Öğrenciler</h1>
                            <p className="text-sm text-gray-500">Burs alan öğrencilerin listesi</p>
                        </div>
                    </div>
                    <Button onClick={openNew} className="bg-amber-600 hover:bg-amber-700 text-white"><Plus className="h-4 w-4 mr-2" />Burslu Ekle</Button>
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
                        {filtered.map((s) => (
                            <Card key={s.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-gray-800">{s.firstName} {s.lastName}</p>
                                            <Badge variant="outline" className={s.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}>
                                                {s.isActive ? 'Aktif' : 'Pasif'}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {s.school && <span>{s.school} · </span>}
                                            <span className="font-medium text-amber-700">{fmtAmount(s.amount)}</span>
                                            {s.startDate && <span> · Başlangıç: {format(new Date(s.startDate), 'dd.MM.yyyy')}</span>}
                                        </p>
                                        {s.notes && <p className="text-xs text-gray-400 mt-1">{s.notes}</p>}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4 text-gray-500" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => setToDelete(s)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{form.id ? 'Burslu Düzenle' : 'Yeni Burslu Ekle'}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><Label>Ad *</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
                            <div className="space-y-1"><Label>Soyad *</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><Label>Okul</Label><Input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} /></div>
                            <div className="space-y-1"><Label>Burs Tutarı (₺)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                        </div>
                        <div className="space-y-1"><Label>Başlangıç Tarihi</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
                        <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /><Label>Aktif burs</Label></div>
                        <div className="space-y-1"><Label>Not</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="bg-amber-600 hover:bg-amber-700 text-white">
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!toDelete}
                onOpenChange={(o) => !o && setToDelete(null)}
                onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
                title="Burs kaydı silinsin mi?"
                description={toDelete ? `${toDelete.firstName} ${toDelete.lastName} kaydı silinecek.` : ''}
                loading={deleteMutation.isPending}
            />
        </div>
    );
}
