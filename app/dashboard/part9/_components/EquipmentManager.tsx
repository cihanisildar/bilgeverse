'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Package, Plus, Trash2, Pencil, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAthletes, useSportBranches } from '@/app/hooks/use-athlete-data';
import { useEquipment, useUpsertEquipment, useDeleteEquipment } from '@/app/hooks/use-sports';
import { EQUIPMENT_STATUSES, EQUIPMENT_CATEGORIES, getEquipmentStatusMeta } from '@/app/lib/sports';
import { ReqMark, RequiredLegend } from './ReqMark';

export default function EquipmentManager() {
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const { data: items = [] } = useEquipment(statusFilter === 'all' ? undefined : { status: statusFilter as any });
    const { data: athletes = [] } = useAthletes();
    const { data: branches = [] } = useSportBranches();

    const upsertMutation = useUpsertEquipment();
    const deleteMutation = useDeleteEquipment();

    const [dialog, setDialog] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '', category: '', quantity: '1', status: 'IN_USE',
        assignTo: 'none', assignedAthleteId: '', assignedUnit: '', branchId: '', notes: '',
    });

    const open = (item?: any) => {
        if (item) {
            setEditItem(item);
            setForm({
                name: item.name, category: item.category ?? '', quantity: item.quantity.toString(), status: item.status,
                assignTo: item.assignedAthleteId ? 'athlete' : item.assignedUnit ? 'unit' : 'none',
                assignedAthleteId: item.assignedAthleteId ?? '', assignedUnit: item.assignedUnit ?? '',
                branchId: item.branchId ?? '', notes: item.notes ?? '',
            });
        } else {
            setEditItem(null);
            setForm({ name: '', category: '', quantity: '1', status: 'IN_USE', assignTo: 'none', assignedAthleteId: '', assignedUnit: '', branchId: '', notes: '' });
        }
        setDialog(true);
    };

    const save = () => {
        if (!form.name) { toast.error('Ekipman adı gerekli'); return; }
        upsertMutation.mutate(
            {
                id: editItem?.id,
                name: form.name,
                category: form.category || undefined,
                quantity: parseInt(form.quantity) || 1,
                status: form.status as any,
                assignedAthleteId: form.assignTo === 'athlete' ? form.assignedAthleteId || null : null,
                assignedUnit: form.assignTo === 'unit' ? form.assignedUnit || null : null,
                branchId: form.branchId || null,
                notes: form.notes,
            },
            { onSuccess: (res) => { if (!res.error) setDialog(false); } }
        );
    };

    const confirmDelete = () => {
        if (!deletingId) return;
        deleteMutation.mutate(deletingId);
        setDeletingId(null);
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Package className="h-5 w-5 text-amber-500" /> Ekipman Envanteri
                    </h2>
                    <p className="text-sm text-gray-500">Malzeme stok, zimmet ve durum takibi.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="Durum" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Durumlar</SelectItem>
                            {EQUIPMENT_STATUSES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                        </SelectContent>
                    </Select>
                    <Button onClick={() => open()} className="bg-indigo-600 hover:bg-indigo-700 text-white"><Plus className="h-4 w-4 mr-2" /> Ekle</Button>
                </div>
            </div>

            {items.length === 0 ? (
                <Card className="border-gray-100"><CardContent className="p-10 text-center text-gray-400">Ekipman kaydı yok.</CardContent></Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((item) => {
                        const meta = getEquipmentStatusMeta(item.status);
                        return (
                            <Card key={item.id} className="border-gray-100 shadow-sm group">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-bold text-gray-800">{item.name}</p>
                                            <p className="text-xs text-gray-400">{item.category || 'Genel'} · {item.quantity} adet</p>
                                        </div>
                                        <Badge variant="outline" className={`text-[10px] ${meta.color}`}>{meta.label}</Badge>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {item.assignedAthlete
                                                ? `${item.assignedAthlete.user.firstName} ${item.assignedAthlete.user.lastName}`
                                                : item.assignedUnit || 'Zimmetsiz'}
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                            <Button size="sm" variant="ghost" onClick={() => open(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                                            <Button size="sm" variant="ghost" onClick={() => setDeletingId(item.id)} className="text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Dialog open={dialog} onOpenChange={setDialog}>
                <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editItem ? 'Ekipman Düzenle' : 'Yeni Ekipman'}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1.5"><Label>Ad <ReqMark /></Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5"><Label>Kategori</Label>
                                <Select value={form.category || 'none'} onValueChange={(v) => setForm({ ...form, category: v === 'none' ? '' : v })}>
                                    <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Genel</SelectItem>
                                        {EQUIPMENT_CATEGORIES.map((c) => (<SelectItem key={c.value} value={c.label}>{c.label}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5"><Label>Adet</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5"><Label>Durum</Label>
                                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{EQUIPMENT_STATUSES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5"><Label>Branş</Label>
                                <Select value={form.branchId || 'none'} onValueChange={(v) => setForm({ ...form, branchId: v === 'none' ? '' : v })}>
                                    <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Genel</SelectItem>
                                        {branches.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5"><Label>Zimmet</Label>
                            <Select value={form.assignTo} onValueChange={(v) => setForm({ ...form, assignTo: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Zimmetsiz</SelectItem>
                                    <SelectItem value="athlete">Sporcuya</SelectItem>
                                    <SelectItem value="unit">Birime</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {form.assignTo === 'athlete' && (
                            <div className="space-y-1.5"><Label>Sporcu</Label>
                                <Select value={form.assignedAthleteId} onValueChange={(v) => setForm({ ...form, assignedAthleteId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Sporcu seçin" /></SelectTrigger>
                                    <SelectContent>{athletes.map((a) => (<SelectItem key={a.id} value={a.id}>{a.user.firstName} {a.user.lastName}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                        )}
                        {form.assignTo === 'unit' && (
                            <div className="space-y-1.5"><Label>Birim</Label><Input value={form.assignedUnit} onChange={(e) => setForm({ ...form, assignedUnit: e.target.value })} placeholder="Örn: A Takımı" /></div>
                        )}
                        <div className="space-y-1.5"><Label>Not</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                        <RequiredLegend />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialog(false)}>İptal</Button>
                        <Button onClick={save} className="bg-indigo-600 hover:bg-indigo-700 text-white">Kaydet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deletingId}
                onOpenChange={(open) => { if (!open) setDeletingId(null); }}
                onConfirm={confirmDelete}
                title="Ekipman Silinsin mi?"
                description="Bu ekipman kaydı kalıcı olarak silinecektir."
                loading={deleteMutation.isPending}
            />
        </div>
    );
}
