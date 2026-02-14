'use client';

import React, { useState } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval,
    isToday,
    parseISO
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Trophy, Dumbbell, Calendar as CalendarIcon, Clock, MapPin, ExternalLink, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface Training {
    id: string;
    title: string;
    description: string | null;
    date: string | Date;
    startTime: string | null;
    endTime: string | null;
    location: string | null;
    type: 'TRAINING' | 'MATCH';
    branch: { name: string };
    _count: { attendances: number };
}

interface TrainingCalendarProps {
    trainings: Training[];
    onSelectSession: (id: string) => void;
}

export default function TrainingCalendar({ trainings, onSelectSession }: TrainingCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
    const [selectedDayTrainings, setSelectedDayTrainings] = useState<{ day: Date, items: Training[] } | null>(null);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: tr })}
                </h3>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())} className="h-8">
                        Bugün
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
        return (
            <div className="grid grid-cols-7 mb-2">
                {days.map((day, i) => (
                    <div key={i} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider py-2">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const days = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <div className="grid grid-cols-7 border-t border-l border-gray-100 rounded-xl overflow-hidden shadow-sm">
                {days.map((day, i) => {
                    const dayTrainings = trainings.filter(t => {
                        const tDate = typeof t.date === 'string' ? parseISO(t.date) : t.date;
                        return isSameDay(tDate, day);
                    });

                    const visibleTrainings = dayTrainings.slice(0, 2);
                    const remainingCount = dayTrainings.length - 2;

                    return (
                        <div
                            key={i}
                            onClick={() => dayTrainings.length > 0 && setSelectedDayTrainings({ day, items: dayTrainings })}
                            className={cn(
                                "min-h-[120px] p-2 border-r border-b border-gray-100 bg-white transition-colors cursor-pointer",
                                !isSameMonth(day, monthStart) && "bg-gray-50/50",
                                isToday(day) && "bg-indigo-50/30",
                                "hover:bg-gray-50"
                            )}
                        >
                            <div className="flex justify-between items-start mb-1 pointer-events-none">
                                <span className={cn(
                                    "text-sm font-semibold h-7 w-7 flex items-center justify-center rounded-full",
                                    isToday(day) ? "bg-indigo-600 text-white" : "text-gray-700",
                                    !isSameMonth(day, monthStart) && "text-gray-300"
                                )}>
                                    {format(day, 'd')}
                                </span>
                                {remainingCount > 0 && (
                                    <div className="text-[10px] text-indigo-600 font-bold px-1.5 py-0.5 bg-indigo-50 rounded-md">
                                        + {remainingCount} daha
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                {visibleTrainings.map((training) => (
                                    <div
                                        key={training.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedTraining(training);
                                        }}
                                        className={cn(
                                            "p-1.5 rounded-lg text-[10px] cursor-pointer transition-all hover:scale-[1.02] border shadow-sm",
                                            training.type === 'MATCH'
                                                ? "bg-amber-50 border-amber-100 text-amber-800 hover:bg-amber-100"
                                                : "bg-indigo-50 border-indigo-100 text-indigo-800 hover:bg-indigo-100"
                                        )}
                                    >
                                        <div className="flex items-center gap-1 font-bold truncate">
                                            {training.type === 'MATCH' ? <Trophy className="h-3 w-3" /> : <Dumbbell className="h-3 w-3" />}
                                            {training.startTime}
                                        </div>
                                        <div className="truncate font-medium mt-0.5 opacity-90">{training.title}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-white p-2">
            {renderHeader()}
            {renderDays()}
            {renderCells()}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                    <span>Antrenman</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span>Müsabaka</span>
                </div>
                <div className="flex items-center gap-1.5 border-l pl-4">
                    <span className="font-bold text-gray-700">Not:</span>
                    <span>Tüm program için güne, detaylar için kutucuğa tıklayın.</span>
                </div>
            </div>

            {/* Daily Program Dialog */}
            <Dialog open={!!selectedDayTrainings} onOpenChange={() => setSelectedDayTrainings(null)}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-indigo-600" />
                            {selectedDayTrainings && format(selectedDayTrainings.day, 'd MMMM yyyy, EEEE', { locale: tr })}
                        </DialogTitle>
                        <DialogDescription>Bugün için planlanmış tüm oturumlar.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto pr-2">
                        {selectedDayTrainings?.items.map((training) => (
                            <div
                                key={training.id}
                                onClick={() => {
                                    setSelectedTraining(training);
                                    setSelectedDayTrainings(null);
                                }}
                                className={cn(
                                    "p-3 rounded-xl cursor-pointer border hover:shadow-md transition-all flex justify-between items-center group",
                                    training.type === 'MATCH' ? "bg-amber-50/50 border-amber-100" : "bg-indigo-50/50 border-indigo-100"
                                )}
                            >
                                <div className="flex gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                        training.type === 'MATCH' ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"
                                    )}>
                                        {training.type === 'MATCH' ? <Trophy className="h-5 w-5" /> : <Dumbbell className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{training.title}</p>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                            <Clock className="h-3 w-3" /> {training.startTime} - {training.endTime}
                                            <span className="mx-1">•</span>
                                            {training.branch.name}
                                        </p>
                                    </div>
                                </div>
                                <Info className="h-4 w-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Session Details Dialog */}
            <Dialog open={!!selectedTraining} onOpenChange={() => setSelectedTraining(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    {selectedTraining && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className={cn(
                                        "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                        selectedTraining.type === 'MATCH' ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-indigo-100 text-indigo-700 border-indigo-200"
                                    )}>
                                        {selectedTraining.type === 'MATCH' ? 'MÜSABAKA' : 'ANTRENMAN'}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] font-bold">
                                        {selectedTraining.branch.name}
                                    </Badge>
                                </div>
                                <DialogTitle className="text-2xl font-bold text-gray-900">
                                    {selectedTraining.title}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                        <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-tight">Tarih</p>
                                            <p className="text-sm font-bold text-gray-700">
                                                {format(typeof selectedTraining.date === 'string' ? parseISO(selectedTraining.date) : selectedTraining.date, 'dd MMMM yyyy', { locale: tr })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                        <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-tight">Saat</p>
                                            <p className="text-sm font-bold text-gray-700">{selectedTraining.startTime} - {selectedTraining.endTime}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-tight">Konum</p>
                                        <p className="text-sm font-bold text-gray-700">{selectedTraining.location}</p>
                                    </div>
                                </div>

                                {selectedTraining.description && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-tight pl-1">Açıklama</p>
                                        <div className="p-4 bg-indigo-50/30 rounded-xl border border-indigo-100 text-gray-700 text-sm leading-relaxed">
                                            {selectedTraining.description || 'Açıklama bulunmuyor.'}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between items-center p-3 border rounded-xl bg-white shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="text-sm font-semibold text-gray-600">Yoklama Bilgisi</span>
                                    </div>
                                    <span className="text-sm font-bold text-indigo-600">
                                        {selectedTraining._count.attendances > 0 ? `${selectedTraining._count.attendances} Sporcu Katıldı` : 'Henüz Girilmedi'}
                                    </span>
                                </div>
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button variant="ghost" onClick={() => setSelectedTraining(null)} className="flex-1 sm:flex-none">Kapat</Button>
                                <Button
                                    onClick={() => {
                                        onSelectSession(selectedTraining.id);
                                        setSelectedTraining(null);
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1 sm:flex-none"
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Yoklama Sayfasına Git
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
