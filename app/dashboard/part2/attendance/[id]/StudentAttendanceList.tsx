'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Search, CheckCircle2, UserCheck, Undo2 } from 'lucide-react';
import { getTutorStudents, manualCheckInToSession, removeAttendanceFromSession } from '@/app/actions/attendance-sessions';
import { useToast } from '@/app/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

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

type StudentAttendanceListProps = {
    sessionId: string;
    attendances: any[];
};

export default function StudentAttendanceList({ sessionId, attendances }: StudentAttendanceListProps) {
    const toast = useToast();
    const queryClient = useQueryClient();
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [checkingInIds, setCheckingInIds] = useState<Set<string>>(new Set());
    const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [bulkChecking, setBulkChecking] = useState(false);
    // Local state for attendances to enable optimistic updates
    const [localAttendances, setLocalAttendances] = useState<any[]>(attendances || []);

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            const result = await getTutorStudents();
            if (!result.error && result.data) {
                setStudents(result.data);
            } else if (result.error) {
                toast.error(result.error);
            }
            setLoading(false);
        };

        fetchStudents();
    }, []);

    const handleCheckIn = async (studentId: string) => {
        setCheckingInIds(prev => new Set(prev).add(studentId));

        try {
            const result = await manualCheckInToSession(sessionId, studentId);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Öğrenci başarıyla işaretlendi ve 30 puan eklendi');
                // Optimistic update - add to local attendances
                setLocalAttendances(prev => [...prev, { studentId, ...result.data }]);
                // Invalidate React Query cache
                queryClient.invalidateQueries({ queryKey: ['attendanceSession', sessionId] });
                // Force router to refresh server data
                router.refresh();
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

    const handleRemoveAttendance = async (studentId: string) => {
        setRemovingIds(prev => new Set(prev).add(studentId));

        try {
            const result = await removeAttendanceFromSession(sessionId, studentId);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Yoklama geri alındı ve 30 puan düşürüldü');
                // Optimistic update - remove from local attendances
                setLocalAttendances(prev => prev.filter(a => a.studentId !== studentId));
                // Invalidate React Query cache
                queryClient.invalidateQueries({ queryKey: ['attendanceSession', sessionId] });
                // Force router to refresh server data
                router.refresh();
            }
        } catch (error) {
            toast.error('Yoklama geri alınırken bir hata oluştu');
        } finally {
            setRemovingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(studentId);
                return newSet;
            });
        }
    };

    const handleBulkCheckIn = async () => {
        if (selectedStudents.size === 0) {
            toast.error('Lütfen en az bir öğrenci seçin');
            return;
        }

        setBulkChecking(true);
        let successCount = 0;
        let errorCount = 0;
        const successfulStudentIds: string[] = [];

        for (const studentId of selectedStudents) {
            // Skip already checked in students
            if (isCheckedIn(studentId)) continue;

            try {
                const result = await manualCheckInToSession(sessionId, studentId);
                if (result.error) {
                    errorCount++;
                } else {
                    successCount++;
                    successfulStudentIds.push(studentId);
                }
            } catch (error) {
                errorCount++;
            }
        }

        // Optimistic update - add all successful students to local attendances
        if (successfulStudentIds.length > 0) {
            setLocalAttendances(prev => [
                ...prev,
                ...successfulStudentIds.map(studentId => ({ studentId }))
            ]);
        }

        setBulkChecking(false);
        setSelectedStudents(new Set());

        if (successCount > 0) {
            toast.success(`${successCount} öğrenci başarıyla işaretlendi ve ${successCount * 30} puan eklendi`);
            // Refresh server data in background
            router.refresh();
        }
        if (errorCount > 0) {
            toast.error(`${errorCount} öğrenci işaretlenemedi`);
        }
    };

    const toggleStudentSelection = (studentId: string) => {
        setSelectedStudents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        const uncheckedStudents = filteredStudents.filter(s => !isCheckedIn(s.id));
        if (selectedStudents.size === uncheckedStudents.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(uncheckedStudents.map(s => s.id)));
        }
    };

    const isCheckedIn = (studentId: string) => {
        return localAttendances?.some((a: any) => a.studentId === studentId);
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

    if (loading) {
        return (
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                <CardContent className="p-6 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </CardContent>
            </Card>
        );
    }

    if (students.length === 0) {
        return (
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-orange-500 to-red-500"></div>
                <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-600">Sınıfınızda öğrenci bulunmuyor</p>
                </CardContent>
            </Card>
        );
    }

    const checkedInCount = localAttendances?.length || 0;
    const totalStudents = students.length;
    const uncheckedStudents = filteredStudents.filter(s => !isCheckedIn(s.id));

    return (
        <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <CardHeader>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">Sınıfınız</CardTitle>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold text-gray-700">
                                {checkedInCount} / {totalStudents}
                            </span>
                            <span className="text-gray-500">işaretlendi</span>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {uncheckedStudents.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 flex-1">
                                <Checkbox
                                    id="select-all"
                                    checked={selectedStudents.size === uncheckedStudents.length && uncheckedStudents.length > 0}
                                    onCheckedChange={toggleSelectAll}
                                />
                                <label
                                    htmlFor="select-all"
                                    className="text-sm font-medium text-blue-900 cursor-pointer select-none"
                                >
                                    {selectedStudents.size === uncheckedStudents.length && uncheckedStudents.length > 0
                                        ? 'Tüm seçimi kaldır'
                                        : 'Tümünü seç'}
                                    {selectedStudents.size > 0 && ` (${selectedStudents.size} seçili)`}
                                </label>
                            </div>

                            {selectedStudents.size > 0 && (
                                <Button
                                    onClick={handleBulkCheckIn}
                                    disabled={bulkChecking}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                                    size="sm"
                                >
                                    {bulkChecking ? (
                                        <>
                                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            İşaretleniyor...
                                        </>
                                    ) : (
                                        <>
                                            <UserCheck className="h-4 w-4 mr-2" />
                                            Seçilileri İşaretle ({selectedStudents.size})
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Öğrenci ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => {
                            const checkedIn = isCheckedIn(student.id);
                            const checking = checkingInIds.has(student.id);
                            const removing = removingIds.has(student.id);

                            // Debug logging
                            console.log(`Student ${student.username}:`, { checkedIn, studentId: student.id, attendances });

                            return (
                                <div
                                    key={student.id}
                                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200 ${checkedIn
                                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-md'
                                        : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm'
                                        }`}
                                >
                                    {/* Checkbox for bulk selection */}
                                    {!checkedIn && (
                                        <Checkbox
                                            checked={selectedStudents.has(student.id)}
                                            onCheckedChange={() => toggleStudentSelection(student.id)}
                                            className="mt-1"
                                        />
                                    )}

                                    <div className="flex items-center justify-between flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${checkedIn ? 'bg-green-500' : 'bg-purple-100'
                                                }`}>
                                                {checkedIn ? (
                                                    <CheckCircle2 className="h-7 w-7 text-white animate-in zoom-in" />
                                                ) : (
                                                    <span className="text-sm font-semibold text-purple-600">
                                                        {student.firstName?.charAt(0) || student.username.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`font-medium ${checkedIn ? 'text-green-900' : 'text-gray-900'}`}>
                                                    {student.firstName} {student.lastName}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-500">@{student.username}</span>
                                                    {checkedIn && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
                                                            ✓ Katıldı
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {checkedIn ? (
                                            <Button
                                                onClick={() => handleRemoveAttendance(student.id)}
                                                disabled={removing}
                                                size="sm"
                                                variant="outline"
                                                className="min-w-[120px] border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
                                            >
                                                {removing ? (
                                                    <>
                                                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                                                        Geri Alınıyor...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Undo2 className="h-4 w-4 mr-2" />
                                                        Geri Al
                                                    </>
                                                )}
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleCheckIn(student.id)}
                                                disabled={checking}
                                                size="sm"
                                                className="min-w-[120px] bg-purple-600 hover:bg-purple-700 text-white"
                                            >
                                                {checking ? (
                                                    <>
                                                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                        İşleniyor...
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserCheck className="h-4 w-4 mr-2" />
                                                        İşaretle
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>Arama kriterine uygun öğrenci bulunamadı</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
