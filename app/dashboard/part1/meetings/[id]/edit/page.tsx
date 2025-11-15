'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useMeeting, useUpdateMeeting } from '@/app/hooks/use-meetings';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateMeetingSchema } from '@/lib/validations/meetings';
import { useEffect } from 'react';
import Loading from '@/app/components/Loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MeetingStatus } from '@prisma/client';

const statusLabels: Record<MeetingStatus, string> = {
  PLANNED: 'Planlandı',
  ONGOING: 'Devam Ediyor',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
};

export default function EditMeetingPage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = params.id as string;
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { data: meeting, isLoading: meetingLoading } = useMeeting(meetingId);
  const updateMeeting = useUpdateMeeting();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(updateMeetingSchema),
  });

  // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Pre-fill form when meeting data is loaded
  useEffect(() => {
    if (meeting) {
      setValue('title', meeting.title);
      setValue('description', meeting.description || '');
      setValue('meetingDate', formatDateForInput(meeting.meetingDate));
      setValue('location', meeting.location);
      setValue('status', meeting.status);
    }
  }, [meeting, setValue]);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/dashboard/part1/meetings');
    }
  }, [authLoading, user, isAdmin, router]);

  if (authLoading || meetingLoading) {
    return <Loading fullScreen />;
  }

  if (!user || !isAdmin) {
    return null;
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center py-12 text-red-600">Toplantı bulunamadı</div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: any) => {
    // Convert form data to plain object to ensure serialization
    const plainData: {
      title?: string;
      description?: string;
      meetingDate?: string;
      location?: string;
      status?: MeetingStatus;
    } = {};

    if (data.title !== undefined && data.title !== null) {
      plainData.title = String(data.title);
    }
    if (data.description !== undefined && data.description !== null) {
      plainData.description = String(data.description).trim() || null;
    }
    if (data.meetingDate !== undefined && data.meetingDate !== null) {
      plainData.meetingDate = String(data.meetingDate);
    }
    if (data.location !== undefined && data.location !== null) {
      plainData.location = String(data.location);
    }
    if (data.status !== undefined && data.status !== null) {
      plainData.status = data.status as MeetingStatus;
    }

    const result = await updateMeeting.mutateAsync({ id: meetingId, data: plainData });
    if (!result.error) {
      // Refetch the meeting data to ensure fresh data is loaded
      await queryClient.refetchQueries({ queryKey: ['meetings', meetingId] });
      await queryClient.refetchQueries({ queryKey: ['meetings'] });
      // Refresh the router to ensure fresh data
      router.refresh();
      router.push(`/dashboard/part1/meetings/${meetingId}`);
    }
  };

  const statusValue = watch('status');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/part1/meetings/${meetingId}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Toplantıyı Düzenle</CardTitle>
            <CardDescription>Toplantı bilgilerini güncelleyin</CardDescription>
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
                <Label htmlFor="location">Konum *</Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="Toplantı konumu"
                  className="mt-1"
                />
                {errors.location && (
                  <p className="text-sm text-red-600 mt-1">{errors.location.message as string}</p>
                )}
              </div>

              <div>
                <Label htmlFor="status">Durum</Label>
                <Select
                  value={statusValue || meeting.status}
                  onValueChange={(value) => {
                    setValue('status', value as MeetingStatus, { shouldValidate: true });
                  }}
                >
                  <SelectTrigger className="mt-1" id="status">
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNED">{statusLabels.PLANNED}</SelectItem>
                    <SelectItem value="ONGOING">{statusLabels.ONGOING}</SelectItem>
                    <SelectItem value="COMPLETED">{statusLabels.COMPLETED}</SelectItem>
                    <SelectItem value="CANCELLED">{statusLabels.CANCELLED}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-600 mt-1">{errors.status.message as string}</p>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/part1/meetings/${meetingId}`)}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={updateMeeting.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateMeeting.isPending ? 'Güncelleniyor...' : 'Güncelle'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

