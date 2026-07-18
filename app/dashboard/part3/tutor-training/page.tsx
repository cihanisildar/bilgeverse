'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTutorTrainingMatrix, upsertTrainingProgram, deleteTrainingProgram, setTutorTrainingRecord } from '@/app/actions/hr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ArrowLeft, BookOpen, Plus, Pencil, Trash2, Check, StickyNote } from 'lucide-react';
import { toast } from 'react-hot-toast';

type Tutor = { id: string; firstName: string | null; lastName: string | null; username: string };
type Program = { id: string; name: string; description: string | null; orderIndex: number };
type Record = { id: string; programId: string; tutorId: string; completed: boolean; notes: string | null };

export default function TutorTrainingPage() {
    const qc = useQueryClient();
    const { data: result, isLoading } = useQuery({ queryKey: ['tutor-training'], queryFn: () => getTutorTrainingMatrix() });
    const { tutors = [], programs = [], records = [] } = (result?.data as { tutors: Tutor[]; programs: Program[]; records: Record[] }) || {};

    const [programDialog, setProgramDialog] = useState(false);
    const [programForm, setProgramForm] = useState<{ id?: string; name: string; description: string }>({ name: '', description: '' });
    const [programToDelete, setProgramToDelete] = useState<Program | null>(null);
    const [cell, setCell] = useState<{ tutor: Tutor; program: Program; completed: boolean; notes: string } | null>(null);

    const recordFor = (tutorId: string, programId: string) => records.find((r) => r.tutorId === tutorId && r.programId === programId);
    const tutorName = (t: Tutor) => (t.firstName || t.lastName ? `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim() : t.username);

    const saveProgram = useMutation({
        mutationFn: (data: typeof programForm) => upsertTrainingProgram(data),
        onSuccess: (res) => {
            if (res.error) return toast.error(res.error);
            toast.success('Eğitim kaydedildi');
            qc.invalidateQueries({ queryKey: ['tutor-training'] });
            setProgramDialog(false);
        },
    });
    const removeProgram = useMutation({
        mutationFn: (id: string) => deleteTrainingProgram(id),
        onSuccess: (res) => {
            if (res.error) return toast.error(res.error);
            toast.success('Eğitim silindi');
            qc.invalidateQueries({ queryKey: ['tutor-training'] });
            setProgramToDelete(null);
        },
    });
    const saveCell = useMutation({
        mutationFn: (data: { programId: string; tutorId: string; completed: boolean; notes: string }) => setTutorTrainingRecord(data),
        onSuccess: (res) => {
            if (res.error) return toast.error(res.error);
            qc.invalidateQueries({ queryKey: ['tutor-training'] });
            setCell(null);
        },
    });

    const openCell = (tutor: Tutor, program: Program) => {
        const rec = recordFor(tutor.id, program.id);
        setCell({ tutor, program, completed: rec?.completed ?? false, notes: rec?.notes ?? '' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <Link href="/dashboard/part3">
                    <Button variant="ghost" className="mb-6"><ArrowLeft className="h-4 w-4 mr-2" />İnsan Kaynağına Dön</Button>
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-100 rounded-lg"><BookOpen className="h-6 w-6 text-cyan-600" /></div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Rehber Eğitim Takibi</h1>
                            <p className="text-sm text-gray-500">Hangi rehberin hangi eğitimi aldığını takip edin</p>
                        </div>
                    </div>
                    <Button onClick={() => { setProgramForm({ name: '', description: '' }); setProgramDialog(true); }} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />Eğitim Ekle
                    </Button>
                </div>

                {isLoading ? (
                    <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
                ) : programs.length === 0 ? (
                    <Card><CardContent className="py-12 text-center text-gray-500">Henüz eğitim tanımlanmamış. "Eğitim Ekle" ile başlayın.</CardContent></Card>
                ) : tutors.length === 0 ? (
                    <Card><CardContent className="py-12 text-center text-gray-500">Sistemde rehber bulunmuyor.</CardContent></Card>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left p-3 font-semibold text-gray-600 sticky left-0 bg-white">Rehber</th>
                                    {programs.map((p) => (
                                        <th key={p.id} className="p-3 font-semibold text-gray-600 text-center whitespace-nowrap group">
                                            <div className="flex items-center justify-center gap-1">
                                                <span>{p.name}</span>
                                                <span className="opacity-0 group-hover:opacity-100 flex gap-0.5">
                                                    <button onClick={() => { setProgramForm({ id: p.id, name: p.name, description: p.description || '' }); setProgramDialog(true); }} title="Düzenle"><Pencil className="h-3 w-3 text-gray-400" /></button>
                                                    <button onClick={() => setProgramToDelete(p)} title="Sil"><Trash2 className="h-3 w-3 text-rose-400" /></button>
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tutors.map((t) => (
                                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                        <td className="p-3 font-medium text-gray-800 sticky left-0 bg-white whitespace-nowrap">{tutorName(t)}</td>
                                        {programs.map((p) => {
                                            const rec = recordFor(t.id, p.id);
                                            return (
                                                <td key={p.id} className="p-2 text-center">
                                                    <button
                                                        onClick={() => openCell(t, p)}
                                                        className={`inline-flex items-center justify-center h-8 w-8 rounded-lg border transition-colors ${rec?.completed ? 'bg-green-500 border-green-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-300 hover:border-green-300'}`}
                                                        title={rec?.notes || (rec?.completed ? 'Aldı' : 'Almadı')}
                                                    >
                                                        {rec?.completed ? <Check className="h-4 w-4" /> : ''}
                                                    </button>
                                                    {rec?.notes && <StickyNote className="h-3 w-3 text-amber-400 mx-auto mt-0.5" />}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Program dialog */}
            <Dialog open={programDialog} onOpenChange={setProgramDialog}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{programForm.id ? 'Eğitimi Düzenle' : 'Yeni Eğitim'}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1"><Label>Eğitim Adı *</Label><Input value={programForm.name} onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })} placeholder="Örn: A Eğitimi" /></div>
                        <div className="space-y-1"><Label>Açıklama</Label><Textarea value={programForm.description} onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })} rows={2} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setProgramDialog(false)}>İptal</Button>
                        <Button onClick={() => saveProgram.mutate(programForm)} disabled={saveProgram.isPending} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                            {saveProgram.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cell (record) dialog */}
            <Dialog open={!!cell} onOpenChange={(o) => !o && setCell(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{cell ? `${cell.tutor.firstName ?? cell.tutor.username} · ${cell.program.name}` : ''}</DialogTitle></DialogHeader>
                    {cell && (
                        <div className="space-y-4 py-2">
                            <div className="flex items-center gap-2">
                                <Switch checked={cell.completed} onCheckedChange={(v) => setCell({ ...cell, completed: v })} />
                                <Label>Bu eğitimi aldı</Label>
                            </div>
                            <div className="space-y-1">
                                <Label>Not (yönetim)</Label>
                                <Textarea value={cell.notes} onChange={(e) => setCell({ ...cell, notes: e.target.value })} rows={3} placeholder="Bu rehber / eğitim hakkında not..." />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCell(null)}>İptal</Button>
                        <Button
                            onClick={() => cell && saveCell.mutate({ programId: cell.program.id, tutorId: cell.tutor.id, completed: cell.completed, notes: cell.notes })}
                            disabled={saveCell.isPending}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white"
                        >
                            {saveCell.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!programToDelete}
                onOpenChange={(o) => !o && setProgramToDelete(null)}
                onConfirm={() => programToDelete && removeProgram.mutate(programToDelete.id)}
                title="Eğitim silinsin mi?"
                description={programToDelete ? `"${programToDelete.name}" eğitimi ve tüm rehber kayıtları silinecek.` : ''}
                loading={removeProgram.isPending}
            />
        </div>
    );
}
