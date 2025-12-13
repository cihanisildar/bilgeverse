'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import { useCreateAttendanceSession } from '@/app/hooks/use-attendance-sessions';
import { useState } from 'react';

export default function NewAttendanceSessionPage() {
  const router = useRouter();
  const createSession = useCreateAttendanceSession();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sessionDate: '',
    generateQR: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await createSession.mutateAsync({
      ...formData,
      sessionDate: new Date(formData.sessionDate),
    });

    if (!result.error) {
      router.push('/dashboard/part2/attendance');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
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

              <div className="space-y-2">
                <Label htmlFor="sessionDate">Oturum Tarihi ve Saati *</Label>
                <Input
                  id="sessionDate"
                  type="datetime-local"
                  value={formData.sessionDate}
                  onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                  required
                />
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
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={createSession.isPending}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                >
                  {createSession.isPending ? (
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
