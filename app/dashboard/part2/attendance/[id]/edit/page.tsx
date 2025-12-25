'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Save, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { updateAttendanceSession } from '@/app/actions/attendance-sessions';
import { useAttendanceSession } from '@/app/hooks/use-attendance-sessions';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/app/hooks/use-toast';
import { cn } from '@/lib/utils';

// Helper functions for week calculations
function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getWeekDays(date: Date): { start: Date; end: Date } {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
}

function formatDateTR(date: Date): string {
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function EditAttendanceSessionPage() {
    const toast = useToast();
    const router = useRouter();
    const params = useParams();
    const sessionId = params.id as string;
    const queryClient = useQueryClient();
    const { data: session, isLoading: sessionLoading } = useAttendanceSession(sessionId);
    const [isPending, startTransition] = useTransition();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedWeek, setSelectedWeek] = useState<{ start: Date; end: Date } | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
    });

    // Populate form with session data when loaded
    useEffect(() => {
        if (session) {
            setFormData({
                title: session.title || '',
                description: session.description || '',
            });

            // Pre-select the week based on session date
            if (session.sessionDate) {
                const sessionDate = new Date(session.sessionDate);
                const week = getWeekDays(sessionDate);
                setSelectedWeek(week);
                setCurrentMonth(sessionDate); // Set calendar to show the session's month
            }
        }
    }, [session]);

    // Generate calendar data
    const calendarData = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: (Date | null)[] = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < (startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1); i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    }, [currentMonth]);

    const handleWeekSelect = (date: Date) => {
        const week = getWeekDays(date);
        setSelectedWeek(week);

        // Auto-generate title if it's empty or matches the default pattern
        const weekNum = getWeekNumber(week.start);
        const monthName = week.start.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
        const autoTitle = `Hafta ${weekNum} - ${monthName}`;

        // Only auto-update if title is empty or looks like an auto-generated title
        if (!formData.title || formData.title.startsWith('Hafta ')) {
            setFormData(prev => ({ ...prev, title: autoTitle }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title) {
            toast.error('Lütfen başlık alanını doldurun');
            return;
        }

        if (!selectedWeek) {
            toast.error('Lütfen bir hafta seçin');
            return;
        }

        startTransition(async () => {
            try {
                const sessionPayload: any = {
                    title: formData.title,
                    sessionDate: selectedWeek.start,
                };

                // Only include description if not empty
                if (formData.description.trim()) {
                    sessionPayload.description = formData.description.trim();
                }

                const result = await updateAttendanceSession(sessionId, sessionPayload);

                if (result.error) {
                    toast.error(result.error);
                } else if (result.data) {
                    toast.success('Yoklama oturumu başarıyla güncellendi');
                    queryClient.invalidateQueries({ queryKey: ['attendanceSessions'] });
                    queryClient.invalidateQueries({ queryKey: ['attendanceSession', sessionId] });
                    router.push(`/dashboard/part2/attendance/${sessionId}`);
                }
            } catch (error: any) {
                toast.error(error?.message || 'Oturum güncellenirken bir hata oluştu');
            }
        });
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const goToPrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const isDateInSelectedWeek = (date: Date | null): boolean => {
        if (!date || !selectedWeek) return false;
        return date >= selectedWeek.start && date <= selectedWeek.end;
    };

    if (sessionLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
                <div className="text-center">
                    <p className="text-gray-600">Oturum bulunamadı</p>
                    <Link href="/dashboard/part2/attendance">
                        <Button className="mt-4">Yoklamalara Dön</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <Link href={`/dashboard/part2/attendance/${sessionId}`}>
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Oturum Detayına Dön
                    </Button>
                </Link>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
                            Yoklama Oturumunu Düzenle
                        </span>
                    </h1>
                    <p className="text-gray-600">Oturum bilgilerini güncelleyin</p>
                </div>

                <Card className="border-0 shadow-lg rounded-xl">
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    <CardHeader>
                        <CardTitle>Oturum Detayları</CardTitle>
                        <CardDescription>
                            Yoklama oturumu hakkında bilgileri güncelleyin
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title">Oturum Başlığı *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    placeholder="Örn: Hafta 1 - Ocak 2025"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Açıklama</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder="Oturum hakkında detaylı bilgi..."
                                    rows={4}
                                />
                            </div>

                            {/* Weekly Calendar Picker */}
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Hafta Seç *
                                </Label>

                                {selectedWeek && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm font-medium text-blue-900">
                                            Seçilen Hafta: {formatDateTR(selectedWeek.start)} - {formatDateTR(selectedWeek.end)}
                                        </p>
                                    </div>
                                )}

                                <div className="border rounded-lg p-4 bg-white">
                                    {/* Month Navigation */}
                                    <div className="flex items-center justify-between mb-4">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={goToPrevMonth}
                                            className="hover:bg-blue-50"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <h3 className="font-semibold text-gray-900">
                                            {currentMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                                        </h3>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={goToNextMonth}
                                            className="hover:bg-blue-50"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Calendar Grid */}
                                    <div className="grid grid-cols-7 gap-1">
                                        {/* Day headers */}
                                        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                                            <div key={day} className="text-center text-xs font-medium text-gray-600 py-2">
                                                {day}
                                            </div>
                                        ))}

                                        {/* Calendar days */}
                                        {calendarData.map((date, index) => {
                                            const isSelected = isDateInSelectedWeek(date);
                                            const isToday = date && date.toDateString() === new Date().toDateString();

                                            return (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => date && handleWeekSelect(date)}
                                                    disabled={!date}
                                                    className={cn(
                                                        "aspect-square p-2 text-sm rounded-lg transition-all",
                                                        !date && "invisible",
                                                        date && !isSelected && "hover:bg-blue-50 text-gray-700",
                                                        isSelected && "bg-blue-500 text-white font-semibold hover:bg-blue-600",
                                                        isToday && !isSelected && "ring-2 ring-blue-400 ring-offset-1"
                                                    )}
                                                >
                                                    {date?.getDate()}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <p className="text-xs text-gray-500 mt-3 text-center">
                                        Bir tarihe tıklayarak o haftayı seçebilirsiniz
                                    </p>
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => router.back()}
                                    disabled={isPending}
                                >
                                    İptal
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white disabled:opacity-50"
                                    disabled={isPending || !selectedWeek}
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Güncelleniyor...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Değişiklikleri Kaydet
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
