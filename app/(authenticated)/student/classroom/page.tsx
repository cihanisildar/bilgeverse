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
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
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
    <div className={`flex items-center gap-4 p-4 rounded-lg transition-all w-full ${isCurrentUser ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50'}`}>
      <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-blue-500">
        <AvatarImage src={student.avatarUrl} />
        <AvatarFallback className="bg-blue-100 text-blue-700">
          {student.firstName?.[0]}
          {student.lastName?.[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900">
            {student.firstName} {student.lastName}
          </p>
          {isCurrentUser && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
              Sen
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-500">{student.username}</p>
        {student.points !== undefined && (
          <div className="flex items-center gap-1 mt-1 text-sm text-yellow-600">
            <Star className="h-4 w-4 fill-yellow-500" />
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
    <div className="flex-1 p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Tutor Section */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <GraduationCap className="h-6 w-6" />
              Danışman Öğretmen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="h-16 w-16 ring-4 ring-white/20">
                <AvatarImage src={classroom.tutor.avatarUrl} />
                <AvatarFallback className="bg-white/10 text-white text-xl">
                  {classroom.tutor.firstName?.[0]}
                  {classroom.tutor.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-2xl font-semibold">
                  {classroom.tutor.firstName} {classroom.tutor.lastName}
                </p>
                <p className="text-blue-100 text-lg">{classroom.tutor.username}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Section */}
        <Card className="border-0 shadow-lg w-full">
          <CardHeader className="border-b bg-gray-50/50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                <Users className="h-6 w-6" />
                <span>Sınıf Arkadaşları</span>
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                  {classroom.students.length + 1} Öğrenci
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-600">Toplam Puan: {user?.points || 0}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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