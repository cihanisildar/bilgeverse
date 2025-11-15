'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useMeetings, useDeleteMeeting } from '@/app/hooks/use-meetings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, MapPin, Users, FileText, Trash2, Edit2, ArrowRight, LayoutDashboard } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MeetingStatus } from '@prisma/client';
import Loading from '@/app/components/Loading';

const statusColors: Record<MeetingStatus, string> = {
  PLANNED: 'bg-blue-50 text-blue-700 border-blue-200',
  ONGOING: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED: 'bg-slate-50 text-slate-700 border-slate-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const statusLabels: Record<MeetingStatus, string> = {
  PLANNED: 'Planlandı',
  ONGOING: 'Devam Ediyor',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
};

export default function MeetingsPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { data: meetings, isLoading, error } = useMeetings();
  const deleteMeeting = useDeleteMeeting();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);

  // Reset dialog state when it closes
  useEffect(() => {
    if (!deleteDialogOpen) {
      setSelectedMeetingId(null);
    }
  }, [deleteDialogOpen]);

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-red-600">Hata: {error.message}</div>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    if (!selectedMeetingId) return;
    
    // Ensure we pass a plain string
    const meetingId = String(selectedMeetingId);
    
    // Use mutate instead of mutateAsync to avoid serialization issues
    deleteMeeting.mutate(meetingId, {
      onSuccess: (result) => {
        // Only close dialog if deletion was successful (no error)
        if (result && !result.error) {
          setDeleteDialogOpen(false);
          setSelectedMeetingId(null);
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  Toplantılar
                </span>
              </h1>
              <p className="text-gray-600">Yönetim kurulu toplantılarını görüntüleyin ve yönetin</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/part1')}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              {isAdmin && (
                <Button
                  onClick={() => router.push('/dashboard/part1/meetings/new')}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/50 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/60"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Toplantı
                </Button>
              )}
            </div>
          </div>
        </div>

        {!meetings || meetings.length === 0 ? (
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="text-center py-16 px-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-6">
                <Calendar className="h-10 w-10 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Henüz toplantı yok</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                İlk toplantıyı oluşturmak için yukarıdaki butona tıklayın ve toplantılarınızı yönetmeye başlayın.
              </p>
              {isAdmin && (
                <Button
                  onClick={() => router.push('/dashboard/part1/meetings/new')}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Toplantıyı Oluştur
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meetings.map((meeting) => (
              <Card
                key={meeting.id}
                className="group border-0 shadow-md rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer bg-white"
                onClick={() => router.push(`/dashboard/part1/meetings/${meeting.id}`)}
              >
                <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2 flex-1">
                      {meeting.title}
                    </CardTitle>
                    <Badge className={`${statusColors[meeting.status]} border shrink-0`}>
                      {statusLabels[meeting.status]}
                    </Badge>
                  </div>
                  {meeting.description && (
                    <CardDescription className="line-clamp-2 text-gray-600">
                      {meeting.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center text-sm text-gray-700 bg-gray-50 rounded-lg p-2.5">
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 text-indigo-600 mr-3">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <span className="font-medium">
                        {format(new Date(meeting.meetingDate), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700 bg-gray-50 rounded-lg p-2.5">
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-purple-100 text-purple-600 mr-3">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{meeting.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-700">
                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-emerald-100 text-emerald-600 mr-2">
                          <Users className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{meeting._count?.attendees || 0} katılımcı</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-100 text-blue-600 mr-2">
                          <FileText className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{meeting._count?.decisions || 0} karar</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/part1/meetings/${meeting.id}`);
                      }}
                      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-medium"
                    >
                      Detaylar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    {isAdmin && (
                      <div className="flex space-x-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/part1/meetings/${meeting.id}/edit`);
                          }}
                          className="border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMeetingId(meeting.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Toplantıyı Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu toplantıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm katılım kayıtları ve kararlar silinecektir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                disabled={deleteMeeting.isPending}
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setSelectedMeetingId(null);
                }}
              >
                İptal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteMeeting.isPending}
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteMeeting.isPending ? 'Siliniyor...' : 'Sil'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

