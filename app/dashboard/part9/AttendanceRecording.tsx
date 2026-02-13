'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, ArrowLeft, Save, Trophy, Timer, Ruler } from 'lucide-react';
import { getTrainingDetails, recordAttendance, recordPerformance } from '@/app/actions/athlete-actions';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function AttendanceRecording({ trainingId, onBack }: { trainingId: string; onBack: () => void }) {
    const [training, setTraining] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [attendances, setAttendances] = useState<Record<string, 'YAPILDI' | 'YOKTU' | 'YAPILMADI'>>({});
    const [performances, setPerformances] = useState<Record<string, { type: string; value: string }[]>>({});
    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, [trainingId]);

    const fetchData = async () => {
        setLoading(true);
        const result = await getTrainingDetails(trainingId);
        if (result.data) {
            setTraining(result.data);

            // Initialize states from existing data
            const initialAtt: Record<string, any> = {};
            result.data.attendances.forEach((a: any) => {
                initialAtt[a.athleteId] = a.status;
            });
            setAttendances(initialAtt);

            const initialPerf: Record<string, any[]> = {};
            result.data.performances.forEach((p: any) => {
                if (!initialPerf[p.athleteId]) initialPerf[p.athleteId] = [];
                initialPerf[p.athleteId].push({ type: p.metricType, value: p.value });
            });
            setPerformances(initialPerf);
        }
        setLoading(false);
    };

    const handleAttendanceChange = (athleteId: string, status: 'YAPILDI' | 'YOKTU') => {
        setAttendances(prev => ({ ...prev, [athleteId]: status }));
    };

    const handleMetricChange = (athleteId: string, type: string, value: string) => {
        setPerformances(prev => {
            const athletePerfs = prev[athleteId] || [];
            const existingIdx = athletePerfs.findIndex(p => p.type === type);

            let newPerfs;
            if (existingIdx >= 0) {
                newPerfs = [...athletePerfs];
                newPerfs[existingIdx] = { type, value };
            } else {
                newPerfs = [...athletePerfs, { type, value }];
            }

            return { ...prev, [athleteId]: newPerfs };
        });
    };

    const handleSave = async () => {
        setSaving(true);

        // Convert states to arrays for actions
        const attArray = Object.entries(attendances).map(([athleteId, status]) => ({ athleteId, status: status as any }));
        const perfArray: any[] = [];
        Object.entries(performances).forEach(([athleteId, perfs]) => {
            perfs.forEach(p => {
                if (p.value) perfArray.push({ athleteId, metricType: p.type, value: p.value });
            });
        });

        try {
            const [attRes, perfRes] = await Promise.all([
                attArray.length ? recordAttendance(trainingId, attArray) : Promise.resolve({ error: null }),
                perfArray.length ? recordPerformance(trainingId, perfArray) : Promise.resolve({ error: null })
            ]);

            if (!attRes.error && !perfRes.error) {
                toast({ title: 'Başarılı', description: 'Veriler kaydedildi' });
            } else {
                toast({ title: 'Hata', description: attRes.error || perfRes.error, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Hata', description: 'Kaydedilirken bir sorun oluştu', variant: 'destructive' });
        }

        setSaving(false);
    };

    if (loading) return <div className="py-12 text-center">Yükleniyor...</div>;
    if (!training) return <div className="py-12 text-center text-red-500">Oturum bulunamadı</div>;

    const athletes = training.branch.athletes;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-indigo-100 text-indigo-700 text-[10px]">{training.branch.name}</Badge>
                            <span className="text-xs text-gray-500">{format(new Date(training.date), 'long', { locale: tr })}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">{training.title}</h3>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
                    <Save className="h-4 w-4 mr-2" /> {saving ? 'Kaydediliyor...' : 'Tümünü Kaydet'}
                </Button>
            </div>

            <Card className="border-0 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="w-[250px]">Sporcu</TableHead>
                            <TableHead className="text-center">Katılım</TableHead>
                            <TableHead>Performans Metrikleri</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {athletes.map((athlete: any) => {
                            const status = attendances[athlete.id] || 'YOKTU';
                            const perf = performances[athlete.id] || [];
                            const score = perf.find(p => p.type === 'SCORE')?.value || '';
                            const time = perf.find(p => p.type === 'TIME')?.value || '';
                            const distance = perf.find(p => p.type === 'DISTANCE')?.value || '';

                            return (
                                <TableRow key={athlete.id} className={cn(status === 'YOKTU' && "bg-gray-50/50")}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={athlete.user.avatarUrl} />
                                                <AvatarFallback className="bg-gray-100">{athlete.user.firstName?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-gray-900 truncate">{athlete.user.firstName} {athlete.user.lastName}</p>
                                                <p className="text-xs text-gray-400 truncate">@{athlete.user.username}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-center gap-2">
                                            <Button
                                                variant={status === 'YAPILDI' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => handleAttendanceChange(athlete.id, 'YAPILDI')}
                                                className={cn("h-8 w-8 p-0 rounded-full", status === 'YAPILDI' ? "bg-green-600 hover:bg-green-700" : "text-gray-400")}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant={status === 'YOKTU' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => handleAttendanceChange(athlete.id, 'YOKTU')}
                                                className={cn("h-8 w-8 p-0 rounded-full", status === 'YOKTU' ? "bg-red-600 hover:bg-red-700" : "text-gray-400")}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Trophy className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-amber-500" />
                                                <Input
                                                    placeholder="Skor"
                                                    className="h-8 pl-7 text-xs"
                                                    value={score}
                                                    onChange={(e) => handleMetricChange(athlete.id, 'SCORE', e.target.value)}
                                                    disabled={status === 'YOKTU'}
                                                />
                                            </div>
                                            <div className="relative flex-1">
                                                <Timer className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-blue-500" />
                                                <Input
                                                    placeholder="Süre"
                                                    className="h-8 pl-7 text-xs"
                                                    value={time}
                                                    onChange={(e) => handleMetricChange(athlete.id, 'TIME', e.target.value)}
                                                    disabled={status === 'YOKTU'}
                                                />
                                            </div>
                                            <div className="relative flex-1">
                                                <Ruler className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-emerald-500" />
                                                <Input
                                                    placeholder="Mesaf."
                                                    className="h-8 pl-7 text-xs"
                                                    value={distance}
                                                    onChange={(e) => handleMetricChange(athlete.id, 'DISTANCE', e.target.value)}
                                                    disabled={status === 'YOKTU'}
                                                />
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
