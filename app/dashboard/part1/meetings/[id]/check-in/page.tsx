'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useCheckIn } from '@/app/hooks/use-attendance';
import { useMeeting } from '@/app/hooks/use-meetings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, QrCode, Camera } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function CheckInPage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = params.id as string;
  const { user, loading: authLoading, isAdmin, isTutor } = useAuth();
  const { data: meeting, isLoading: meetingLoading } = useMeeting(meetingId);
  const checkIn = useCheckIn();
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      const callbackUrl = `/dashboard/part1/meetings/${meetingId}/check-in`;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [user, authLoading, meetingId, router]);

  // Note: Auto check-in removed - users should manually check in via button or QR scanner
  // This allows guests (students, tutors) to see the page and choose when to check in
  // QR code generation removed - users already arrived via QR code, no need to show it again

  const handleCheckIn = async () => {
    if (!user) {
      const callbackUrl = `/dashboard/part1/meetings/${meetingId}/check-in`;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    try {
      setError(null);
      const result = await checkIn.mutateAsync({ meetingId });

      if (result.error) {
        setError(result.error);
        setIsCheckingIn(false);
      } else {
        setHasCheckedIn(true);
        setIsCheckingIn(false);
        // Small delay to show success message before redirect
        setTimeout(() => {
          // All users can view meeting details after check-in
          router.push(`/dashboard/part1/meetings/${meetingId}`);
        }, 1000);
      }
    } catch (err) {
      setError('Giriş yapılırken bir hata oluştu');
      setIsCheckingIn(false);
    }
  };

  const startScanner = async () => {
    try {
      // Set scanner active first to render the element
      setScannerActive(true);
      setError(null);

      // Wait for the element to be in the DOM
      await new Promise<void>((resolve) => {
        const checkElement = () => {
          const element = document.getElementById('qr-reader');
          if (element) {
            resolve();
          } else {
            setTimeout(checkElement, 50);
          }
        };
        checkElement();
      });

      // Small delay to ensure element is fully rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      const scanner = new Html5Qrcode('qr-reader');
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          console.log('QR Code scanned:', decodedText);

          let scannedMeetingId: string | null = null;

          // Extract meeting ID from URL
          try {
            // Parse URL to get meeting ID
            const urlMatch = decodedText.match(/\/meetings\/([^\/]+)\/check-in/);
            if (urlMatch) {
              scannedMeetingId = urlMatch[1];
            } else {
              // If it's just a meeting ID
              scannedMeetingId = decodedText.trim();
            }
          } catch (e) {
            console.error('Error parsing QR code:', e);
            setError('QR kod okunamadı. Lütfen geçerli bir QR kod tarayın.');
            return;
          }

          if (!scannedMeetingId) {
            setError('QR kodda toplantı bilgisi bulunamadı. Lütfen geçerli bir QR kod tarayın.');
            return;
          }

          // If scanned meeting ID matches current meeting, proceed with check-in
          if (scannedMeetingId === meetingId) {
            console.log('Scanned meeting ID matches, proceeding with check-in');
            scanner.stop().catch(console.error);
            setScannerActive(false);
            setIsCheckingIn(true);
            setError(null);
            handleCheckIn();
          } else {
            // Redirect to the scanned meeting's check-in page
            scanner.stop().catch(console.error);
            setScannerActive(false);
            router.push(`/check-in/meeting/${scannedMeetingId}`);
          }
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent during scanning)
          console.debug('Scanning...', errorMessage);
        }
      );
      scannerRef.current = scanner;
    } catch (err) {
      setError('Kamera erişimi başarısız oldu. Lütfen kamera izinlerini kontrol edin.');
      console.error('Scanner error:', err);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current = null;
        setScannerActive(false);
      });
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
      }
    };
  }, []);

  // Show loading state while meeting is being fetched
  if (meetingLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if meeting not found after loading
  if (!meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12 text-red-600">Toplantı bulunamadı</div>
          <Button
            variant="outline"
            onClick={() => {
              if (isAdmin) {
                router.push('/dashboard/part1/meetings');
              } else if (isTutor) {
                router.push('/dashboard/part7/tutor');
              } else {
                router.push('/dashboard/part7/student');
              }
            }}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  // Check if QR code is generated
  const hasQRCode = !!meeting.qrCodeToken;
  const isQRCodeExpired = meeting.qrCodeExpiresAt
    ? new Date(meeting.qrCodeExpiresAt) < new Date()
    : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => {
            // All users can access meeting detail page (read-only for non-admins)
            router.push(`/dashboard/part1/meetings/${meetingId}`);
          }}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">QR Kod ile Giriş</CardTitle>
            <CardDescription>
              {meeting.title} toplantısına QR kod ile giriş yapın
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(isCheckingIn || checkIn.isPending) ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-lg font-medium text-gray-800 mb-2">Giriş yapılıyor...</p>
                <p className="text-sm text-gray-600">QR kod doğrulanıyor ve katılımınız kaydediliyor.</p>
              </div>
            ) : checkIn.isSuccess || hasCheckedIn ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
                <p className="text-lg font-medium text-gray-800 mb-2">Başarıyla Giriş Yapıldı!</p>
                <p className="text-sm text-gray-600 mb-4">Toplantıya katılımınız kaydedildi.</p>
                <Button
                  onClick={() => router.push(`/dashboard/part1/meetings/${meetingId}`)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Toplantı Detaylarına Git
                </Button>
              </div>
            ) : !hasQRCode ? (
              <div className="text-center py-8">
                <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-800 mb-2">QR Kod Henüz Oluşturulmadı</p>
                <p className="text-sm text-gray-600 mb-6">
                  Bu toplantı için QR kod henüz oluşturulmamış. Lütfen yöneticiden QR kod oluşturmasını isteyin.
                </p>
                <Button
                  onClick={() => router.push(`/dashboard/part1/meetings/${meetingId}`)}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Toplantı Detaylarına Git
                </Button>
              </div>
            ) : isQRCodeExpired ? (
              <div className="text-center py-8">
                <QrCode className="h-16 w-16 mx-auto mb-4 text-red-400" />
                <p className="text-lg font-medium text-gray-800 mb-2">QR Kod Süresi Dolmuş</p>
                <p className="text-sm text-gray-600 mb-6">
                  Bu toplantı için QR kodun süresi dolmuş. Lütfen yöneticiden yeni bir QR kod oluşturmasını isteyin.
                </p>
                <Button
                  onClick={() => router.push(`/dashboard/part1/meetings/${meetingId}`)}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Toplantı Detaylarına Git
                </Button>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Manual Check-in Button */}
                <div className="text-center py-4 border-b border-gray-200">
                  <Button
                    onClick={handleCheckIn}
                    disabled={isCheckingIn || checkIn.isPending}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/50 w-full mb-4"
                  >
                    {isCheckingIn || checkIn.isPending ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Giriş Yapılıyor...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Toplantıya Giriş Yap
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500">
                    Veya QR kod tarayarak giriş yapabilirsiniz
                  </p>
                </div>

                {/* QR Scanner - Only show if user wants to scan another QR code */}
                {!scannerActive ? (
                  <div className="text-center py-4 border-t border-gray-200 pt-6">
                    <QrCode className="h-12 w-12 mx-auto mb-3 text-indigo-600" />
                    <p className="text-sm font-medium text-gray-700 mb-2">Başka bir QR kod taramak istiyor musunuz?</p>
                    <p className="text-xs text-gray-500 mb-4">
                      Farklı bir toplantıya katılmak için QR kod tarayıcıyı kullanabilirsiniz
                    </p>
                    <Button
                      onClick={startScanner}
                      variant="outline"
                      className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      QR Kod Tarayıcıyı Başlat
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 border-t border-gray-200 pt-6">
                    <p className="text-sm font-medium text-gray-700 text-center mb-2">QR Kod Tarayıcı</p>
                    <div id="qr-reader" className="w-full min-h-[300px]"></div>
                    <Button
                      onClick={stopScanner}
                      variant="outline"
                      className="w-full"
                    >
                      Taramayı Durdur
                    </Button>
                  </div>
                )}

                {checkIn.isError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
                    {checkIn.error?.message || error || 'Giriş yapılırken bir hata oluştu'}
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

