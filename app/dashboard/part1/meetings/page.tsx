'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useMeetings, useDeleteMeeting } from '@/app/hooks/use-meetings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, MapPin, Users, FileText, Trash2, Edit2, ArrowRight, ArrowLeft, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MeetingStatus>('ALL');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  const filteredMeetings = meetings?.filter((meeting) => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || meeting.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  })?.sort((a, b) => {
    const dateA = new Date(a.meetingDate).getTime();
    const dateB = new Date(b.meetingDate).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/part1')}
                className="mt-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Geri
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    Toplantılar
                  </span>
                </h1>
                <p className="text-gray-600">Yönetim kurulu toplantılarını görüntüleyin ve yönetin</p>
              </div>
            </div>
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

        {/* Filter Section */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Toplantı ara (başlık, açıklama, konum)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl px-4"
            >
              {sortOrder === 'asc' ? (
                <>
                  <ArrowUp className="h-4 w-4 mr-2 text-indigo-600" />
                  Eskiden Yeniye
                </>
              ) : (
                <>
                  <ArrowDown className="h-4 w-4 mr-2 text-indigo-600" />
                  Yeniden Eskiye
                </>
              )}
            </Button>
          </div>

          <Tabs defaultValue="ALL" onValueChange={(v) => setStatusFilter(v as any)} className="w-full">
            <TabsList className="bg-white/50 border border-gray-100 p-1 rounded-xl h-auto flex flex-wrap">
              <TabsTrigger value="ALL" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Tümü</TabsTrigger>
              <TabsTrigger value="PLANNED" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Planlandı</TabsTrigger>
              <TabsTrigger value="ONGOING" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Devam Ediyor</TabsTrigger>
              <TabsTrigger value="COMPLETED" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Tamamlandı</TabsTrigger>
              <TabsTrigger value="CANCELLED" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">İptal Edildi</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {!filteredMeetings || filteredMeetings.length === 0 ? (
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="text-center py-16 px-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-6">
                <Calendar className="h-10 w-10 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {searchQuery || statusFilter !== 'ALL' ? 'Eşleşen toplantı bulunamadı' : 'Henüz toplantı yok'}
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Filtrelerinizi değiştirerek tekrar deneyebilirsiniz.' 
                  : 'İlk toplantıyı oluşturmak için yukarıdaki butona tıklayın ve toplantılarınızı yönetmeye başlayın.'}
              </p>
              {isAdmin && !searchQuery && statusFilter === 'ALL' && (
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
            {filteredMeetings.map((meeting) => (
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

