"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface ActivityInfo {
    id: string;
    title: string;
    description: string | null;
    workshopName: string;
    date: string;
}

function AttendanceContent() {
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const token = searchParams.get('token');

    const [activity, setActivity] = useState<ActivityInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [checking, setChecking] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Geçersiz QR kod. Token bulunamadı.');
            setLoading(false);
            return;
        }

        if (status === 'loading') return;

        if (!session?.user) {
            setError('Bu işlemi yapmak için giriş yapmalısınız.');
            setLoading(false);
            return;
        }

        fetchActivityInfo();
    }, [token, session, status]);

    const fetchActivityInfo = async () => {
        try {
            const res = await fetch(`/api/attendance/verify?token=${token}`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Faaliyet bulunamadı');
            }
            const data = await res.json();
            setActivity(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (!activity) return;

        setChecking(true);
        try {
            const res = await fetch(`/api/workshops/activities/${activity.id}/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    qrToken: token,
                    method: 'QR',
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Yoklama alınamadı');
            }

            // Check if already attended
            if (data.alreadyAttended) {
                setError(data.message || 'Yoklamanız daha önce alındı');
                setSuccess(false);
                toast.error(data.message);
                return;
            }

            setSuccess(true);

            // Show reward message if points were awarded
            if (data.pointsAwarded && data.pointsAwarded > 0) {
                toast.success(`Yoklama başarıyla alındı! 🎉\n+${data.pointsAwarded} puan +${data.experienceAwarded} tecrübe kazandınız!`);
            } else {
                toast.success('Yoklama başarıyla alındı!');
            }
        } catch (err: any) {
            toast.error(err.message);
            setError(err.message);
        } finally {
            setChecking(false);
        }
    };

    if (loading || status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50">
                <Card className="w-full max-w-md shadow-lg">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-12 w-12 animate-spin text-amber-600 mb-4" />
                            <p className="text-gray-600">Yükleniyor...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!session?.user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <CardTitle className="text-2xl">Giriş Gerekli</CardTitle>
                        <CardDescription>
                            Yoklama almak için giriş yapmalısınız.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/login">
                            <Button className="w-full bg-amber-600 hover:bg-amber-700">
                                Giriş Yap
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <XCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <CardTitle className="text-2xl">Hata</CardTitle>
                        <CardDescription className="text-red-600">
                            {error}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/part4">
                            <Button variant="outline" className="w-full">
                                Atölyelerim'e Dön
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl text-green-700">Başarılı!</CardTitle>
                        <CardDescription className="text-gray-600">
                            Yoklamanız başarıyla alındı.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <p className="text-sm text-gray-500">Faaliyet</p>
                            <p className="font-semibold text-gray-900">{activity?.title}</p>
                            <p className="text-sm text-gray-500">Atölye</p>
                            <p className="font-medium text-gray-700">{activity?.workshopName}</p>
                        </div>
                        <Link href="/dashboard/part4">
                            <Button className="w-full bg-amber-600 hover:bg-amber-700">
                                Atölyelerim'e Dön
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-amber-600" />
                    </div>
                    <CardTitle className="text-2xl">Yoklama Al</CardTitle>
                    <CardDescription>
                        Aşağıdaki faaliyete katıldığınızı onaylayın
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <p className="text-sm text-gray-500">Faaliyet</p>
                        <p className="font-semibold text-gray-900">{activity?.title}</p>
                        {activity?.description && (
                            <>
                                <p className="text-sm text-gray-500 mt-2">Açıklama</p>
                                <p className="text-sm text-gray-700">{activity.description}</p>
                            </>
                        )}
                        <p className="text-sm text-gray-500 mt-2">Atölye</p>
                        <p className="font-medium text-gray-700">{activity?.workshopName}</p>
                        {activity?.date && (
                            <>
                                <p className="text-sm text-gray-500 mt-2">Tarih</p>
                                <p className="text-sm text-gray-700">
                                    {new Date(activity.date).toLocaleDateString('tr-TR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </>
                        )}
                    </div>

                    <Button
                        onClick={handleCheckIn}
                        disabled={checking}
                        className="w-full bg-amber-600 hover:bg-amber-700"
                    >
                        {checking ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Yoklama alınıyor...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Yoklamayı Onayla
                            </>
                        )}
                    </Button>

                    <Link href="/dashboard/part4">
                        <Button variant="outline" className="w-full">
                            İptal
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AttendancePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50">
                <Card className="w-full max-w-md shadow-lg">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-12 w-12 animate-spin text-amber-600 mb-4" />
                            <p className="text-gray-600">Yükleniyor...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        }>
            <AttendanceContent />
        </Suspense>
    );
}
