'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, RefreshCw, Users, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/app/hooks/use-toast';

type StudentIssue = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  tutor: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  hasClassroom: boolean;
};

export default function FixAssignmentsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [studentsWithIssues, setStudentsWithIssues] = useState<StudentIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState<string | null>(null);
  const [fixingAll, setFixingAll] = useState(false);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.push('/unauthorized');
      return;
    }
    fetchStudentsWithIssues();
  }, [user, router]);

  const fetchStudentsWithIssues = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/students-assignment-issues');
      if (!response.ok) {
        throw new Error('Failed to fetch students with assignment issues');
      }
      const data = await response.json();
      setStudentsWithIssues(data.studentsWithIssues || []);
    } catch (error) {
      console.error('Error fetching students with issues:', error);
      toast.error('Öğrenci atama sorunları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fixStudentAssignment = async (studentId: string, tutorId: string) => {
    try {
      setFixing(studentId);
      const response = await fetch('/api/admin/assign-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId, tutorId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fix student assignment');
      }

      toast.success('Öğrenci ataması düzeltildi!');
      await fetchStudentsWithIssues(); // Refresh the list
    } catch (error) {
      console.error('Error fixing student assignment:', error);
      toast.error('Öğrenci ataması düzeltilirken hata oluştu');
    } finally {
      setFixing(null);
    }
  };

  const fixAllAssignments = async () => {
    try {
      setFixingAll(true);
      let fixedCount = 0;
      let errorCount = 0;

      for (const student of studentsWithIssues) {
        try {
          const response = await fetch('/api/admin/assign-students', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              studentId: student.id, 
              tutorId: student.tutor.id 
            }),
          });

          if (response.ok) {
            fixedCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (fixedCount > 0) {
        toast.success(`${fixedCount} öğrenci ataması düzeltildi!`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} öğrenci ataması düzeltilirken hata oluştu`);
      }

      await fetchStudentsWithIssues(); // Refresh the list
    } catch (error) {
      console.error('Error fixing all assignments:', error);
      toast.error('Toplu düzeltme işleminde hata oluştu');
    } finally {
      setFixingAll(false);
    }
  };

  const getStudentDisplayName = (student: StudentIssue) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    }
    return student.username;
  };

  const getTutorDisplayName = (tutor: any) => {
    if (tutor.firstName && tutor.lastName) {
      return `${tutor.firstName} ${tutor.lastName}`;
    }
    return tutor.username;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Atama Sorunlarını Düzelt</h1>
            <p className="text-gray-600 mt-2">
              Eğitmene atanmış ancak sınıfa atanmamış öğrencileri düzeltin
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {studentsWithIssues.length} Sorun
            </Badge>
          </div>
        </div>
      </div>

      {studentsWithIssues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Tüm Atamalar Doğru!
            </h2>
            <p className="text-gray-600 text-center">
              Tüm öğrenciler hem eğitmenlerine hem de sınıflarına doğru şekilde atanmış.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Atama Sorunları
                </CardTitle>
                <CardDescription>
                  Bu öğrenciler eğitmenlerine atanmış ancak sınıflarına atanmamış
                </CardDescription>
              </div>
              <Button 
                onClick={fixAllAssignments}
                disabled={fixingAll}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {fixingAll ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Düzeltiliyor...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Tümünü Düzelt
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studentsWithIssues.map((student) => (
                <Card key={student.id} className="border-amber-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {getStudentDisplayName(student)}
                    </CardTitle>
                    <CardDescription>
                      @{student.username}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Eğitmen:</span>
                      <p className="text-gray-600">
                        {getTutorDisplayName(student.tutor)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-amber-700 border-amber-300">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Sınıfa atanmamış
                      </Badge>
                    </div>
                    <Button
                      onClick={() => fixStudentAssignment(student.id, student.tutor.id)}
                      disabled={fixing === student.id}
                      size="sm"
                      className="w-full"
                    >
                      {fixing === student.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Düzeltiliyor...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Düzelt
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 