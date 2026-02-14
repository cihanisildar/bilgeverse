'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, ArrowLeft, Save, Trophy, Timer, Ruler, Users, CheckCircle, XCircle } from 'lucide-react';
import { getTrainingDetails, recordAttendance, recordPerformance } from '@/app/actions/athlete-actions';
import { toast } from 'react-hot-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import { useTrainingDetails, useRecordAttendance, useRecordPerformance } from '@/app/hooks/use-athlete-data';

export default function AttendanceRecording({ trainingId, onBack }: { trainingId: string; onBack: () => void }) {
    const { data: training, isLoading: loading } = useTrainingDetails(trainingId);
    const recordAttendanceMutation = useRecordAttendance();
    const recordPerformanceMutation = useRecordPerformance();

    const [saving, setSaving] = useState(false);
    const [attendances, setAttendances] = useState<Record<string, 'YAPILDI' | 'YOKTU' | 'YAPILMADI'>>({});
    const [performances, setPerformances] = useState<Record<string, { type: string; value: string }[]>>({});

    // Initialize states from existing data
    useEffect(() => {
        if (training) {
            const initialAtt: Record<string, any> = {};
            training.attendances.forEach((a: any) => {
                initialAtt[a.athleteId] = a.status;
            });
            setAttendances(initialAtt);

            const initialPerf: Record<string, any[]> = {};
            training.performances.forEach((p: any) => {
                if (!initialPerf[p.athleteId]) initialPerf[p.athleteId] = [];
                initialPerf[p.athleteId].push({ type: p.metricType, value: p.value });
            });
            setPerformances(initialPerf);
        }
    }, [training]);

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
                toast.success('Yoklama ve performans verileri başarıyla kaydedildi');
            } else {
                toast.error(attRes.error || perfRes.error || 'Kaydedilirken bir hata oluştu');
            }
        } catch (error) {
            toast.error('Bağlantı hatası: Veriler sunucuya gönderilemedi');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="py-24 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium tracking-wide">Oturum detayları hazırlanıyor...</p>
    </div>;

    if (!training) return <div className="py-24 text-center text-red-500 font-bold">Oturum verisi yüklenemedi.</div>;

    const athletes = training.branch.athletes;
    const presentCount = Object.values(attendances).filter(v => v === 'YAPILDI').length;
    const absentCount = Object.values(attendances).filter(v => v === 'YOKTU').length;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Stats Section */}
            <div className="relative overflow-hidden rounded-3xl bg-indigo-900 p-8 text-white shadow-2xl">
                <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-indigo-700/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-4">
                        <Button variant="ghost" size="sm" onClick={onBack} className="text-indigo-100 hover:text-white hover:bg-white/10 -ml-2 h-8 px-2">
                            <ArrowLeft className="h-4 w-4 mr-1" /> Geri Dön
                        </Button>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge variant="outline" className="bg-indigo-400/20 border-indigo-300 text-indigo-100 text-[10px] font-bold tracking-wider px-3">
                                    {training.branch.name.toUpperCase()}
                                </Badge>
                                <span className="text-xs text-indigo-200 font-medium">
                                    {format(new Date(training.date), 'd MMMM yyyy', { locale: tr })}
                                </span>
                            </div>
                            <h3 className="text-3xl font-black tracking-tight">{training.title}</h3>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 w-full md:w-auto">
                        <div className="flex-1 md:flex-none flex items-center gap-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 min-w-[120px]">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                <Users className="h-5 w-5 text-indigo-200" />
                            </div>
                            <div>
                                <p className="text-xs text-indigo-300 font-bold">Toplam</p>
                                <p className="text-xl font-black">{athletes.length}</p>
                            </div>
                        </div>
                        <div className="flex-1 md:flex-none flex items-center gap-4 p-4 bg-green-500/20 backdrop-blur-md rounded-2xl border border-green-400/20 min-w-[120px]">
                            <div className="w-10 h-10 rounded-xl bg-green-400/20 flex items-center justify-center shrink-0">
                                <CheckCircle className="h-5 w-5 text-green-300" />
                            </div>
                            <div>
                                <p className="text-xs text-green-300 font-bold">Katılan</p>
                                <p className="text-xl font-black">{presentCount}</p>
                            </div>
                        </div>
                        <div className="flex-1 md:flex-none flex items-center gap-4 p-4 bg-red-500/20 backdrop-blur-md rounded-2xl border border-red-400/20 min-w-[120px]">
                            <div className="w-10 h-10 rounded-xl bg-red-400/20 flex items-center justify-center shrink-0">
                                <XCircle className="h-5 w-5 text-red-300" />
                            </div>
                            <div>
                                <p className="text-xs text-red-300 font-bold">Gelmedi</p>
                                <p className="text-xl font-black">{absentCount}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* List Header */}
            <div className="flex justify-between items-center px-2">
                <div>
                    <h4 className="text-lg font-bold text-gray-900">Sporcu Listesi</h4>
                    <p className="text-sm text-gray-500">Katılım durumunu ve performans verilerini güncelleyin.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-50 border-0 font-bold px-8 transition-all hover:scale-[1.03] active:scale-[0.98]"
                >
                    {saving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Kaydediliyor...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Değişiklikleri Kaydet
                        </>
                    )}
                </Button>
            </div>

            {/* Athlete Cards Grid */}
            <div className="grid grid-cols-1 gap-4">
                {athletes.map((athlete: any) => {
                    const status = attendances[athlete.id] || 'YOKTU';
                    const perf = performances[athlete.id] || [];
                    const score = perf.find(p => p.type === 'SCORE')?.value || '';
                    const time = perf.find(p => p.type === 'TIME')?.value || '';
                    const distance = perf.find(p => p.type === 'DISTANCE')?.value || '';

                    return (
                        <Card
                            key={athlete.id}
                            className={cn(
                                "border-0 shadow-sm transition-all duration-300",
                                status === 'YOKTU' ? "opacity-75 bg-gray-50/50" : "bg-white hover:shadow-md hover:ring-1 hover:ring-indigo-100"
                            )}
                        >
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row gap-6 items-center">
                                    {/* Athlete Info */}
                                    <div className="flex items-center gap-4 w-full lg:w-[300px] shrink-0">
                                        <div className="relative">
                                            <Avatar className="h-14 w-14 ring-2 ring-white shadow-md">
                                                <AvatarImage src={athlete.user.avatarUrl ?? undefined} />
                                                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">{athlete.user.firstName?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className={cn(
                                                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm",
                                                status === 'YAPILDI' ? "bg-green-500" : "bg-red-500"
                                            )}>
                                                {status === 'YAPILDI' ? <Check className="h-3 w-3 text-white" /> : <X className="h-3 w-3 text-white" />}
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-gray-900 text-base tracking-tight truncate">
                                                {athlete.user.firstName} {athlete.user.lastName}
                                            </p>
                                            <p className="text-xs text-gray-400 font-medium truncate">@{athlete.user.username}</p>
                                        </div>
                                    </div>

                                    {/* Attendance Toggles */}
                                    <div className="flex items-center justify-center gap-3 w-full lg:w-auto shrink-0 bg-gray-100/50 p-2 rounded-2xl">
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleAttendanceChange(athlete.id, 'YAPILDI')}
                                            className={cn(
                                                "h-10 px-6 rounded-xl font-bold transition-all",
                                                status === 'YAPILDI'
                                                    ? "bg-white text-green-600 shadow-sm"
                                                    : "text-gray-400 hover:text-green-500 hover:bg-white/50"
                                            )}
                                        >
                                            <Check className="h-4 w-4 mr-2" /> Geldi
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleAttendanceChange(athlete.id, 'YOKTU')}
                                            className={cn(
                                                "h-10 px-6 rounded-xl font-bold transition-all",
                                                status === 'YOKTU'
                                                    ? "bg-white text-red-600 shadow-sm"
                                                    : "text-gray-400 hover:text-red-500 hover:bg-white/50"
                                            )}
                                        >
                                            <X className="h-4 w-4 mr-2" /> Gelmedi
                                        </Button>
                                    </div>

                                    {/* Metrics Inputs */}
                                    <div className="flex flex-col sm:flex-row gap-3 w-full flex-1">
                                        <div className="relative flex-1 group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                                <Trophy className="h-4 w-4 text-amber-500" />
                                            </div>
                                            <Input
                                                placeholder="Skor"
                                                className="h-12 pl-10 bg-gray-50/50 border-0 focus-visible:ring-indigo-500 focus-visible:bg-white transition-all font-bold text-gray-700 rounded-xl"
                                                value={score}
                                                onChange={(e) => handleMetricChange(athlete.id, 'SCORE', e.target.value)}
                                                disabled={status === 'YOKTU'}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-600/40 uppercase tracking-widest hidden sm:inline">PTS</span>
                                        </div>
                                        <div className="relative flex-1 group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                                <Timer className="h-4 w-4 text-blue-500" />
                                            </div>
                                            <Input
                                                placeholder="Süre"
                                                className="h-12 pl-10 bg-gray-50/50 border-0 focus-visible:ring-indigo-500 focus-visible:bg-white transition-all font-bold text-gray-700 rounded-xl"
                                                value={time}
                                                onChange={(e) => handleMetricChange(athlete.id, 'TIME', e.target.value)}
                                                disabled={status === 'YOKTU'}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-600/40 uppercase tracking-widest hidden sm:inline">SEC</span>
                                        </div>
                                        <div className="relative flex-1 group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                                <Ruler className="h-4 w-4 text-emerald-500" />
                                            </div>
                                            <Input
                                                placeholder="Mesafe"
                                                className="h-12 pl-10 bg-gray-50/50 border-0 focus-visible:ring-indigo-500 focus-visible:bg-white transition-all font-bold text-gray-700 rounded-xl"
                                                value={distance}
                                                onChange={(e) => handleMetricChange(athlete.id, 'DISTANCE', e.target.value)}
                                                disabled={status === 'YOKTU'}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-600/40 uppercase tracking-widest hidden sm:inline">KM</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Bottom Floating Save Bar for Mobile */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:hidden z-50 animate-in slide-in-from-bottom-8">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl rounded-2xl font-black text-lg tracking-tight border-b-4 border-indigo-800"
                >
                    {saving ? "KAYDEDİLİYOR..." : "TÜMÜNÜ KAYDET"}
                </Button>
            </div>
        </div>
    );
}
