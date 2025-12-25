'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, QrCode, Users, Calendar, CheckCircle2, Copy, Pencil, Trash, AlertTriangle } from 'lucide-react';
import { useAttendanceSession, useCheckInToSession } from '@/app/hooks/use-attendance-sessions';
import { deleteAttendanceSession } from '@/app/actions/attendance-sessions';
import QRScanner from '@/app/components/QRScanner';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import QRCodeLib from 'qrcode';
import { useToast } from '@/app/hooks/use-toast';
import StudentAttendanceList from './StudentAttendanceList';

export default function AttendanceSessionDetailPage() {
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const queryClient = useQueryClient();
  const { user, loading: authLoading, isAdmin, isTutor } = useAuth();
  const { data: session, isLoading: sessionLoading } = useAttendanceSession(sessionId);
  const checkIn = useCheckInToSession();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const canManage = isAdmin || isTutor;

  // Generate QR code when session has token
  useEffect(() => {
    if (session?.qrCodeToken) {
      const checkInUrl = `${window.location.origin}/check-in/attendance/${session.id}`;
      QRCodeLib.toDataURL(checkInUrl, { width: 300 })
        .then(setQrCodeDataUrl)
        .catch(console.error);
    }
  }, [session]);

  // Check if user has already checked in
  useEffect(() => {
    if (session && user) {
      const userAttendance = session.attendances?.find((a: any) => a.studentId === user.id);
      setHasCheckedIn(!!userAttendance);
    }
  }, [session, user]);

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    const result = await checkIn.mutateAsync(sessionId);
    setIsCheckingIn(false);
    if (!result.error) {
      setHasCheckedIn(true);
    }
  };

  const handleQRScan = async (decodedText: string) => {
    // Extract session ID from URL
    const urlMatch = decodedText.match(/\/check-in\/attendance\/([^\/\?]+)/);
    if (urlMatch && urlMatch[1] === sessionId) {
      await handleCheckIn();
    } else {
      toast.error('Geçersiz QR kod. Lütfen bu oturuma ait QR kodu tarayın.');
    }
  };

  const copyCheckInLink = () => {
    const checkInUrl = `${window.location.origin}/check-in/attendance/${session?.id}`;
    navigator.clipboard.writeText(checkInUrl);
    toast.success('Giriş linki kopyalandı!');
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setShowDeleteDialog(false);

    try {
      // Call server action directly to avoid serialization issues
      const result = await deleteAttendanceSession(sessionId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Yoklama oturumu başarıyla silindi');
        // Manually invalidate queries
        queryClient.invalidateQueries({ queryKey: ['attendanceSessions'] });
        router.push('/dashboard/part2/attendance');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Oturum silinirken bir hata oluştu');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    return null;
  }

  const isExpired = !!(session.qrCodeExpiresAt && new Date(session.qrCodeExpiresAt) < new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/part2/attendance')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Yoklamalara Dön
        </Button>

        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {session.title}
              </h1>
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDate(session.sessionDate)}
              </div>
              {session.description && (
                <p className="text-gray-600 mt-2">{session.description}</p>
              )}
            </div>
            {canManage && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/part2/attendance/${sessionId}/edit`)}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  disabled={isDeleting}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Düzenle
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDeleteClick}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  disabled={isDeleting}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Siliniyor...' : 'Sil'}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Card */}
          {session.qrCodeToken && (
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-blue-600" />
                  QR Kod ile Giriş
                </CardTitle>
                <CardDescription>
                  {isExpired
                    ? 'QR kod süresi bu hafta sonunda doldu'
                    : 'Öğrenciler bu QR kodu tarayarak hafta boyunca giriş yapabilir'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isExpired && qrCodeDataUrl && canManage ? (
                  <div className="space-y-4">
                    {/* QR Code Display */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl">
                      <div className="bg-white p-4 rounded-lg shadow-md inline-block mx-auto w-full max-w-[300px]">
                        <img
                          src={qrCodeDataUrl}
                          alt="QR Code"
                          className="w-full h-auto"
                        />
                      </div>
                    </div>

                    {/* QR Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <QrCode className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900 mb-1">
                            QR Kod Aktif
                          </p>
                          <p className="text-xs text-blue-700">
                            Bu QR kod {new Date(session.qrCodeExpiresAt!).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit'
                            })} tarihine kadar geçerlidir
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Copy Link Button */}
                    <Button
                      onClick={copyCheckInLink}
                      variant="outline"
                      className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Giriş Linkini Kopyala
                    </Button>
                  </div>
                ) : isExpired && canManage ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
                      <AlertTriangle className="h-8 w-8 text-orange-600" />
                    </div>
                    <p className="text-lg font-medium text-gray-800 mb-2">QR Kod Süresi Doldu</p>
                    <p className="text-sm text-gray-600 mb-4">
                      Bu hafta sonu geçti. Yeni bir hafta için yeni yoklama oluşturabilirsiniz.
                    </p>
                  </div>
                ) : !canManage ? (
                  <>
                    {hasCheckedIn ? (
                      <div className="text-center py-8">
                        <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
                        <p className="text-lg font-medium text-gray-800 mb-2">Giriş Yapıldı!</p>
                        <p className="text-sm text-gray-600">Bu oturuma başarıyla giriş yaptınız.</p>
                      </div>
                    ) : isCheckingIn ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-lg font-medium text-gray-800 mb-2">Giriş yapılıyor...</p>
                      </div>
                    ) : (
                      <>
                        <Button
                          onClick={handleCheckIn}
                          disabled={isExpired}
                          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Manuel Giriş Yap
                        </Button>

                        {!isExpired && (
                          <>
                            <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-300" />
                              </div>
                              <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-500">veya</span>
                              </div>
                            </div>

                            <QRScanner
                              onScan={handleQRScan}
                              buttonText="QR Kod Tarayarak Giriş Yap"
                              buttonClassName="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                            />
                          </>
                        )}
                      </>
                    )}
                  </>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Student List with Click-to-Mark for Tutors/Admins */}
          {canManage ? (
            <StudentAttendanceList
              sessionId={sessionId}
              attendances={session.attendances || []}
            />
          ) : (
            /* Show simple attendees list for students */
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-cyan-500 to-teal-500"></div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Katılımcılar</CardTitle>
                  <div className="flex items-center text-blue-600">
                    <Users className="h-5 w-5 mr-2" />
                    <span className="font-bold">{session.attendances?.length || 0}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {session.attendances && session.attendances.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {session.attendances.map((attendance: any) => (
                      <div
                        key={attendance.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-800">
                            {attendance.student.firstName} {attendance.student.lastName}
                          </p>
                          <p className="text-sm text-gray-500">@{attendance.student.username}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {formatDate(attendance.checkInTime)}
                          </p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${attendance.checkInMethod === 'QR'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                            }`}>
                            {attendance.checkInMethod === 'QR' ? 'QR Kod' : 'Manuel'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Henüz katılımcı yok</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle className="text-xl">Yoklama Oturumunu Sil</DialogTitle>
            </div>
            <DialogDescription className="text-base pt-2">
              Bu yoklama oturumunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm katılım kayıtları kalıcı olarak silinecektir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash className="h-4 w-4 mr-2" />
              Evet, Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
