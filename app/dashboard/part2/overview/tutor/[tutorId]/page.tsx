'use client';

import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Calendar, TrendingUp, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';

type SessionDetail = {
    id: string;
    title: string;
    sessionDate: string;
    totalStudents: number;
    attendedStudents: number;
    absentStudents: number;
    attendanceRate: number;
    qrCodeToken: string | null;
};

type TutorDetail = {
    tutorId: string;
    tutorName: string;
    totalStudents: number;
    sessions: SessionDetail[];
    overallAttendanceRate: number;
    totalSessions: number;
};

export default function TutorDetailPage() {
    const router = useRouter();
    const params = useParams();
    const tutorId = params.tutorId as string;
    const { isAdmin } = useAuth();
    const [tutorDetail, setTutorDetail] = useState<TutorDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAdmin) {
            router.push('/dashboard/part2');
            return;
        }

        const fetchTutorDetail = async () => {
            try {
                const response = await fetch(`/api/admin/tutor-attendance/${tutorId}`);
                const data = await response.json();

                if (data.success) {
                    setTutorDetail(data.tutor);
                }
            } catch (error) {
                console.error('Error fetching tutor detail:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTutorDetail();
    }, [tutorId, isAdmin, router]);

    if (!isAdmin) {
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                    <p className="text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!tutorDetail) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Öğretmen bulunamadı</p>
                    <Link href="/dashboard/part2/overview">
                        <Button>Geri Dön</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Link href="/dashboard/part2/overview">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Özet Sayfasına Dön
                    </Button>
                </Link>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                            {tutorDetail.tutorName}
                        </span>
                    </h1>
                    <p className="text-gray-600">Yoklama Geçmişi ve İstatistikler</p>
                </div>

                {/* Overall Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Toplam Öğrenci</p>
                                    <p className="text-3xl font-bold text-gray-900">{tutorDetail.totalStudents}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Toplam Yoklama</p>
                                    <p className="text-3xl font-bold text-purple-600">{tutorDetail.totalSessions}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                    <Calendar className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Genel Katılım</p>
                                    <p className="text-3xl font-bold text-green-600">{tutorDetail.overallAttendanceRate}%</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Son Yoklama</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {tutorDetail.sessions.length > 0 ? (() => {
                                            const lastSession = new Date(tutorDetail.sessions[0].sessionDate);
                                            const day = lastSession.getDay();
                                            const diff = lastSession.getDate() - day + (day === 0 ? -6 : 1);
                                            const monday = new Date(lastSession.setDate(diff));
                                            const sunday = new Date(monday);
                                            sunday.setDate(monday.getDate() + 6);

                                            const start = monday.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                                            const end = sunday.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

                                            return `${start} - ${end}`;
                                        })() : 'Henüz yok'}
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sessions List */}
                <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                    <CardHeader>
                        <CardTitle className="text-xl">Tüm Yoklamalar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {tutorDetail.sessions.length === 0 ? (
                            <div className="text-center py-12">
                                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                <p className="text-gray-600">Henüz yoklama oluşturulmamış</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {tutorDetail.sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 shadow-sm"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-gray-900">{session.title}</h3>
                                                    {session.qrCodeToken && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
                                                            QR Kod
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(session.sessionDate).toLocaleDateString('tr-TR', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-purple-600">{session.attendanceRate}%</p>
                                                    <p className="text-xs text-gray-500">Katılım</p>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="bg-blue-50 rounded-lg px-3 py-2 text-center min-w-[70px]">
                                                        <p className="text-lg font-bold text-blue-600">{session.totalStudents}</p>
                                                        <p className="text-xs text-gray-600">Toplam</p>
                                                    </div>
                                                    <div className="bg-green-50 rounded-lg px-3 py-2 text-center min-w-[70px]">
                                                        <p className="text-lg font-bold text-green-600">{session.attendedStudents}</p>
                                                        <p className="text-xs text-gray-600">Katılan</p>
                                                    </div>
                                                    <div className="bg-orange-50 rounded-lg px-3 py-2 text-center min-w-[70px]">
                                                        <p className="text-lg font-bold text-orange-600">{session.absentStudents}</p>
                                                        <p className="text-xs text-gray-600">Devamsız</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
