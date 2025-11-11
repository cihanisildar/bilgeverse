'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useMeeting, useGenerateQRCode } from '@/app/hooks/use-meetings';
import { useMeetingAttendance, useManualCheckIn } from '@/app/hooks/use-attendance';
import { Button } from '@/components/ui/button';
import { getBaseUrl } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin, Users, FileText, QrCode, UserPlus, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MeetingStatus } from '@prisma/client';
import QRCode from 'qrcode';
import { useQuery } from '@tanstack/react-query';
import { getAllUsers } from '@/app/actions/users';
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

export default function MeetingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = params.id as string;
  const { user, isAdmin } = useAuth();
  const { data: meeting, isLoading } = useMeeting(meetingId);
  const { data: attendance, isLoading: attendanceLoading } = useMeetingAttendance(meetingId);
  const generateQR = useGenerateQRCode();
  const manualCheckIn = useManualCheckIn();
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [manualCheckInDialogOpen, setManualCheckInDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Get all users for manual check-in
  const { data: usersData } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const result = await getAllUsers();
      if (result.error) {
        return [];
      }
      return result.data || [];
    },
    enabled: isAdmin && manualCheckInDialogOpen,
  });

  const handleGenerateQR = async () => {
    const result = await generateQR.mutateAsync(meetingId);
    if (!result.error && result.data) {
      // Create the full URL with token - uses production URL automatically in production
      const baseUrl = getBaseUrl();
      const qrData = `${baseUrl}/dashboard/part1/meetings/${meetingId}/check-in?token=${encodeURIComponent(result.data.token)}`;
      console.log('Generating QR code with data:', qrData);
      const url = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 400,
      });
      setQrImageUrl(url);
      setQrDialogOpen(true);
    }
  };

  const handleManualCheckIn = async () => {
    if (!selectedUserId) return;
    await manualCheckIn.mutateAsync({ meetingId, userId: selectedUserId });
    setManualCheckInDialogOpen(false);
    setSelectedUserId('');
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-red-600">Toplantı bulunamadı</div>
        </div>
      </div>
    );
  }

  const isCheckedIn = attendance?.some((a) => a.user.id === user?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/part1/meetings')}
          className="mb-6 hover:bg-gray-100 text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <CardTitle className="text-3xl font-bold text-gray-800 mb-3">
                      {meeting.title}
                    </CardTitle>
                    <Badge className={`${statusColors[meeting.status]} border text-sm px-3 py-1`}>
                      {statusLabels[meeting.status]}
                    </Badge>
                  </div>
                </div>
                {meeting.description && (
                  <CardDescription className="text-base text-gray-600 mt-3 leading-relaxed">
                    {meeting.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl border border-indigo-100">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500 text-white mr-4 shadow-lg shadow-indigo-500/30">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Tarih & Saat</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {format(new Date(meeting.meetingDate), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-100">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500 text-white mr-4 shadow-lg shadow-purple-500/30">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Konum</p>
                      <p className="text-sm font-semibold text-gray-800">{meeting.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-100">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500 text-white mr-4 shadow-lg shadow-emerald-500/30">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Katılımcı</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {meeting._count?.attendees || 0} kişi
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500 text-white mr-4 shadow-lg shadow-blue-500/30">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Karar</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {meeting._count?.decisions || 0} adet
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance List */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-800">Katılımcılar</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {attendance?.length || 0} kişi katılım sağladı
                    </p>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setManualCheckInDialogOpen(true)}
                      className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Manuel Giriş
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <Loading message="Katılımcılar yükleniyor..." />
                ) : !attendance || attendance.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium mb-1">Henüz katılımcı yok</p>
                    <p className="text-sm text-gray-500">Toplantıya katılım sağlayan kişiler burada görünecek</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attendance.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-semibold shadow-lg">
                            {a.user.firstName?.[0]?.toUpperCase() || a.user.username[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {a.user.firstName && a.user.lastName
                                ? `${a.user.firstName} ${a.user.lastName}`
                                : a.user.username}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(a.checkInTime), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={a.checkInMethod === 'QR' 
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700' 
                            : 'border-blue-200 bg-blue-50 text-blue-700'
                          }
                        >
                          {a.checkInMethod === 'QR' ? 'QR Kod' : 'Manuel'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-gray-800">İşlemler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isCheckedIn && meeting.status !== 'COMPLETED' && meeting.status !== 'CANCELLED' && (
                  <Button
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/50 transition-all duration-200 hover:shadow-xl"
                    onClick={() => router.push(`/dashboard/part1/meetings/${meetingId}/check-in`)}
                    disabled={!meeting.qrCodeToken || (meeting.qrCodeExpiresAt ? new Date(meeting.qrCodeExpiresAt) < new Date() : false)}
                    title={!meeting.qrCodeToken ? 'QR kod henüz oluşturulmadı' : (meeting.qrCodeExpiresAt && new Date(meeting.qrCodeExpiresAt) < new Date() ? 'QR kod süresi dolmuş' : '')}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    QR ile Giriş Yap
                  </Button>
                )}
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
                      onClick={handleGenerateQR}
                      disabled={generateQR.isPending}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      {generateQR.isPending ? 'Oluşturuluyor...' : 'QR Kod Oluştur'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                      onClick={() => router.push(`/dashboard/part1/meetings/${meetingId}/decisions`)}
                    >
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Kararları Görüntüle
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* QR Code Dialog */}
        <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-800">QR Kod</DialogTitle>
              <DialogDescription className="text-gray-600">
                Bu QR kodu katılımcılar tarayarak giriş yapabilir
              </DialogDescription>
            </DialogHeader>
            {qrImageUrl && (
              <div className="flex flex-col items-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                <div className="bg-white p-4 rounded-xl shadow-lg mb-4">
                  <img src={qrImageUrl} alt="QR Code" className="w-64 h-64" />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  QR kodu tarayarak toplantıya katılabilirsiniz
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Manual Check-in Dialog */}
        <Dialog open={manualCheckInDialogOpen} onOpenChange={setManualCheckInDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-800">Manuel Giriş</DialogTitle>
              <DialogDescription className="text-gray-600">
                Kullanıcıyı manuel olarak toplantıya ekleyin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Kullanıcı</label>
                {usersData && usersData.length > 0 ? (
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                  >
                    <option value="">Kullanıcı seçin</option>
                    {usersData.map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName} (${user.username})`
                          : user.username}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    placeholder="Kullanıcı ID"
                    className="mt-1"
                  />
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setManualCheckInDialogOpen(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  İptal
                </Button>
                <Button
                  onClick={handleManualCheckIn}
                  disabled={!selectedUserId || manualCheckIn.isPending}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/50"
                >
                  {manualCheckIn.isPending ? 'Ekleniyor...' : 'Giriş Yap'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

