'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import AttendanceSessionsList from './AttendanceSessionsList';
import AttendanceHeaderButtons from './AttendanceHeaderButtons';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { getAttendanceSessions, getTutorStudents } from '@/app/actions/attendance-sessions';
import { useState } from 'react';
import { GraduationCap, UserCheck, AlertCircle } from 'lucide-react';

export default function AttendancePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false);

  const { data: sessionsResult, isLoading: sessionsLoading } = useQuery({
    queryKey: ['attendanceSessions'],
    queryFn: async () => {
      const result = await getAttendanceSessions();
      return result;
    },
    enabled: !!user,
  });

  const { data: studentsResult, isLoading: studentsLoading } = useQuery({
    queryKey: ['tutorStudents'],
    queryFn: async () => {
      const result = await getTutorStudents();
      return result;
    },
    enabled: !!user,
  });

  if (authLoading || sessionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const isStudent = user.role === 'STUDENT';
  if (isStudent) {
    router.push('/dashboard/part7/student');
    return null;
  }

  const sessions = sessionsResult?.data || [];
  const students = studentsResult?.data || [];
  const hasStudents = students.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/dashboard/part2">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
        </Link>

        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
                  Haftalık Yoklama Yönetimi
                </span>
              </h1>
              <p className="text-gray-600">QR kod ile öğrenci devam takibi yapın</p>
            </div>
            <div className="flex gap-2">
              {/* Students Dialog Button */}
              <Dialog open={studentsDialogOpen} onOpenChange={setStudentsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Öğrencilerim ({students.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">
                        <GraduationCap className="h-6 w-6" />
                      </div>
                      <div>
                        <DialogTitle className="text-xl">Sınıfınız</DialogTitle>
                        <DialogDescription>
                          Sizin sorumlu olduğunuz öğrenciler
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>

                  {studentsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                  ) : students.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-orange-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Size Atanmış Sınıf Bulunmuyor
                      </h3>
                      <p className="text-gray-600 mb-2">
                        Yoklama almak için öncelikle size bir sınıf atanması gerekmektedir.
                      </p>
                      <p className="text-sm text-gray-500">
                        Lütfen yönetici ile iletişime geçin.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg mb-4">
                        <div className="flex items-center gap-3">
                          <Users className="h-8 w-8 text-purple-600" />
                          <div>
                            <p className="text-2xl font-bold text-gray-800">{students.length}</p>
                            <p className="text-sm text-gray-600">Öğrenci</p>
                          </div>
                        </div>
                        <UserCheck className="h-8 w-8 text-purple-400" />
                      </div>

                      <div className="flex-1 overflow-y-auto">
                        <p className="text-sm font-medium text-gray-700 mb-3">Öğrencileriniz:</p>
                        <div className="space-y-2">
                          {students.map((student: any) => (
                            <div
                              key={student.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-purple-600">
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
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </DialogContent>
              </Dialog>

              <AttendanceHeaderButtons hasStudents={hasStudents} />
            </div>
          </div>

          <AttendanceSessionsList sessions={sessions} hasStudents={hasStudents} />
        </div>
      </div>
    </div>
  );
}
