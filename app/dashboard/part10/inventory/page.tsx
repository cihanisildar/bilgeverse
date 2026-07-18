'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInventory, upsertInventoryItem, deleteInventoryItem } from '@/app/actions/center';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ArrowLeft, Package, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CONDITIONS = {
    GOOD: { label: 'İyi', color: 'bg-green-100 text-green-700 border-green-200' },
    NEEDS_REPAIR: { label: 'Bakım Gerekli', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    BROKEN: { label: 'Arızalı', color: 'bg-rose-100 text-rose-700 border-rose-200' },
};
const condMeta = (c: string) => CONDITIONS[(c as keyof typeof CONDITIONS)] || CONDITIONS.GOOD;

type Item = { id: string; name: string; quantity: number; category: string | null; location: string | null; condition: string; notes: string | null };
const EMPTY = { id: undefined as string | undefined, name: '', quantity: '1', category: '', location: '', condition: 'GOOD', notes: '' };

export default function InventoryPage() {
    const qc = useQueryClient();
    const { data: result, isLoading } = useQuery({ queryKey: ['inventory'], queryFn: () => getInventory() });
    const rows: Item[] = (result?.data as Item[]) || [];

    const [search, setSearch] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY });
    const [toDelete, setToDelete] = useState<Item | null>(null);

    const saveMutation = useMutation({
        mutationFn: (data: typeof form) => upsertInventoryItem({ ...data, quantity: parseInt(data.quantity) || 1 }),
        onSuccess: (res) => { if (res.error) return toast.error(res.error); toast.success('Kaydedildi'); qc.invalidateQueries({ queryKey: ['inventory'] }); setDialogOpen(false); },
    });
    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteInventoryItem(id),
        onSuccess: (res) => { if (res.error) return toast.error(res.error); toast.success('Silindi'); qc.invalidateQueries({ queryKey: ['inventory'] }); setToDelete(null); },
    });

    const openNew = () => { setForm({ ...EMPTY }); setDialogOpen(true); };
    const openEdit = (i: Item) => { setForm({ id: i.id, name: i.name, quantity: String(i.quantity), category: i.category || '', location: i.location || '', condition: i.condition, notes: i.notes || '' }); setDialogOpen(true); };

    const filtered = rows.filter((i) => `${i.name} ${i.category || ''} ${i.location || ''}`.toLowerCase().includes(search.toLowerCase()));
    const totalCount = rows.reduce((s, i) => s + i.quantity, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                <Link href="/dashboard/part10"><Button variant="ghost" className="mb-6"><ArrowLeft className="h-4 w-4 mr-2" />Gençlik Merkezine Dön</Button></Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg"><Package className="h-6 w-6 text-emerald-600" /></div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Demirbaş Listesi</h1>
                            <p className="text-sm text-gray-500">Toplam {rows.length} kalem · {totalCount} adet</p>
                        </div>
                    </div>
                    <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Plus className="h-4 w-4 mr-2" />Demirbaş Ekle</Button>
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
                        {filtered.map((i) => {
                            const meta = condMeta(i.condition);
                            return (
                                <Card key={i.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-semibold text-gray-800">{i.name}</p>
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{i.quantity} adet</Badge>
                                                <Badge variant="outline" className={meta.color}>{meta.label}</Badge>
                                            </div>
                                            <p className="text-xs text-gray-500">{[i.category, i.location].filter(Boolean).join(' · ')}</p>
                                            {i.notes && <p className="text-xs text-gray-400 mt-1">{i.notes}</p>}
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="h-4 w-4 text-gray-500" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => setToDelete(i)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
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
                    <DialogHeader><DialogTitle>{form.id ? 'Demirbaş Düzenle' : 'Yeni Demirbaş'}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2 space-y-1"><Label>Ad *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Örn: Masa" /></div>
                            <div className="space-y-1"><Label>Adet</Label><Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1"><Label>Kategori</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Örn: Mobilya" /></div>
                            <div className="space-y-1"><Label>Konum</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Örn: 1. Kat" /></div>
                        </div>
                        <div className="space-y-1">
                            <Label>Durum</Label>
                            <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{Object.entries(CONDITIONS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1"><Label>Not</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">{saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)} title="Demirbaş silinsin mi?" description={toDelete ? `"${toDelete.name}" silinecek.` : ''} loading={deleteMutation.isPending} />
        </div>
    );
}
