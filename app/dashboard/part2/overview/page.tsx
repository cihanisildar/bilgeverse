'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Users, CheckCircle2, XCircle, Calendar, TrendingUp, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getAttendanceSessions } from '@/app/actions/attendance-sessions';
import { useAuth } from '@/app/contexts/AuthContext';
import { useEffect, useState, useMemo } from 'react';

// Helper to get current week
function getCurrentWeek(): { start: Date; end: Date } {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
}

type TutorStats = {
    tutorId: string;
    tutorName: string;
    totalStudents: number;
    attendedStudents: number;
    absentStudents: number;
    attendanceRate: number;
    hasSession: boolean;
    sessionTitle?: string;
};

const ITEMS_PER_PAGE = 10;

export default function AttendanceOverviewPage() {
    const router = useRouter();
    const { user, isAdmin } = useAuth();
    const [tutorStats, setTutorStats] = useState<TutorStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const { data: sessionsResult } = useQuery({
        queryKey: ['attendanceSessions'],
        queryFn: async () => {
            const result = await getAttendanceSessions();
            return result;
        },
    });

    useEffect(() => {
        if (!isAdmin) {
            router.push('/dashboard/part2');
            return;
        }

        const fetchStats = async () => {
            try {
                const response = await fetch('/api/admin/attendance-overview');
                const data = await response.json();

                if (data.success) {
                    setTutorStats(data.stats);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [isAdmin, router]);

    if (!isAdmin) {
        return null;
    }

    const currentWeek = getCurrentWeek();
    const weekText = `${currentWeek.start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - ${currentWeek.end.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`;

    // Filter tutors based on search term
    const filteredTutors = useMemo(() => {
        if (!searchTerm.trim()) return tutorStats;
        const term = searchTerm.toLowerCase();
        return tutorStats.filter(tutor =>
            tutor.tutorName.toLowerCase().includes(term) ||
            tutor.sessionTitle?.toLowerCase().includes(term)
        );
    }, [tutorStats, searchTerm]);

    // Pagination logic
    const totalPages = Math.ceil(filteredTutors.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentTutors = filteredTutors.slice(startIndex, endIndex);

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const goToPage = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 300, behavior: 'smooth' });
    };

    const goToPrevious = () => {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    };

    const goToNext = () => {
        if (currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    };

    // Generate page numbers
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const totalStats = tutorStats.reduce((acc, tutor) => ({
        totalStudents: acc.totalStudents + tutor.totalStudents,
        attendedStudents: acc.attendedStudents + tutor.attendedStudents,
        absentStudents: acc.absentStudents + tutor.absentStudents,
    }), { totalStudents: 0, attendedStudents: 0, absentStudents: 0 });

    const overallRate = totalStats.totalStudents > 0
        ? Math.round((totalStats.attendedStudents / totalStats.totalStudents) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Link href="/dashboard/part2">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Geri Dön
                    </Button>
                </Link>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                            Haftalık Yoklama Özeti
                        </span>
                    </h1>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <p>{weekText}</p>
                    </div>
                </div>

                {/* Overall Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Toplam Öğrenci</p>
                                    {loading ? (
                                        <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
                                    ) : (
                                        <p className="text-3xl font-bold text-gray-900">{totalStats.totalStudents}</p>
                                    )}
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
                                    <p className="text-sm text-gray-600 mb-1">Katılan</p>
                                    {loading ? (
                                        <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
                                    ) : (
                                        <p className="text-3xl font-bold text-green-600">{totalStats.attendedStudents}</p>
                                    )}
                                </div>
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Devamsız</p>
                                    {loading ? (
                                        <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
                                    ) : (
                                        <p className="text-3xl font-bold text-orange-600">{totalStats.absentStudents}</p>
                                    )}
                                </div>
                                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                    <XCircle className="h-6 w-6 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Katılım Oranı</p>
                                    {loading ? (
                                        <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
                                    ) : (
                                        <p className="text-3xl font-bold text-purple-600">{overallRate}%</p>
                                    )}
                                </div>
                                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tutor Breakdown */}
                <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <CardTitle className="text-xl">Sınıf Bazında Durum</CardTitle>
                            {/* Search Bar */}
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Öğretmen adı ile ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                                <p className="text-gray-600">Yükleniyor...</p>
                            </div>
                        ) : filteredTutors.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                <p className="text-gray-600">
                                    {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz sınıf bulunmuyor'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4 mb-6">
                                    {currentTutors.map((tutor) => (
                                        <div
                                            key={tutor.tutorId}
                                            onClick={() => router.push(`/dashboard/part2/overview/tutor/${tutor.tutorId}`)}
                                            className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-600">{tutor.tutorName}</h3>
                                                    {tutor.hasSession && tutor.sessionTitle && (
                                                        <p className="text-sm text-gray-500">{tutor.sessionTitle}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-purple-600">{tutor.attendanceRate}%</p>
                                                    <p className="text-xs text-gray-500">Katılım</p>
                                                </div>
                                            </div>

                                            {!tutor.hasSession ? (
                                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                    <p className="text-sm text-yellow-800">Bu hafta yoklama oluşturulmamış</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                                                        <p className="text-2xl font-bold text-blue-600">{tutor.totalStudents}</p>
                                                        <p className="text-xs text-gray-600">Toplam</p>
                                                    </div>
                                                    <div className="bg-green-50 rounded-lg p-3 text-center">
                                                        <p className="text-2xl font-bold text-green-600">{tutor.attendedStudents}</p>
                                                        <p className="text-xs text-gray-600">Katılan</p>
                                                    </div>
                                                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                                                        <p className="text-2xl font-bold text-orange-600">{tutor.absentStudents}</p>
                                                        <p className="text-xs text-gray-600">Devamsız</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 pt-4 border-t">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={goToPrevious}
                                            disabled={currentPage === 1}
                                            className="h-9 w-9 p-0"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>

                                        <div className="flex items-center gap-1">
                                            {getPageNumbers().map((page, index) => (
                                                page === '...' ? (
                                                    <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                                                        ...
                                                    </span>
                                                ) : (
                                                    <Button
                                                        key={page}
                                                        variant={currentPage === page ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => goToPage(page as number)}
                                                        className={`h-9 w-9 p-0 ${currentPage === page
                                                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                                            : 'hover:bg-purple-50'
                                                            }`}
                                                    >
                                                        {page}
                                                    </Button>
                                                )
                                            ))}
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={goToNext}
                                            disabled={currentPage === totalPages}
                                            className="h-9 w-9 p-0"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>

                                        <span className="text-sm text-gray-600 ml-4">
                                            Sayfa {currentPage} / {totalPages}
                                        </span>
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
