"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Users, Search, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AddStudentsModal } from './AddStudentsModal';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StudentRecord {
    id: string;
    joinedAt: Date | string;
    student: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        avatarUrl: string | null;
        tutorId: string | null;
        username: string;
    };
}

export function WorkshopStudents({
    workshopId,
    students,
    isPrivileged,
    currentUserRole,
    currentUserId
}: {
    workshopId: string;
    students: StudentRecord[];
    isPrivileged: boolean;
    currentUserRole: string;
    currentUserId: string;
}) {
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [studentToRemove, setStudentToRemove] = useState<StudentRecord | null>(null);
    const router = useRouter();

    const isEnrolled = students.some(s => s.student.id === currentUserId);

    const handleJoinToggle = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/workshops/${workshopId}/join`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error('Action failed');

            toast.success(isEnrolled ? "Atölyeden ayrıldınız." : "Atölyeye başarıyla katıldınız!");
            router.refresh();
        } catch (error) {
            toast.error("İşlem gerçekleştirilemedi.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveStudent = async () => {
        if (!studentToRemove) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/workshops/${workshopId}/students?studentId=${studentToRemove.student.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Removal failed');
            }

            toast.success("Öğrenci atölyeden çıkarıldı.");
            setStudentToRemove(null);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "İşlem sırasında bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(s =>
        `${s.student.firstName} ${s.student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // For tutors, check if the student belongs to them
    const canRemove = (student: StudentRecord) => {
        if (currentUserRole === 'ADMIN' || currentUserRole === 'BOARD_MEMBER') return true;
        if (currentUserRole === 'TUTOR') {
            return student.student.tutorId === currentUserId;
        }
        return false;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    Kayıtlı Öğrenciler
                    <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {students.length} Kişi
                    </span>
                </h2>
                <div className="flex gap-2">
                    {isPrivileged && (
                        <AddStudentsModal workshopId={workshopId} currentUserRole={currentUserRole} />
                    )}
                    {currentUserRole === 'STUDENT' && (
                        <Button
                            onClick={handleJoinToggle}
                            disabled={loading}
                            variant={isEnrolled ? "outline" : "default"}
                            className={isEnrolled ? "border-red-200 text-red-600 hover:bg-red-50" : "bg-amber-600 hover:bg-amber-700 text-white shadow-md"}
                        >
                            {isEnrolled ? <UserMinus className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                            {isEnrolled ? "Atölyeden Ayrıl" : "Atölyeye Katıl"}
                        </Button>
                    )}
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Öğrenci ara..."
                    className="pl-10 rounded-2xl border-amber-100 bg-white shadow-sm focus:ring-amber-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                        <Users className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                        <p className="text-gray-500">Öğrenci bulunamadı.</p>
                    </div>
                ) : (
                    filteredStudents.map((record) => (
                        <div key={record.id} className="group flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-amber-100 border-2 border-white shadow-sm shrink-0">
                                {record.student.avatarUrl ? (
                                    <Image src={record.student.avatarUrl} alt={record.student.firstName || ''} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-amber-700 font-bold">
                                        {record.student.firstName ? record.student.firstName[0] : '?'}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 truncate">
                                    {record.student.firstName} {record.student.lastName}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Katılma: {new Date(record.joinedAt).toLocaleDateString('tr-TR')}
                                </p>
                            </div>
                            {isPrivileged && canRemove(record) && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setStudentToRemove(record)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-opacity"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Student Removal Confirmation */}
            <AlertDialog open={!!studentToRemove} onOpenChange={(open) => !open && setStudentToRemove(null)}>
                <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto md:mx-0">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold text-gray-900">
                            Öğrenciyi Çıkar?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600">
                            <span className="font-bold text-gray-900">
                                {studentToRemove?.student.firstName} {studentToRemove?.student.lastName}
                            </span> isimli öğrenci bu atölyeden çıkarılacaktır.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl border-gray-200 hover:bg-gray-100">Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemoveStudent}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl border-0 min-w-[100px]"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atölyeden Çıkar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
