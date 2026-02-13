'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, Clock, MapPin, Plus, ChevronRight, Trophy, Dumbbell } from 'lucide-react';
import { getTrainings, createTraining, getSportBranches } from '@/app/actions/athlete-actions';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function TrainingSchedule({ onSelectSession }: { onSelectSession: (id: string) => void }) {
    const [trainings, setTrainings] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
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
    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [trainingsRes, branchesRes] = await Promise.all([
            getTrainings({ startDate: new Date() }),
            getSportBranches()
        ]);
        if (trainingsRes.data) setTrainings(trainingsRes.data);
        if (branchesRes.data) setBranches(branchesRes.data);
        setLoading(false);
    };

    const handleCreateTraining = async () => {
        if (!newTraining.branchId || !newTraining.title || !newTraining.date) {
            toast({ title: 'Hata', description: 'Lütfen zorunlu alanları doldurun', variant: 'destructive' });
            return;
        }

        const result = await createTraining({
            ...newTraining,
            date: new Date(newTraining.date),
            type: newTraining.type
        });

        if (!result.error) {
            toast({ title: 'Başarılı', description: 'Oturum planlandı' });
            setIsAdding(false);
            fetchData();
        } else {
            toast({ title: 'Hata', description: result.error, variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800">Antrenman & Maç Takvimi</h3>
                    <p className="text-sm text-gray-500">Yaklaşan oturumları takip edin ve planlayın</p>
                </div>
                <Button onClick={() => setIsAdding(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                    <Plus className="h-4 w-4 mr-2" /> Program Ekle
                </Button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    Array(3).fill(0).map((_, i) => <Card key={i} className="animate-pulse h-24 bg-gray-50 border-0" />)
                ) : trainings.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Planlanmış oturum bulunmuyor</p>
                        <Button variant="link" onClick={() => setIsAdding(true)} className="text-indigo-600">İlk oturumu oluşturun</Button>
                    </div>
                ) : (
                    trainings.map((training) => (
                        <Card key={training.id} className="hover:border-indigo-200 transition-colors cursor-pointer" onClick={() => onSelectSession(training.id)}>
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                    <div className="flex gap-4 items-start min-w-0">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                                            training.type === 'MATCH' ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"
                                        )}>
                                            {training.type === 'MATCH' ? <Trophy className="h-6 w-6" /> : <Dumbbell className="h-6 w-6" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider h-5">
                                                    {training.branch.name}
                                                </Badge>
                                                <span className="text-xs text-gray-400">•</span>
                                                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-tighter">
                                                    {training.type === 'MATCH' ? 'MÜSABAKA' : 'ANTRENMAN'}
                                                </span>
                                            </div>
                                            <h4 className="text-lg font-bold text-gray-900 truncate">{training.title}</h4>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                                    {format(new Date(training.date), 'dd MMMM yyyy', { locale: tr })}
                                                </div>
                                                <div className="flex items-center">
                                                    <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                                    {training.startTime} - {training.endTime}
                                                </div>
                                                <div className="flex items-center">
                                                    <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                                    {training.location}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 mt-3 sm:mt-0">
                                        <div className="text-left sm:text-right">
                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-tight">Katılım durumu</p>
                                            <p className="text-sm font-bold text-gray-700">
                                                {training._count.attendances > 0 ? `${training._count.attendances} Sporcu` : 'Girilmedi'}
                                            </p>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
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
                        <Button variant="outline" onClick={() => setIsAdding(false)}>İptal</Button>
                        <Button onClick={handleCreateTraining} className="bg-indigo-600 hover:bg-indigo-700 text-white">Planla</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
