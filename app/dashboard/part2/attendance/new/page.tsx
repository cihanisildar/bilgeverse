'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { createAttendanceSession } from '@/app/actions/attendance-sessions';
import { useState, useMemo } from 'react';
import { useToast } from '@/app/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

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
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
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

export default function NewAttendanceSessionPage() {
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState<{ start: Date; end: Date } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    generateQR: true,
  });

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

    // Auto-generate title
    const weekNum = getWeekNumber(week.start);
    const monthName = week.start.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    setFormData(prev => ({
      ...prev,
      title: `Hafta ${weekNum} - ${monthName}`
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWeek) {
      toast.error('Lütfen bir hafta seçin');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createAttendanceSession({
        title: formData.title,
        description: formData.description,
        sessionDate: selectedWeek.start.toISOString(),
        generateQR: formData.generateQR,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Oturum başarıyla oluşturuldu');
        // Invalidate the sessions cache to refresh the list
        queryClient.invalidateQueries({ queryKey: ['attendanceSessions'] });
        router.push('/dashboard/part2/attendance');
      }
    } catch (error) {
      toast.error('Oturum oluşturulurken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/part2/attendance')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>

        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
          <CardHeader>
            <CardTitle className="text-2xl">Yeni Yoklama Oturumu Oluştur</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Başlık *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Örn: Hafta 1 - Ocak 2025"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Oturum hakkında ek bilgiler..."
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generateQR"
                  checked={formData.generateQR}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, generateQR: checked as boolean })
                  }
                />
                <Label
                  htmlFor="generateQR"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  QR kod oluştur (öğrenciler QR kod ile giriş yapabilsin)
                </Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/part2/attendance')}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedWeek}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Oluşturuluyor...
                    </>
                  ) : (
                    'Yoklama Oluştur'
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
