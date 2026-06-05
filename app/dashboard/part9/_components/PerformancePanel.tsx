'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { LineChart, Plus, Trash2, MessageSquareText } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    useAthletesList,
    useAthleteStats,
    useAthleteEvaluations,
    useCreateEvaluation,
    useDeleteEvaluation,
} from '@/app/hooks/use-sports';
import { EVALUATION_CATEGORIES, getEvaluationCategoryLabel } from '@/app/lib/sports';
import { ReqMark } from './ReqMark';
import { format } from 'date-fns';

export default function PerformancePanel() {
    const [selectedId, setSelectedId] = useState<string>('');
    const [category, setCategory] = useState<string>(EVALUATION_CATEGORIES[0].value);
    const [note, setNote] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const { data: athletes = [] } = useAthletesList();
    const { data: stats, isFetching: statsLoading } = useAthleteStats(selectedId);
    const { data: evaluations = [] } = useAthleteEvaluations(selectedId);
    const createEvaluation = useCreateEvaluation();
    const deleteEvaluation = useDeleteEvaluation();
    const loading = statsLoading;

    // Default to the first athlete once the list loads.
    useEffect(() => {
        if (!selectedId && athletes.length > 0) setSelectedId(athletes[0].id);
    }, [athletes, selectedId]);

    const handleAddEvaluation = () => {
        if (!note.trim()) {
            toast.error('Değerlendirme notu boş olamaz');
            return;
        }
        createEvaluation.mutate({ athleteId: selectedId, category, note }, {
            onSuccess: (res) => { if (!res.error) setNote(''); },
        });
    };

    const confirmDelete = () => {
        if (!deletingId) return;
        deleteEvaluation.mutate(deletingId);
        setDeletingId(null);
    };

    const saving = createEvaluation.isPending;
    const selectedAthlete = athletes.find((a: any) => a.id === selectedId);

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <LineChart className="h-5 w-5 text-indigo-500" /> Performans & Değerlendirme
                    </h2>
                    <p className="text-sm text-gray-500">Sporcu metrik geçmişi ve antrenör değerlendirme notları.</p>
                </div>
                <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger className="w-full sm:w-64">
                        <SelectValue placeholder="Sporcu seçin" />
                    </SelectTrigger>
                    <SelectContent>
                        {athletes.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                                {a.user.firstName} {a.user.lastName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {!selectedId ? (
                <Card className="border-gray-100"><CardContent className="p-12 text-center text-gray-400">Sporcu bulunamadı.</CardContent></Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Add evaluation + list */}
                    <Card className="border-gray-100 shadow-sm">
                        <CardContent className="p-5 space-y-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <MessageSquareText className="h-4 w-4 text-indigo-500" /> Değerlendirme Notları
                            </h3>
                            <div className="space-y-3 bg-gray-50/60 p-3 rounded-xl border border-gray-100">
                                <div className="space-y-1.5">
                                    <Label>Kategori</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {EVALUATION_CATEGORIES.map((c) => (
                                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Not / Gözlem <ReqMark /></Label>
                                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Gelişim, gözlem veya performans notu..." rows={3} />
                                </div>
                                <Button onClick={handleAddEvaluation} disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                                    <Plus className="h-4 w-4 mr-2" /> {saving ? 'Kaydediliyor...' : 'Değerlendirme Ekle'}
                                </Button>
                            </div>

                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {evaluations.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4">Henüz değerlendirme yok.</p>
                                ) : (
                                    evaluations.map((ev) => (
                                        <div key={ev.id} className="p-3 rounded-xl border border-gray-100 group">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="secondary" className="text-[10px]">{getEvaluationCategoryLabel(ev.category)}</Badge>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] text-gray-400">{format(new Date(ev.date), 'dd.MM.yyyy')}</span>
                                                    <button onClick={() => setDeletingId(ev.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700 mt-1.5 whitespace-pre-wrap">{ev.note}</p>
                                            {ev.coach && (
                                                <p className="text-[11px] text-gray-400 mt-1">— {ev.coach.firstName} {ev.coach.lastName}</p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Metric history */}
                    <Card className="border-gray-100 shadow-sm">
                        <CardContent className="p-5 space-y-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <LineChart className="h-4 w-4 text-emerald-500" /> Metrik Geçmişi
                            </h3>
                            {loading ? (
                                <p className="text-sm text-gray-400">Yükleniyor...</p>
                            ) : !stats || stats.performances.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">
                                    {selectedAthlete ? 'Bu sporcu için metrik kaydı yok.' : ''}
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {stats.performances.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50/60 border border-gray-100">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">{p.training?.title ?? 'Antrenman'}</p>
                                                <p className="text-[11px] text-gray-400">
                                                    {p.training?.date ? format(new Date(p.training.date), 'dd.MM.yyyy') : ''} · {p.metricType}
                                                </p>
                                            </div>
                                            <span className="text-sm font-bold text-emerald-600">{p.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            <ConfirmDialog
                open={!!deletingId}
                onOpenChange={(open) => { if (!open) setDeletingId(null); }}
                onConfirm={confirmDelete}
                title="Değerlendirme Silinsin mi?"
                description="Bu değerlendirme notu kalıcı olarak silinecektir."
                loading={deleteEvaluation.isPending}
            />
        </div>
    );
}
