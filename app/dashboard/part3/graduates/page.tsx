'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGraduatedStudents, upsertGraduatedStudent, deleteGraduatedStudent } from '@/app/actions/hr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ArrowLeft, GraduationCap, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

type Graduate = {
    id: string;
    firstName: string;
    lastName: string;
    graduationDate: string | null;
    school: string | null;
    notes: string | null;
};

const EMPTY = { id: undefined as string | undefined, firstName: '', lastName: '', graduationDate: '', school: '', notes: '' };

export default function GraduatesPage() {
    const qc = useQueryClient();
    const { data: result, isLoading } = useQuery({ queryKey: ['graduates'], queryFn: () => getGraduatedStudents() });
    const graduates: Graduate[] = (result?.data as Graduate[]) || [];

    const [search, setSearch] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY });
    const [toDelete, setToDelete] = useState<Graduate | null>(null);

    const saveMutation = useMutation({
        mutationFn: (data: typeof form) => upsertGraduatedStudent(data),
        onSuccess: (res) => {
            if (res.error) return toast.error(res.error);
            toast.success('Kaydedildi');
            qc.invalidateQueries({ queryKey: ['graduates'] });
            setDialogOpen(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteGraduatedStudent(id),
        onSuccess: (res) => {
            if (res.error) return toast.error(res.error);
            toast.success('Silindi');
            qc.invalidateQueries({ queryKey: ['graduates'] });
            setToDelete(null);
        },
    });

    const openNew = () => { setForm({ ...EMPTY }); setDialogOpen(true); };
    const openEdit = (g: Graduate) => {
        setForm({
            id: g.id,
            firstName: g.firstName,
            lastName: g.lastName,
            graduationDate: g.graduationDate ? format(new Date(g.graduationDate), 'yyyy-MM-dd') : '',
            school: g.school || '',
            notes: g.notes || '',
        });
        setDialogOpen(true);
    };

    const filtered = graduates.filter((g) =>
        `${g.firstName} ${g.lastName} ${g.school || ''}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                <Link href="/dashboard/part3">
                    <Button variant="ghost" className="mb-6"><ArrowLeft className="h-4 w-4 mr-2" />İnsan Kaynağına Dön</Button>
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg"><GraduationCap className="h-6 w-6 text-green-600" /></div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Mezun Öğrenciler</h1>
                            <p className="text-sm text-gray-500">Mezun öğrencilerin bilgilerini kaydedin ve takip edin</p>
                        </div>
                    </div>
                    <Button onClick={openNew} className="bg-green-600 hover:bg-green-700 text-white"><Plus className="h-4 w-4 mr-2" />Mezun Ekle</Button>
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
                        {filtered.map((g) => (
                            <Card key={g.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-800">{g.firstName} {g.lastName}</p>
                                        <p className="text-sm text-gray-500">
                                            {g.school && <span>{g.school}</span>}
                                            {g.graduationDate && <span>{g.school ? ' · ' : ''}Mezuniyet: {format(new Date(g.graduationDate), 'dd.MM.yyyy')}</span>}
                                        </p>
                                        {g.notes && <p className="text-xs text-gray-400 mt-1">{g.notes}</p>}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(g)}><Pencil className="h-4 w-4 text-gray-500" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => setToDelete(g)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{form.id ? 'Mezun Düzenle' : 'Yeni Mezun Ekle'}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><Label>Ad *</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
                            <div className="space-y-1"><Label>Soyad *</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
                        </div>
                        <div className="space-y-1"><Label>Okul</Label><Input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} /></div>
                        <div className="space-y-1"><Label>Mezuniyet Tarihi</Label><Input type="date" value={form.graduationDate} onChange={(e) => setForm({ ...form, graduationDate: e.target.value })} /></div>
                        <div className="space-y-1"><Label>Not</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white">
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!toDelete}
                onOpenChange={(o) => !o && setToDelete(null)}
                onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
                title="Mezun kaydı silinsin mi?"
                description={toDelete ? `${toDelete.firstName} ${toDelete.lastName} kaydı silinecek.` : ''}
                loading={deleteMutation.isPending}
            />
        </div>
    );
}
