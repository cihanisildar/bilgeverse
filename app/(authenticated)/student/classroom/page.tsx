'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/app/contexts/AuthContext";
import { GraduationCap, Users, Star, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: 'STUDENT' | 'TUTOR';
  avatarUrl?: string;
  points?: number;
};

type ClassroomInfo = {
  tutor: User;
  students: User[];
};

function ClassroomSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 sm:h-6 sm:w-6" />
            <Skeleton className="h-6 w-24 sm:h-7 sm:w-32" />
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-36 sm:h-5 sm:w-48" />
              <Skeleton className="h-3 w-24 sm:h-4 sm:w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 sm:h-6 sm:w-6" />
            <Skeleton className="h-6 w-24 sm:h-7 sm:w-32" />
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 sm:gap-4">
                <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24 sm:h-5 sm:w-32" />
                  <Skeleton className="h-3 w-20 sm:h-4 sm:w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StudentCard({ student, isCurrentUser = false }: { student: User; isCurrentUser?: boolean }) {
  return (
    <div className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg transition-all w-full ${isCurrentUser ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50'}`}>
      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-offset-2 ring-blue-500">
        <AvatarImage src={student.avatarUrl} />
        <AvatarFallback className="bg-blue-100 text-blue-700 text-sm sm:text-base">
          {student.firstName?.[0]}
          {student.lastName?.[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
            {student.firstName} {student.lastName}
          </p>
          {isCurrentUser && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs sm:text-sm">
              Sen
            </Badge>
          )}
        </div>
        <p className="text-xs sm:text-sm text-gray-500 truncate">{student.username}</p>
        {student.points !== undefined && (
          <div className="flex items-center gap-1 mt-1 text-xs sm:text-sm text-yellow-600">
            <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-500" />
            <span>{student.points} puan</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClassroomPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classroom, setClassroom] = useState<ClassroomInfo | null>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to be checked
    if (authLoading) return;

    // Redirect if not authenticated
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user is a student
    if (user.role !== 'STUDENT') {
      setError('Bu sayfaya erişim yetkiniz bulunmamaktadır');
      return;
    }

    const fetchClassroomInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/student/classroom', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Sınıf bilgileri alınamadı');
        }

        if (!data.tutor || !data.students) {
          throw new Error('Sınıf bilgileri eksik veya hatalı');
        }

        setClassroom(data);
      } catch (error: any) {
        console.error('Error fetching classroom info:', error);
        setError(error.message);
        toast({
          variant: "destructive",
          title: "Hata",
          description: error.message || "Sınıf bilgileri yüklenirken bir hata oluştu",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClassroomInfo();
  }, [toast, user, authLoading, router]);

  // Show loading state while checking auth
  if (authLoading || loading) {
    return (
      <div className="container py-8">
        <ClassroomSkeleton />
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <p>{error || 'Sınıf bilgileri bulunamadı'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Tutor Section */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl w-full">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold">
              <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
              Danışman Öğretmen
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-white/20">
                <AvatarImage src={classroom.tutor.avatarUrl} />
                <AvatarFallback className="bg-white/10 text-white text-xl sm:text-2xl">
                  {classroom.tutor.firstName?.[0]}
                  {classroom.tutor.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <p className="text-xl sm:text-2xl font-semibold">
                  {classroom.tutor.firstName} {classroom.tutor.lastName}
                </p>
                <p className="text-base sm:text-lg text-blue-100">{classroom.tutor.username}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Section */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="border-b bg-gray-50/50 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Sınıf Arkadaşları</span>
                </CardTitle>
                <Badge variant="secondary" className="ml-0 sm:ml-2 bg-blue-100 text-blue-700 text-xs sm:text-sm">
                  {classroom.students.length + 1} Öğrenci
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm sm:text-base">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                <span className="font-medium text-gray-600">Toplam Puan: {user?.points || 0}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {/* Current User Card */}
              {user && (
                <StudentCard
                  student={{
                    id: user.id,
                    username: user.username,
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    role: 'STUDENT',
                    avatarUrl: user.avatarUrl,
                    points: user.points
                  }}
                  isCurrentUser={true}
                />
              )}
              
              {/* Other Students */}
              {classroom.students.map((student) => (
                <StudentCard key={student.id} student={student} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 