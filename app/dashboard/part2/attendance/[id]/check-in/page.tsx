'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, QrCode } from 'lucide-react';
import { useAttendanceSession, useCheckInToSession } from '@/app/hooks/use-attendance-sessions';
import QRScanner from '@/app/components/QRScanner';
import { useState, useEffect } from 'react';
import { useToast } from '@/app/hooks/use-toast';

export default function CheckInPage() {
  const toast = useToast();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { data: session, isLoading: sessionLoading } = useAttendanceSession(sessionId);
  const checkIn = useCheckInToSession();
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

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
      setTimeout(() => {
        router.push(`/dashboard/part2/attendance/${sessionId}`);
      }, 1500);
    }
  };

  const handleQRScan = async (decodedText: string) => {
    // Extract session ID from URL
    let scannedSessionId: string | null = null;

    try {
      const urlMatch = decodedText.match(/\/attendance\/([^\/]+)\/check-in/);
      if (urlMatch) {
        scannedSessionId = urlMatch[1];
      } else {
        scannedSessionId = decodedText.trim();
      }
    } catch (e) {
      console.error('Error parsing QR code:', e);
      toast.error('QR kod okunamadı. Lütfen geçerli bir QR kod tarayın.');
      return;
    }

    if (!scannedSessionId) {
      toast.error('QR kodda oturum bilgisi bulunamadı.');
      return;
    }

    if (scannedSessionId === sessionId) {
      await handleCheckIn();
    } else {
      router.push(`/check-in/attendance/${scannedSessionId}`);
    }
  };

  if (sessionLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12 text-red-600">Oturum bulunamadı</div>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/part2/attendance')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Yoklamalara Dön
          </Button>
        </div>
      </div>
    );
  }

  const hasQRCode = !!session.qrCodeToken;
  const isQRCodeExpired = session.qrCodeExpiresAt
    ? new Date(session.qrCodeExpiresAt) < new Date()
    : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/part2/attendance/${sessionId}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>

        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
          <CardHeader>
            <CardTitle className="text-2xl">QR Kod ile Giriş</CardTitle>
            <CardDescription>
              {session.title} oturumuna giriş yapın
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(isCheckingIn || checkIn.isPending) ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-lg font-medium text-gray-800 mb-2">Giriş yapılıyor...</p>
                <p className="text-sm text-gray-600">Katılımınız kaydediliyor.</p>
              </div>
            ) : checkIn.isSuccess || hasCheckedIn ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
                <p className="text-lg font-medium text-gray-800 mb-2">Başarıyla Giriş Yapıldı!</p>
                <p className="text-sm text-gray-600 mb-4">Oturuma katılımınız kaydedildi.</p>
                <Button
                  onClick={() => router.push(`/dashboard/part2/attendance/${sessionId}`)}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                >
                  Oturum Detaylarına Git
                </Button>
              </div>
            ) : !hasQRCode ? (
              <div className="text-center py-8">
                <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-800 mb-2">QR Kod Henüz Oluşturulmadı</p>
                <p className="text-sm text-gray-600 mb-6">
                  Bu oturum için QR kod henüz oluşturulmamış.
                </p>
                <Button
                  onClick={() => router.push(`/dashboard/part2/attendance/${sessionId}`)}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Oturum Detaylarına Git
                </Button>
              </div>
            ) : isQRCodeExpired ? (
              <div className="text-center py-8">
                <QrCode className="h-16 w-16 mx-auto mb-4 text-red-400" />
                <p className="text-lg font-medium text-gray-800 mb-2">QR Kod Süresi Dolmuş</p>
                <p className="text-sm text-gray-600 mb-6">
                  Bu oturum için QR kodun süresi dolmuş.
                </p>
                <Button
                  onClick={() => router.push(`/dashboard/part2/attendance/${sessionId}`)}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Oturum Detaylarına Git
                </Button>
              </div>
            ) : (
              <>
                {/* Manual Check-in Button */}
                <div className="text-center py-4 border-b border-gray-200">
                  <Button
                    onClick={handleCheckIn}
                    disabled={isCheckingIn || checkIn.isPending}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/50 w-full mb-4"
                  >
                    {isCheckingIn || checkIn.isPending ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Giriş Yapılıyor...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Oturuma Giriş Yap
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500">
                    Veya QR kod tarayarak giriş yapabilirsiniz
                  </p>
                </div>

                {/* QR Scanner */}
                <div className="border-t border-gray-200 pt-6">
                  <QRScanner
                    onScan={handleQRScan}
                    buttonText="QR Kod Tarayıcıyı Başlat"
                    buttonClassName="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                  />
                </div>

                {checkIn.isError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
                    {checkIn.error?.message || 'Giriş yapılırken bir hata oluştu'}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
