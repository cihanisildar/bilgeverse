'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCharacterGroupsOverview, upsertCharacterGroup, deleteCharacterGroup, setTutorStatus } from '@/app/actions/hr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ArrowLeft, Users2, Plus, Pencil, Trash2, School, Building2, UserX, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

type TutorLite = { isActive?: boolean; tutorStatus: string | null };
type Tutor = { id: string; firstName: string | null; lastName: string | null; username: string; isActive: boolean; tutorStatus: string | null; _count: { characterGroups: number } };
type Group = { id: string; name: string; locationType: string; locationName: string | null; tutorId: string | null; isActive: boolean; notes: string | null; tutor: ({ id: string; firstName: string | null; lastName: string | null; username: string } & TutorLite) | null };

const TUTOR_STATUS = {
    ACTIVE: { label: 'Aktif', color: 'bg-green-100 text-green-700 border-green-200' },
    STANDBY: { label: 'Hazırda Bekliyor', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    PASSIVE: { label: 'Pasif', color: 'bg-gray-100 text-gray-600 border-gray-200' },
    LEAVING: { label: 'Ayrılacak', color: 'bg-rose-100 text-rose-700 border-rose-200' },
};
const statusMeta = (s: string | null) => TUTOR_STATUS[(s as keyof typeof TUTOR_STATUS)] || TUTOR_STATUS.ACTIVE;
// Effective status derives passive from BOTH the HR status and the account's
// active/passive flag (Kullanıcı Yönetimi), so the two never contradict.
const effectiveStatus = (t: TutorLite): keyof typeof TUTOR_STATUS =>
    t.isActive === false || t.tutorStatus === 'PASSIVE' ? 'PASSIVE' : ((t.tutorStatus as keyof typeof TUTOR_STATUS) || 'ACTIVE');
const tName = (t: { firstName: string | null; lastName: string | null; username: string }) => (t.firstName || t.lastName ? `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim() : t.username);

const EMPTY = { id: undefined as string | undefined, name: '', locationType: 'CENTER', locationName: '', tutorId: 'none', isActive: true, notes: '' };

export default function CharacterGroupsPage() {
    const qc = useQueryClient();
    const { data: result, isLoading } = useQuery({ queryKey: ['character-groups'], queryFn: () => getCharacterGroupsOverview() });
    const { groups = [], tutors = [] } = (result?.data as { groups: Group[]; tutors: Tutor[] }) || {};

    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY });
    const [toDelete, setToDelete] = useState<Group | null>(null);

    const invalidate = () => qc.invalidateQueries({ queryKey: ['character-groups'] });

    const saveMutation = useMutation({
        mutationFn: (data: typeof form) => upsertCharacterGroup({ ...data, tutorId: data.tutorId === 'none' ? null : data.tutorId }),
        onSuccess: (res) => { if (res.error) return toast.error(res.error); toast.success('Kaydedildi'); invalidate(); setDialogOpen(false); },
    });
    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteCharacterGroup(id),
        onSuccess: (res) => { if (res.error) return toast.error(res.error); toast.success('Silindi'); invalidate(); setToDelete(null); },
    });
    const statusMutation = useMutation({
        mutationFn: ({ tutorId, status }: { tutorId: string; status: string }) => setTutorStatus(tutorId, status),
        onSuccess: (res) => { if (res.error) return toast.error(res.error); invalidate(); },
    });

    const openNew = () => { setForm({ ...EMPTY }); setDialogOpen(true); };
    const openEdit = (g: Group) => {
        setForm({ id: g.id, name: g.name, locationType: g.locationType, locationName: g.locationName || '', tutorId: g.tutorId || 'none', isActive: g.isActive, notes: g.notes || '' });
        setDialogOpen(true);
    };

    const schoolGroups = groups.filter((g) => g.locationType === 'SCHOOL');
    const centerGroups = groups.filter((g) => g.locationType !== 'SCHOOL');
    const needTutor = groups.filter((g) => !g.tutorId).length;

    const byStatus = (s: string) => tutors.filter((t) => (t.tutorStatus || 'ACTIVE') === s);

    const GroupCard = ({ g }: { g: Group }) => (
        <Card className={`overflow-hidden ${!g.tutorId ? 'border-amber-300 bg-amber-50/30' : ''}`}>
            <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800">{g.name}</p>
                        {!g.isActive && <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200">Pasif</Badge>}
                    </div>
                    {g.locationName && <p className="text-xs text-gray-500">{g.locationName}</p>}
                    <div className="mt-2 text-sm">
                        {g.tutor ? (
                            <span className="inline-flex items-center gap-1.5 flex-wrap text-gray-700">
                                Rehber: <span className="font-medium">{tName(g.tutor)}</span>
                                {effectiveStatus(g.tutor) !== 'ACTIVE' && (
                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusMeta(effectiveStatus(g.tutor)).color}`}>
                                        {statusMeta(effectiveStatus(g.tutor)).label}
                                    </Badge>
                                )}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium"><UserX className="h-3.5 w-3.5" /> Henüz atanmadı</span>
                        )}
                    </div>
                    {g.notes && <p className="text-xs text-gray-400 mt-1">{g.notes}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(g)}><Pencil className="h-4 w-4 text-gray-500" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setToDelete(g)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <Link href="/dashboard/part2">
                    <Button variant="ghost" className="mb-6"><ArrowLeft className="h-4 w-4 mr-2" />Değerler Halkası&apos;na Dön</Button>
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100 rounded-lg"><Users2 className="h-6 w-6 text-teal-600" /></div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Değerler Halkası Grupları</h1>
                            <p className="text-sm text-gray-500">Gruplar, sorumlu rehberler ve rehber durumları</p>
                        </div>
                    </div>
                    <Button onClick={openNew} className="bg-teal-600 hover:bg-teal-700 text-white"><Plus className="h-4 w-4 mr-2" />Grup Ekle</Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <Card className="border-none shadow-sm"><CardContent className="p-4"><p className="text-2xl font-bold text-gray-800">{groups.length}</p><p className="text-xs text-gray-500">Toplam Grup</p></CardContent></Card>
                    <Card className="border-none shadow-sm"><CardContent className="p-4"><p className="text-2xl font-bold text-blue-700">{schoolGroups.length}</p><p className="text-xs text-gray-500">Okul Grubu</p></CardContent></Card>
                    <Card className="border-none shadow-sm"><CardContent className="p-4"><p className="text-2xl font-bold text-indigo-700">{centerGroups.length}</p><p className="text-xs text-gray-500">Merkez Grubu</p></CardContent></Card>
                    <Card className={`border-none shadow-sm ${needTutor > 0 ? 'bg-amber-50' : ''}`}><CardContent className="p-4"><p className="text-2xl font-bold text-amber-700 flex items-center gap-1">{needTutor > 0 && <AlertTriangle className="h-5 w-5" />}{needTutor}</p><p className="text-xs text-gray-500">Rehber İhtiyacı</p></CardContent></Card>
                </div>

                {isLoading ? (
                    <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
                ) : (
                    <div className="space-y-8">
                        {/* Okul grupları */}
                        <div>
                            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3"><School className="h-5 w-5 text-blue-600" /> Okul Grupları ({schoolGroups.length})</h2>
                            {schoolGroups.length === 0 ? <p className="text-sm text-gray-400">Okul grubu yok.</p> : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{schoolGroups.map((g) => <GroupCard key={g.id} g={g} />)}</div>
                            )}
                        </div>
                        {/* Merkez grupları */}
                        <div>
                            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3"><Building2 className="h-5 w-5 text-indigo-600" /> Merkez Grupları ({centerGroups.length})</h2>
                            {centerGroups.length === 0 ? <p className="text-sm text-gray-400">Merkez grubu yok.</p> : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{centerGroups.map((g) => <GroupCard key={g.id} g={g} />)}</div>
                            )}
                        </div>

                        {/* Rehber durumları */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 mb-3">Rehber Durumları</h2>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                                {tutors.length === 0 ? <p className="p-4 text-sm text-gray-400">Rehber bulunmuyor.</p> : tutors.map((t) => {
                                    const eff = effectiveStatus(t);
                                    const meta = statusMeta(eff);
                                    return (
                                        <div key={t.id} className="flex items-center justify-between p-3 gap-3">
                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-800 truncate">{tName(t)}</p>
                                                <p className="text-xs text-gray-500">{t._count.characterGroups} grup</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={meta.color}>{meta.label}</Badge>
                                                <Select value={eff} onValueChange={(v) => statusMutation.mutate({ tutorId: t.id, status: v })}>
                                                    <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(TUTOR_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Group dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{form.id ? 'Grubu Düzenle' : 'Yeni Değerler Halkası Grubu'}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1"><Label>Grup Adı *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Örn: Merkez 1. Grup" /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Konum Türü</Label>
                                <Select value={form.locationType} onValueChange={(v) => setForm({ ...form, locationType: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="SCHOOL">Okul</SelectItem><SelectItem value="CENTER">Merkez</SelectItem></SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1"><Label>Okul / Konum Adı</Label><Input value={form.locationName} onChange={(e) => setForm({ ...form, locationName: e.target.value })} placeholder="Örn: Ömer Dinçer Lisesi" /></div>
                        </div>
                        <div className="space-y-1">
                            <Label>Sorumlu Rehber</Label>
                            <Select value={form.tutorId} onValueChange={(v) => setForm({ ...form, tutorId: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Henüz atanmadı</SelectItem>
                                    {tutors.map((t) => <SelectItem key={t.id} value={t.id}>{tName(t)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1"><Label>Not</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="bg-teal-600 hover:bg-teal-700 text-white">
                            {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!toDelete}
                onOpenChange={(o) => !o && setToDelete(null)}
                onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
                title="Grup silinsin mi?"
                description={toDelete ? `"${toDelete.name}" grubu silinecek.` : ''}
                loading={deleteMutation.isPending}
            />
        </div>
    );
}
