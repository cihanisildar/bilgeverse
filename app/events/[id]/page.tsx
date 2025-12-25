'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Loader2, ArrowLeft } from 'lucide-react';
import { getPart2Event } from '@/app/actions/events';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';

const statusColors = {
    YAKINDA: 'bg-blue-100 text-blue-700',
    DEVAM_EDIYOR: 'bg-green-100 text-green-700',
    TAMAMLANDI: 'bg-gray-100 text-gray-700',
    IPTAL_EDILDI: 'bg-red-100 text-red-700',
};

const statusLabels = {
    YAKINDA: 'Yakında',
    DEVAM_EDIYOR: 'Devam Ediyor',
    TAMAMLANDI: 'Tamamlandı',
    IPTAL_EDILDI: 'İptal Edildi',
};

export default function PublicEventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const result = await getPart2Event(eventId);
                if (result.success && result.data) {
                    setEvent(result.data);
                } else {
                    setError(result.error || 'Etkinlik bulunamadı');
                }
            } catch (err: any) {
                setError(err?.message || 'Bir hata oluştu');
            } finally {
                setLoading(false);
            }
        };

        if (eventId) {
            fetchEvent();
        }
    }, [eventId]);

    const formatDateTime = (dateString: string | undefined | null) => {
        if (!dateString) return 'Tarih belirtilmemiş';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Geçersiz tarih';
            return format(date, 'dd MMMM yyyy, HH:mm', { locale: tr });
        } catch (error) {
            return 'Geçersiz tarih';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
                    <p className="text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
                <Card className="max-w-md w-full border-0 shadow-lg rounded-xl">
                    <CardHeader>
                        <CardTitle className="text-red-600">Hata</CardTitle>
                        <CardDescription>{error || 'Etkinlik bulunamadı'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => router.back()}
                            variant="outline"
                            className="w-full"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Geri Dön
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const participantCount = event.participants?.length || 0;
    const capacityPercentage = (participantCount / event.capacity) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Geri Dön
                </Button>

                <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>

                    <CardHeader>
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <Badge className={statusColors[event.status as keyof typeof statusColors]}>
                                        {statusLabels[event.status as keyof typeof statusLabels]}
                                    </Badge>
                                    {event.eventType && (
                                        <Badge variant="outline" className="border-purple-200 text-purple-700">
                                            {event.eventType.name}
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="text-3xl mb-2">{event.title}</CardTitle>
                                <CardDescription className="text-base">
                                    {event.description}
                                </CardDescription>
                            </div>
                        </div>

                        {/* Event Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <div className="flex items-center text-gray-700">
                                <Calendar className="h-5 w-5 mr-3 text-purple-600 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-gray-500">Tarih</p>
                                    <p className="font-medium">{formatDateTime(event.eventDate)}</p>
                                </div>
                            </div>

                            <div className="flex items-center text-gray-700">
                                <MapPin className="h-5 w-5 mr-3 text-purple-600 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-gray-500">Konum</p>
                                    <p className="font-medium">{event.location}</p>
                                </div>
                            </div>

                            <div className="flex items-center text-gray-700">
                                <Users className="h-5 w-5 mr-3 text-purple-600 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-gray-500">Katılımcılar</p>
                                    <p className="font-medium">
                                        {participantCount} / {event.capacity}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {/* Capacity Progress */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-600">Doluluk Oranı</span>
                                <span className="font-medium text-gray-800">
                                    {Math.round(capacityPercentage)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all ${
                                        capacityPercentage >= 100
                                            ? 'bg-red-500'
                                            : capacityPercentage >= 75
                                            ? 'bg-yellow-500'
                                            : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Notes */}
                        {event.notes && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <h3 className="font-semibold text-purple-900 mb-2">Notlar</h3>
                                <p className="text-sm text-purple-800 whitespace-pre-wrap">{event.notes}</p>
                            </div>
                        )}

                        {/* Login Prompt */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600 mb-4">
                                Daha fazla özellik için giriş yapın
                            </p>
                            <Link href="/login">
                                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                                    Giriş Yap
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
