'use client';

import { useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { checkInToPart2Event, getPart2Event } from '@/app/actions/events';

interface CheckInComponentProps {
    eventId: string;
    qrToken?: string;
    redirectUrl?: string;
    onSuccess?: () => void;
}

export default function CheckInComponent({
    eventId,
    qrToken,
    redirectUrl,
    onSuccess
}: CheckInComponentProps) {
    const [isPending, startTransition] = useTransition();
    const [checkInResult, setCheckInResult] = useState<{
        success: boolean;
        error?: string;
        errorCode?: string;
        eventName?: string;
    } | null>(null);
    const [event, setEvent] = useState<any>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        // Fetch event details
        startTransition(async () => {
            try {
                const eventResult = await getPart2Event(eventId);
                if (eventResult.success && eventResult.data) {
                    setEvent(eventResult.data);
                }
            } catch (error) {
                console.error('Error fetching event:', error);
            }
        });
    }, [eventId]);

    useEffect(() => {
        if (eventId && !checkInResult) {
            // Automatically attempt check-in when component loads
            startTransition(async () => {
                try {
                    const result = await checkInToPart2Event(eventId, qrToken);

                    // If unauthorized, redirect to login with callback URL
                    if (!result.success && result.error === 'Unauthorized') {
                        setIsRedirecting(true);
                        const currentUrl = window.location.pathname + window.location.search;
                        window.location.href = `/login?callbackUrl=${encodeURIComponent(currentUrl)}`;
                        return;
                    }

                    // Translate error messages to Turkish
                    const errorCode = result.error;
                    let errorMessage = result.error;
                    if (result.error === 'Event not found') {
                        errorMessage = 'Etkinlik bulunamadı';
                    } else if (result.error === 'Event is not currently active for check-in') {
                        errorMessage = 'Etkinlik şu anda giriş için aktif değil. Lütfen etkinlik başladığında tekrar deneyin.';
                    } else if (result.error === 'Invalid QR code') {
                        errorMessage = 'Geçersiz QR kod. Lütfen doğru QR kodu tarayın.';
                    } else if (result.error === 'QR code has expired') {
                        errorMessage = 'QR kod süresi dolmuş. Lütfen yeni bir QR kod oluşturun.';
                    }

                    setCheckInResult({
                        success: result.success,
                        error: errorMessage,
                        errorCode: errorCode,
                        eventName: event?.title
                    });

                    if (result.success && onSuccess) {
                        onSuccess();
                    }
                } catch (error: any) {
                    setCheckInResult({
                        success: false,
                        error: error?.message || 'Bir hata oluştu',
                        eventName: event?.title
                    });
                }
            });
        }
    }, [eventId, qrToken, checkInResult, event, onSuccess]);

    const handleRetry = () => {
        setCheckInResult(null);
    };

    const finalRedirectUrl = redirectUrl || `/events/${eventId}`;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
            <Card className="max-w-md w-full border-0 shadow-lg rounded-xl">
                <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                <CardHeader>
                    <CardTitle>Etkinlik Girişi</CardTitle>
                    <CardDescription>
                        {event?.title || 'Etkinliğe giriş yapılıyor...'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isRedirecting ? (
                        <div className="text-center py-8">
                            <Loader2 className="h-16 w-16 mx-auto mb-4 text-blue-600 animate-spin" />
                            <p className="text-lg font-medium text-gray-800 mb-2">Giriş sayfasına yönlendiriliyorsunuz...</p>
                            <p className="text-sm text-gray-600">Lütfen bekleyin</p>
                        </div>
                    ) : isPending || !checkInResult ? (
                        <div className="text-center py-8">
                            <Loader2 className="h-16 w-16 mx-auto mb-4 text-purple-600 animate-spin" />
                            <p className="text-lg font-medium text-gray-800 mb-2">Giriş yapılıyor...</p>
                            <p className="text-sm text-gray-600">Lütfen bekleyin</p>
                        </div>
                    ) : checkInResult.success ? (
                        <div className="text-center py-8">
                            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
                            <p className="text-lg font-medium text-gray-800 mb-2">Başarılı!</p>
                            <p className="text-sm text-gray-600 mb-2">
                                Etkinliğe başarıyla giriş yaptınız.
                            </p>
                            {event?.title && (
                                <p className="text-sm font-medium text-purple-600 mb-6">
                                    {event.title}
                                </p>
                            )}
                            <Link href={finalRedirectUrl}>
                                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                                    Etkinlik Detaylarına Git
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <XCircle className="h-16 w-16 mx-auto mb-4 text-red-600" />
                            <p className="text-lg font-medium text-gray-800 mb-2">Giriş Başarısız</p>
                            <p className="text-sm text-gray-600 mb-6">
                                {checkInResult.error || 'Bir hata oluştu. Lütfen tekrar deneyin.'}
                            </p>

                            {/* Show login button if event not active */}
                            {checkInResult.errorCode === 'Event is not currently active for check-in' ? (
                                <div className="flex flex-col gap-3">
                                    <Link href={`/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`} className="w-full">
                                        <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                                            Giriş Yap
                                        </Button>
                                    </Link>
                                    <Link href={finalRedirectUrl} className="w-full">
                                        <Button variant="outline" className="w-full">
                                            Etkinlik Sayfasına Dön
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <Button
                                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                                        onClick={handleRetry}
                                        disabled={isPending}
                                    >
                                        Tekrar Dene
                                    </Button>
                                    <Link href={finalRedirectUrl} className="w-full">
                                        <Button variant="outline" className="w-full">
                                            Etkinlik Sayfasına Dön
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
