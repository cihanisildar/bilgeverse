'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useCreateMeeting } from '@/app/hooks/use-meetings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createMeetingSchema } from '@/lib/validations/meetings';
import { CreateMeetingInput } from '@/app/hooks/use-meetings';
import { z } from 'zod';
import { useEffect } from 'react';
import Loading from '@/app/components/Loading';

export default function NewMeetingPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const createMeeting = useCreateMeeting();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createMeetingSchema),
  });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/dashboard/part1/meetings');
    }
  }, [loading, user, isAdmin, router]);

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!user || !isAdmin) {
    return null;
  }

  const onSubmit = async (data: z.infer<typeof createMeetingSchema>) => {
    // Convert form data to plain object to ensure serialization
    // Extract only the fields we need and ensure they are plain values
    const plainData: CreateMeetingInput = {
      title: data.title as string,
      meetingDate: data.meetingDate as string,
      description: (data.description || undefined) as string | undefined,
      location: (data.location || undefined) as string | undefined,
    };

    const result = await createMeeting.mutateAsync(plainData);
    if (!result.error) {
      router.push(`/dashboard/part1/meetings/${result.data?.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/part1/meetings')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Yeni Toplantı Oluştur</CardTitle>
            <CardDescription>Yönetim kurulu toplantısı için yeni bir kayıt oluşturun</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="title">Başlık *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="Toplantı başlığı"
                  className="mt-1"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">{errors.title.message as string}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Toplantı açıklaması (opsiyonel)"
                  rows={4}
                  className="mt-1"
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">{errors.description.message as string}</p>
                )}
              </div>

              <div>
                <Label htmlFor="meetingDate">Tarih ve Saat *</Label>
                <Input
                  id="meetingDate"
                  type="datetime-local"
                  {...register('meetingDate')}
                  className="mt-1"
                />
                {errors.meetingDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.meetingDate.message as string}</p>
                )}
              </div>

              <div>
                <Label htmlFor="location">Konum</Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="Toplantı konumu (opsiyonel)"
                  className="mt-1"
                />
                {errors.location && (
                  <p className="text-sm text-red-600 mt-1">{errors.location.message as string}</p>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/part1/meetings')}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={createMeeting.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {createMeeting.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

