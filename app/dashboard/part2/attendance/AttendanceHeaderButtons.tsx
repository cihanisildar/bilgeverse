'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Clock, UserX, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/app/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { getAttendanceSessions, getTutorStudents } from '@/app/actions/attendance-sessions';

type AttendanceHeaderButtonsProps = {
    hasStudents: boolean;
};

// Helper to get current week dates
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

export default function AttendanceHeaderButtons({ hasStudents }: AttendanceHeaderButtonsProps) {
    const router = useRouter();
    const toast = useToast();
    const [showAbsentDialog, setShowAbsentDialog] = useState(false);
    const [absentStudents, setAbsentStudents] = useState<any[]>([]);
    const [isCheckingAbsences, setIsCheckingAbsences] = useState(false);

    const { data: sessionsResult } = useQuery({
        queryKey: ['attendanceSessions'],
        queryFn: async () => {
            const result = await getAttendanceSessions();
            return result;
        },
    });

    const { data: studentsResult } = useQuery({
        queryKey: ['tutorStudents'],
        queryFn: async () => {
            const result = await getTutorStudents();
            return result;
        },
    });

    if (!hasStudents) {
        return null;
    }

    const handleCheckAbsences = async () => {
        setIsCheckingAbsences(true);
        try {
            const sessions = sessionsResult?.data || [];
            const students = studentsResult?.data || [];

            if (students.length === 0) {
                toast.error('Öğrenci bulunamadı');
                setIsCheckingAbsences(false);
                return;
            }

            // Find this week's session
            const currentWeek = getCurrentWeek();
            const thisWeekSession = sessions.find((session: any) => {
                const sessionDate = new Date(session.sessionDate);
                return sessionDate >= currentWeek.start && sessionDate <= currentWeek.end;
            });

            if (!thisWeekSession) {
                toast.error('Bu hafta için yoklama bulunamadı');
                setIsCheckingAbsences(false);
                return;
            }

            // Find absent students (students who didn't check in)
            const attendedStudentIds = thisWeekSession.attendances?.map((a: any) => a.studentId) || [];
            const absent = students.filter((student: any) => !attendedStudentIds.includes(student.id));

            setAbsentStudents(absent);
            setShowAbsentDialog(true);

            if (absent.length === 0) {
                toast.success('Tüm öğrenciler yoklamaya katıldı! 🎉');
            }
        } catch (error) {
            console.error('Error checking absences:', error);
            toast.error('Devamsızlık kontrolü yapılırken bir hata oluştu');
        } finally {
            setIsCheckingAbsences(false);
        }
    };

    return (
        <>
            <div className="flex gap-3 flex-wrap">
                <Button
                    onClick={handleCheckAbsences}
                    disabled={isCheckingAbsences}
                    variant="outline"
                    className="border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                    {isCheckingAbsences ? (
                        <>
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                            Kontrol Ediliyor...
                        </>
                    ) : (
                        <>
                            <Clock className="h-4 w-4 mr-2" />
                            Devamsızlık Kontrolü
                        </>
                    )}
                </Button>
                <Button
                    onClick={() => router.push('/dashboard/part2/attendance/new')}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Yoklama Oluştur
                </Button>
            </div>

            {/* Absent Students Dialog */}
            <Dialog open={showAbsentDialog} onOpenChange={setShowAbsentDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-orange-100 text-orange-600">
                                {absentStudents.length > 0 ? (
                                    <UserX className="h-6 w-6" />
                                ) : (
                                    <AlertCircle className="h-6 w-6 text-green-600" />
                                )}
                            </div>
                            <div>
                                <DialogTitle className="text-xl">
                                    {absentStudents.length > 0
                                        ? `Devamsız Öğrenciler (${absentStudents.length})`
                                        : 'Devamsız Öğrenci Yok'}
                                </DialogTitle>
                                <DialogDescription>
                                    {absentStudents.length > 0
                                        ? 'Bu hafta yoklamaya katılmayan öğrenciler'
                                        : 'Tüm öğrenciler bu hafta yoklamaya katıldı'}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {absentStudents.length > 0 ? (
                        <div className="flex-1 overflow-y-auto">
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-orange-900 mb-1">
                                            Dikkat
                                        </p>
                                        <p className="text-xs text-orange-700">
                                            Aşağıdaki öğrenciler bu haftanın yoklamasına katılmadı
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {absentStudents.map((student: any) => (
                                    <div
                                        key={student.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 border-orange-400"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                                <span className="text-sm font-semibold text-orange-600">
                                                    {student.firstName?.charAt(0) || student.username.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">
                                                    {student.firstName} {student.lastName}
                                                </p>
                                                <p className="text-sm text-gray-500">@{student.username}</p>
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-300">
                                            Devamsız
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-lg font-medium text-gray-800 mb-2">Harika! 🎉</p>
                            <p className="text-sm text-gray-600">
                                Bu hafta tüm öğrencileriniz yoklamaya katıldı
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => setShowAbsentDialog(false)}
                        >
                            Kapat
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
