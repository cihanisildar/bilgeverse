'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useCheckIn } from '@/app/hooks/use-attendance';
import { useMeeting } from '@/app/hooks/use-meetings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, QrCode, Camera } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import QRCode from 'qrcode';
import { getBaseUrl } from '@/lib/utils';

export default function CheckInPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const meetingId = params.id as string;
  const qrToken = searchParams.get('token');
  const { user } = useAuth();
  const { data: meeting } = useMeeting(meetingId);
  const checkIn = useCheckIn();
  const [scannerActive, setScannerActive] = useState(false);
  const [scannedToken, setScannedToken] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  useEffect(() => {
    // If token is provided in URL, check in directly
    if (qrToken && meeting && !hasCheckedIn && !checkIn.isPending && !checkIn.isSuccess) {
      setIsCheckingIn(true);
      setError(null);
      handleCheckIn(qrToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrToken, meeting, hasCheckedIn]);

  // Generate QR code image when meeting data is available
  useEffect(() => {
    if (meeting?.qrCodeToken && !qrImageUrl) {
      // Uses production URL automatically in production
      const baseUrl = getBaseUrl();
      const qrData = `${baseUrl}/dashboard/part1/meetings/${meetingId}/check-in?token=${encodeURIComponent(meeting.qrCodeToken)}`;
      QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 300,
      })
        .then(setQrImageUrl)
        .catch((err) => {
          console.error('QR Code generation error:', err);
          setError('QR kod oluşturulurken bir hata oluştu');
        });
    }
  }, [meeting, meetingId, qrImageUrl]);

  const handleCheckIn = async (token: string) => {
    if (!token || !token.trim()) {
      setError('Geçersiz token. Lütfen QR kodu tekrar tarayın.');
      setIsCheckingIn(false);
      return;
    }
    
    try {
      console.log('Attempting check-in with token:', token);
      setError(null);
      const result = await checkIn.mutateAsync({ meetingId, qrToken: token.trim() });
      
      if (result.error) {
        setError(result.error);
        setIsCheckingIn(false);
      } else {
        setHasCheckedIn(true);
        setIsCheckingIn(false);
        // Small delay to show success message before redirect
        setTimeout(() => {
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
          
          let token: string | null = null;
          
          // Try to extract token from URL
          try {
            // If it's a full URL, parse it
            if (decodedText.includes('token=')) {
              const url = new URL(decodedText);
              token = url.searchParams.get('token');
            } 
            // If it's a relative URL with query params
            else if (decodedText.includes('/check-in?token=')) {
              const tokenMatch = decodedText.match(/token=([^&]+)/);
              token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
            }
            // If it's just the token
            else {
              token = decodedText.trim();
            }
          } catch (e) {
            // If URL parsing fails, try regex
            const tokenMatch = decodedText.match(/token=([^&]+)/);
            if (tokenMatch) {
              token = decodeURIComponent(tokenMatch[1]);
            } else {
              token = decodedText.trim();
            }
          }
          
          if (!token) {
            setError('QR kodda token bulunamadı. Lütfen geçerli bir QR kod tarayın.');
            return;
          }
          
          console.log('Extracted token:', token);
          setScannedToken(token);
          scanner.stop().catch(console.error);
          setScannerActive(false);
          setIsCheckingIn(true);
          setError(null);
          handleCheckIn(token);
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

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12 text-red-600">Toplantı bulunamadı</div>
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
          onClick={() => router.push(`/dashboard/part1/meetings/${meetingId}`)}
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
                  Toplantı Detaylarına Dön
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
                  Toplantı Detaylarına Dön
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
                  Toplantı Detaylarına Dön
                </Button>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Display QR Code */}
                {qrImageUrl && (
                  <div className="text-center py-6 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Bu QR kodu tarayarak toplantıya giriş yapabilirsiniz
                    </p>
                    <div className="flex justify-center mb-4">
                      <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                        <img 
                          src={qrImageUrl} 
                          alt="QR Code" 
                          className="w-64 h-64 mx-auto"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Veya aşağıdaki butona tıklayarak kameranızı kullanabilirsiniz
                    </p>
                  </div>
                )}

                {!scannerActive ? (
                  <div className="text-center py-8">
                    {!qrImageUrl && (
                      <>
                        <QrCode className="h-16 w-16 mx-auto mb-4 text-indigo-600" />
                        <p className="text-lg font-medium text-gray-800 mb-2">QR Kod Tarayıcı</p>
                        <p className="text-sm text-gray-600 mb-6">
                          QR kodu taramak için kamerayı başlatın
                        </p>
                      </>
                    )}
                    <Button
                      onClick={startScanner}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white w-full"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Kamerayı Başlat
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
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

