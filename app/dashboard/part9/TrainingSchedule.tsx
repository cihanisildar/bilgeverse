'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { createTraining } from '@/app/actions/athlete-actions';
import { toast } from 'react-hot-toast';
import { format, startOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import TrainingCalendar from './TrainingCalendar';

import { useTrainings, useSportBranches, useCreateTraining } from '@/app/hooks/use-athlete-data';

export default function TrainingSchedule({ onSelectSession }: { onSelectSession: (id: string) => void }) {
    const { data: branches = [] } = useSportBranches();
    const { data: trainings = [], isLoading: loading } = useTrainings({
        startDate: startOfMonth(new Date())
    });
    const createTrainingMutation = useCreateTraining();

    const [isAdding, setIsAdding] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newTraining, setNewTraining] = useState({
        branchId: '',
        title: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '18:00',
        endTime: '19:30',
        location: 'Spor Salonu',
        type: 'TRAINING' as 'TRAINING' | 'MATCH'
    });

    const handleCreateTraining = async () => {
        if (!newTraining.branchId || !newTraining.title || !newTraining.date) {
            toast.error('Lütfen zorunlu alanları doldurun');
            return;
        }

        setSaving(true);
        const result = await createTrainingMutation.mutateAsync({
            ...newTraining,
            date: new Date(newTraining.date),
            type: newTraining.type
        });

        if (!result.error) {
            setIsAdding(false);
        }
        setSaving(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800">Antrenman & Maç Takvimi</h3>
                    <p className="text-sm text-gray-500">Yaklaşan oturumları takip edin ve planlayın</p>
                </div>
                <Button onClick={() => setIsAdding(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Program Ekle
                </Button>
            </div>

            <div className="min-h-[400px]">
                {loading ? (
                    <div className="grid grid-cols-1 gap-4">
                        {Array(3).fill(0).map((_, i) => <Card key={i} className="animate-pulse h-24 bg-gray-50 border-0" />)}
                    </div>
                ) : (
                    <TrainingCalendar trainings={trainings} onSelectSession={onSelectSession} />
                )}
            </div>

            <Dialog open={isAdding} onOpenChange={setIsAdding}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Yeni Oturum Planla</DialogTitle>
                        <DialogDescription>Antrenman veya maç detaylarını girin.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Branş</Label>
                                <Select value={newTraining.branchId} onValueChange={(v) => setNewTraining({ ...newTraining, branchId: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tür</Label>
                                <Select value={newTraining.type} onValueChange={(v: any) => setNewTraining({ ...newTraining, type: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TRAINING">Antrenman</SelectItem>
                                        <SelectItem value="MATCH">Maç</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Başlık</Label>
                            <Input
                                placeholder="örn: Teknik Antrenman veya Dostluk Maçı"
                                value={newTraining.title}
                                onChange={(e) => setNewTraining({ ...newTraining, title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Açıklama</Label>
                            <Textarea
                                placeholder="Detaylar..."
                                value={newTraining.description}
                                onChange={(e) => setNewTraining({ ...newTraining, description: e.target.value })}
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Tarih</Label>
                                <Input type="date" value={newTraining.date} onChange={(e) => setNewTraining({ ...newTraining, date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Başlangıç</Label>
                                <Input type="time" value={newTraining.startTime} onChange={(e) => setNewTraining({ ...newTraining, startTime: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Bitiş</Label>
                                <Input type="time" value={newTraining.endTime} onChange={(e) => setNewTraining({ ...newTraining, endTime: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Konum</Label>
                            <Input value={newTraining.location} onChange={(e) => setNewTraining({ ...newTraining, location: e.target.value })} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAdding(false)} disabled={saving}>İptal</Button>
                        <Button onClick={handleCreateTraining} className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={saving}>
                            {saving ? 'Planlanıyor...' : 'Planla'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
