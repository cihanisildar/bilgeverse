'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, QrCode, Users, Calendar, CheckCircle2, Copy } from 'lucide-react';
import { useAttendanceSession, useCheckInToSession } from '@/app/hooks/use-attendance-sessions';
import QRScanner from '@/app/components/QRScanner';
import { useState, useEffect } from 'react';
import QRCodeLib from 'qrcode';
import toast from 'react-hot-toast';

export default function AttendanceSessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const { user, loading: authLoading, isAdmin, isTutor } = useAuth();
  const { data: session, isLoading: sessionLoading } = useAttendanceSession(sessionId);
  const checkIn = useCheckInToSession();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  const canManage = isAdmin || isTutor;

  // Generate QR code when session has token
  useEffect(() => {
    if (session?.qrCodeToken) {
      const checkInUrl = `${window.location.origin}/dashboard/part2/attendance/${session.id}/check-in`;
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
    const urlMatch = decodedText.match(/\/attendance\/([^\/]+)\/check-in/);
    if (urlMatch && urlMatch[1] === sessionId) {
      await handleCheckIn();
    } else {
      toast.error('Geçersiz QR kod. Lütfen bu oturuma ait QR kodu tarayın.');
    }
  };

  const copyCheckInLink = () => {
    const checkInUrl = `${window.location.origin}/dashboard/part2/attendance/${session?.id}/check-in`;
    navigator.clipboard.writeText(checkInUrl);
    toast.success('Giriş linki kopyalandı!');
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Card */}
          {session.qrCodeToken && (
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
              <CardHeader>
                <CardTitle className="text-xl">QR Kod ile Giriş</CardTitle>
                <CardDescription>
                  {isExpired ? 'QR kod süresi dolmuş' : 'QR kodu tarayarak veya manuel giriş yapabilirsiniz'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isExpired && qrCodeDataUrl && canManage && (
                  <div className="text-center">
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code"
                      className="mx-auto rounded-lg shadow-md"
                    />
                    <Button
                      onClick={copyCheckInLink}
                      variant="outline"
                      className="mt-4 w-full"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Giriş Linkini Kopyala
                    </Button>
                  </div>
                )}

                {!canManage && (
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
                )}
              </CardContent>
            </Card>
          )}

          {/* Attendees Card */}
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
        </div>
      </div>
    </div>
  );
}
