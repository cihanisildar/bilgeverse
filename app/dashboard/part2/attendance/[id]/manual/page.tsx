'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Users, Search, CheckCircle2, UserCheck } from 'lucide-react';
import { useAttendanceSession } from '@/app/hooks/use-attendance-sessions';
import { manualCheckInToSession, getTutorStudents } from '@/app/actions/attendance-sessions';
import { useState, useEffect } from 'react';
import { useToast } from '@/app/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

type Student = {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    tutor: {
        id: string;
        firstName: string | null;
        lastName: string | null;
    } | null;
};

export default function ManualAttendancePage() {
    const toast = useToast();
    const router = useRouter();
    const params = useParams();
    const sessionId = params.id as string;
    const queryClient = useQueryClient();
    const { user, loading: authLoading, isAdmin, isTutor } = useAuth();
    const { data: session, isLoading: sessionLoading } = useAttendanceSession(sessionId);

    const [students, setStudents] = useState<Student[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [checkingInIds, setCheckingInIds] = useState<Set<string>>(new Set());

    const canManage = isAdmin || isTutor;

    useEffect(() => {
        const fetchStudents = async () => {
            setLoadingStudents(true);
            const result = await getTutorStudents();
            if (!result.error && result.data) {
                setStudents(result.data);
            } else if (result.error) {
                toast.error(result.error);
            }
            setLoadingStudents(false);
        };

        if (user && canManage) {
            fetchStudents();
        }
    }, [user, canManage]);

    const handleCheckIn = async (studentId: string) => {
        setCheckingInIds(prev => new Set(prev).add(studentId));

        try {
            const result = await manualCheckInToSession(sessionId, studentId);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Öğrenci başarıyla işaretlendi');
                queryClient.invalidateQueries({ queryKey: ['attendanceSession', sessionId] });
                // Force page reload to show updated data
                window.location.reload();
            }
        } catch (error) {
            toast.error('Giriş yapılırken bir hata oluştu');
        } finally {
            setCheckingInIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(studentId);
                return newSet;
            });
        }
    };

    const isCheckedIn = (studentId: string) => {
        return session?.attendances?.some((a: any) => a.studentId === studentId);
    };

    const filteredStudents = students.filter(student => {
        const searchLower = searchTerm.toLowerCase();
        const firstName = student.firstName?.toLowerCase() || '';
        const lastName = student.lastName?.toLowerCase() || '';
        const username = student.username.toLowerCase();

        return firstName.includes(searchLower) ||
            lastName.includes(searchLower) ||
            username.includes(searchLower);
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (authLoading || sessionLoading || loadingStudents) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!user || !session || !canManage) {
        return null;
    }

    const checkedInCount = session.attendances?.length || 0;
    const totalStudents = students.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => router.push(`/dashboard/part2/attendance/${sessionId}`)}
                    className="mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Yoklamaya Dön
                </Button>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Manuel Yoklama
                    </h1>
                    <p className="text-gray-600 mb-4">
                        {session.title} - {formatDate(session.sessionDate)}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            <span className="font-semibold text-gray-700">
                                {checkedInCount} / {totalStudents} öğrenci giriş yaptı
                            </span>
                        </div>
                    </div>
                </div>

                <Card className="border-0 shadow-lg rounded-xl overflow-hidden mb-6">
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    <CardHeader>
                        <CardTitle>Grubunuzdaki Öğrenciler</CardTitle>
                        <CardDescription>
                            Öğrencileri manuel olarak işaretleyebilirsiniz
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Öğrenci ara (isim veya kullanıcı adı)..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => {
                                    const checkedIn = isCheckedIn(student.id);
                                    const checking = checkingInIds.has(student.id);

                                    return (
                                        <div
                                            key={student.id}
                                            className={`flex items-center justify-between p-4 rounded-lg border transition-all ${checkedIn
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-white border-gray-200 hover:border-blue-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {checkedIn && (
                                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-800">
                                                        {student.firstName} {student.lastName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">@{student.username}</p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => handleCheckIn(student.id)}
                                                disabled={checkedIn || checking}
                                                size="sm"
                                                className={`${checkedIn
                                                    ? 'bg-green-600 hover:bg-green-700'
                                                    : 'bg-blue-600 hover:bg-blue-700'
                                                    } text-white`}
                                            >
                                                {checking ? (
                                                    <>
                                                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                        İşleniyor...
                                                    </>
                                                ) : checkedIn ? (
                                                    <>
                                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                                        İşaretlendi
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserCheck className="h-4 w-4 mr-2" />
                                                        İşaretle
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                    <p>
                                        {searchTerm
                                            ? 'Arama kriterine uygun öğrenci bulunamadı'
                                            : 'Grubunuzda öğrenci bulunmuyor'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
