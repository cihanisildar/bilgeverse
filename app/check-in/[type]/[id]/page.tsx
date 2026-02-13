'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, QrCode } from 'lucide-react';
import { useState, useMemo } from 'react';
import QRScanner from '@/app/components/QRScanner';
import { useQueryClient, useQuery } from '@tanstack/react-query';

// Import data fetching hooks and server actions
import { useAttendanceSession } from '@/app/hooks/use-attendance-sessions';
import { useMeeting } from '@/app/hooks/use-meetings';
import { useToast } from '@/app/hooks/use-toast';
import { checkInToPart2Event, getPart2Event } from '@/app/actions/events';
import { checkInToSession } from '@/app/actions/attendance-sessions';
import { checkInWithQR } from '@/app/actions/meetings/attendance';

// Import types from separate types file
import type { CheckInType, Resource } from '@/app/check-in/types';



export default function UnifiedCheckInPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const type = params.type as CheckInType;
    const id = params.id as string;
    const qrToken = searchParams.get('token') || undefined;

    const { user, loading: authLoading } = useAuth();
    const toast = useToast();
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [hasCheckedIn, setHasCheckedIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Hooks for different types
    const { data: attendanceSession, isLoading: attendanceLoading } = useAttendanceSession(
        type === 'attendance' ? id : ''
    );
    const { data: meeting, isLoading: meetingLoading } = useMeeting(
        type === 'meeting' ? id : ''
    );

    // Fetch event data using useQuery instead of useEffect
    const { data: eventData, isLoading: eventLoading } = useQuery({
        queryKey: ['part2Events', id],
        queryFn: async () => {
            const result = await getPart2Event(id);
            return result.success ? result.data : null;
        },
        enabled: type === 'event',
    });

    // Derive resource from hooks - no useEffect needed
    const resource: Resource | null = useMemo(() => {
        if (type === 'attendance') return (attendanceSession as Resource) || null;
        if (type === 'meeting') return (meeting as Resource) || null;
        if (type === 'event') return (eventData as Resource) || null;
        return null;
    }, [type, attendanceSession, meeting, eventData]);

    const resourceLoading = useMemo(() => {
        if (type === 'attendance') return attendanceLoading;
        if (type === 'meeting') return meetingLoading;
        if (type === 'event') return eventLoading;
        return false;
    }, [type, attendanceLoading, meetingLoading, eventLoading]);

    // Derive hasCheckedIn from resource - no useEffect needed
    const isAlreadyCheckedIn = useMemo(() => {
        if (!resource || !user) return false;

        if (type === 'attendance') {
            const userAttendance = resource.attendances?.find((a) => a.studentId === user.id);
            return !!userAttendance;
        }

        if (type === 'meeting') {
            const userAttendance = resource.attendances?.find((a) => a.userId === user.id);
            return !!userAttendance;
        }

        return false;
    }, [resource, user, type]);

    const handleCheckIn = async () => {
        if (!user) {
            const callbackUrl = `/check-in/${type}/${id}${qrToken ? `?token=${qrToken}` : ''}`;
            router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
            return;
        }

        setIsCheckingIn(true);
        setError(null);

        try {
            if (type === 'attendance') {
                // Call server action directly
                const result = await checkInToSession(id);
                if (result.error) {
                    setError(result.error);
                    toast.error(result.error);
                } else {
                    setHasCheckedIn(true);
                    toast.success('Başarıyla giriş yapıldı');
                    // Invalidate queries
                    queryClient.invalidateQueries({ queryKey: ['attendanceSessions'] });
                    queryClient.invalidateQueries({ queryKey: ['attendanceSessions', id] });
                    setTimeout(() => {
                        router.push(`/dashboard/part2/attendance/${id}`);
                    }, 1500);
                }
            } else if (type === 'meeting') {
                // Call server action directly
                const result = await checkInWithQR(id);
                if (result.error) {
                    setError(result.error);
                    toast.error(result.error);
                } else {
                    setHasCheckedIn(true);
                    toast.success('Başarıyla giriş yapıldı');
                    // Invalidate queries
                    queryClient.invalidateQueries({ queryKey: ['meetings', id, 'attendance'] });
                    queryClient.invalidateQueries({ queryKey: ['meetings', id] });
                    setTimeout(() => {
                        router.push(`/dashboard/part1/meetings/${id}`);
                    }, 1500);
                }
            } else if (type === 'event') {
                const result = await checkInToPart2Event(id, qrToken);

                // Handle unauthorized
                if (!result.success && result.error === 'Unauthorized') {
                    const callbackUrl = `/check-in/event/${id}${qrToken ? `?token=${qrToken}` : ''}`;
                    router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
                    return;
                }

                // Translate error messages
                if (result.error) {
                    let errorMessage = result.error;
                    if (result.error === 'Event not found') {
                        errorMessage = 'Etkinlik bulunamadı';
                    } else if (result.error === 'Event is not currently active for check-in') {
                        errorMessage = 'Etkinlik şu anda giriş için aktif değil. Lütfen etkinlik başladığında tekrar deneyin.';
                    } else if (result.error === 'Invalid QR code') {
                        errorMessage = 'Geçersiz QR kod. Lütfen doğru QR kodu tarayın.';
                    } else if (result.error === 'QR code has expired') {
                        errorMessage = 'QR kod süresi dolmuş. Lütfen yeni bir  QR kod oluşturun.';
                    }
                    setError(errorMessage);
                    toast.error(errorMessage);
                } else {
                    setHasCheckedIn(true);
                    toast.success('Başarıyla giriş yapıldı');
                    // Invalidate queries
                    queryClient.invalidateQueries({ queryKey: ['part2Events'] });
                    queryClient.invalidateQueries({ queryKey: ['part2Events', id] });
                    setTimeout(() => {
                        router.push(`/events/${id}`);
                    }, 1500);
                }
            }
        } catch (err: any) {
            const errorMsg = err?.message || 'Bir hata oluştu';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsCheckingIn(false);
        }
    };

    const handleQRScan = async (decodedText: string) => {
        let scannedType: CheckInType | null = null;
        let scannedId: string | null = null;

        try {
            // Try to match different URL patterns
            const attendanceMatch = decodedText.match(/\/check-in\/attendance\/([^\/\?]+)/);
            const meetingMatch = decodedText.match(/\/check-in\/meeting\/([^\/\?]+)/);
            const eventMatch = decodedText.match(/\/check-in\/event\/([^\/\?]+)/);

            if (attendanceMatch) {
                scannedType = 'attendance';
                scannedId = attendanceMatch[1];
            } else if (meetingMatch) {
                scannedType = 'meeting';
                scannedId = meetingMatch[1];
            } else if (eventMatch) {
                scannedType = 'event';
                scannedId = eventMatch[1];
            } else {
                // Fallback: try to parse as plain ID
                scannedId = decodedText.trim();
                scannedType = type; // Use current type
            }
        } catch (e) {
            console.error('Error parsing QR code:', e);
            toast.error('QR kod okunamadı. Lütfen geçerli bir QR kod tarayın.');
            return;
        }

        if (!scannedId || !scannedType) {
            toast.error('QR kodda bilgi bulunamadı.');
            return;
        }

        // If scanned QR matches current page, check in
        if (scannedId === id && scannedType === type) {
            await handleCheckIn();
        } else {
            // Navigate to the scanned check-in page
            const tokenParam = decodedText.includes('?token=') ? decodedText.split('?')[1] : '';
            router.push(`/check-in/${scannedType}/${scannedId}${tokenParam ? '?' + tokenParam : ''}`);
        }
    };

    // Loading state
    const isLoading = authLoading || resourceLoading || attendanceLoading || meetingLoading;

    if (isLoading) {
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

    if (!resource) {
        const resourceName = type === 'attendance' ? 'Oturum' : type === 'meeting' ? 'Toplantı' : 'Etkinlik';
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center py-12 text-red-600">{resourceName} bulunamadı</div>
                    <Button
                        variant="outline"
                        onClick={() => router.push('/dashboard')}
                        className="mt-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Ana Sayfaya Dön
                    </Button>
                </div>
            </div>
        );
    }

    const hasQRCode = !!resource.qrCodeToken;
    const isQRCodeExpired = resource.qrCodeExpiresAt
        ? new Date(resource.qrCodeExpiresAt) < new Date()
        : false;

    const resourceTitle = resource.title || resource.name || 'Giriş';
    const pageTitle = type === 'attendance' ? 'Yoklama Girişi' : type === 'meeting' ? 'Toplantı Girişi' : 'Etkinlik Girişi';

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => {
                        if (type === 'attendance') {
                            router.push(`/dashboard/part2/attendance/${id}`);
                        } else if (type === 'meeting') {
                            router.push(`/dashboard/part1/meetings/${id}`);
                        } else if (type === 'event') {
                            router.push(`/events/${id}`);
                        }
                    }}
                    className="mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Geri Dön
                </Button>

                <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    <CardHeader>
                        <CardTitle className="text-2xl">{pageTitle}</CardTitle>
                        <CardDescription>
                            {resourceTitle}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isCheckingIn ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                <p className="text-lg font-medium text-gray-800 mb-2">Giriş yapılıyor...</p>
                                <p className="text-sm text-gray-600">Katılımınız kaydediliyor.</p>
                            </div>
                        ) : isAlreadyCheckedIn || hasCheckedIn ? (
                            <div className="text-center py-8">
                                <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
                                <p className="text-lg font-medium text-gray-800 mb-2">Başarıyla Giriş Yapıldı!</p>
                                <p className="text-sm text-gray-600 mb-4">Katılımınız kaydedildi.</p>
                                <Button
                                    onClick={() => {
                                        if (type === 'attendance') {
                                            router.push(`/dashboard/part2/attendance/${id}`);
                                        } else if (type === 'meeting') {
                                            router.push(`/dashboard/part1/meetings/${id}`);
                                        } else if (type === 'event') {
                                            router.push(`/events/${id}`);
                                        }
                                    }}
                                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                                >
                                    Detaylara Git
                                </Button>
                            </div>
                        ) : !hasQRCode && type !== 'meeting' ? (
                            <div className="text-center py-8">
                                <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                <p className="text-lg font-medium text-gray-800 mb-2">QR Kod Henüz Oluşturulmadı</p>
                                <p className="text-sm text-gray-600 mb-6">
                                    Bu {type === 'attendance' ? 'oturum' : 'etkinlik'} için QR kod henüz oluşturulmamış.
                                </p>
                                <Button
                                    onClick={handleCheckIn}
                                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white mb-4 w-full"
                                >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Manuel Giriş Yap
                                </Button>
                            </div>
                        ) : isQRCodeExpired && type !== 'meeting' ? (
                            <div className="text-center py-8">
                                <QrCode className="h-16 w-16 mx-auto mb-4 text-red-400" />
                                <p className="text-lg font-medium text-gray-800 mb-2">QR Kod Süresi Dolmuş</p>
                                <p className="text-sm text-gray-600 mb-6">
                                    Bu {type === 'attendance' ? 'oturum' : 'etkinlik'} için QR kodun süresi dolmuş.
                                </p>
                                <Button
                                    onClick={handleCheckIn}
                                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white mb-4 w-full"
                                >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Manuel Giriş Yap
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Manual Check-in Button */}
                                <div className="text-center py-4 border-b border-gray-200">
                                    <Button
                                        onClick={handleCheckIn}
                                        disabled={isCheckingIn}
                                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/50 w-full mb-4"
                                    >
                                        {isCheckingIn ? (
                                            <>
                                                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Giriş Yapılıyor...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                Giriş Yap
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

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
                                        {error}
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
