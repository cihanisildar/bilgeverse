'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/app/contexts/AuthContext";
import { GraduationCap, Users, Star, Trophy, Sparkles, Crown, BookOpen } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="px-4 py-8 space-y-8">
        {/* Tutor Card Skeleton */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-48" />
            </div>
            <div className="flex items-center gap-6">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-6 w-40" />
              </div>
            </div>
          </div>
        </div>

        {/* Students Card Skeleton */}
        <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-white/40 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-100/60 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-white to-gray-50 border border-gray-100">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentCard({ student, isCurrentUser = false, rank }: { student: User; isCurrentUser?: boolean; rank?: number }) {
  const getAvatarFallback = () => {
    if (student.firstName && student.lastName) {
      return `${student.firstName[0]}${student.lastName[0]}`;
    } else if (student.firstName) {
      return student.firstName[0];
    } else if (student.lastName) {
      return student.lastName[0];
    } else if (student.username) {
      return student.username[0].toUpperCase();
    }
    return 'Ö';
  };

  const getDisplayName = () => {
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    } else if (student.firstName) {
      return student.firstName;
    } else if (student.lastName) {
      return student.lastName;
    }
    return student.username;
  };

  const getRankColor = () => {
    if (rank === 1) return 'from-yellow-400 to-orange-500';
    if (rank === 2) return 'from-gray-300 to-gray-500';
    if (rank === 3) return 'from-amber-600 to-amber-800';
    return 'from-blue-400 to-indigo-600';
  };

  const getRankIcon = () => {
    if (rank === 1) return <Crown className="h-4 w-4 text-yellow-600" />;
    if (rank === 2) return <Crown className="h-4 w-4 text-gray-600" />;
    if (rank === 3) return <Crown className="h-4 w-4 text-amber-700" />;
    return null;
  };

  return (
    <div className={`group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl ${
      isCurrentUser 
        ? 'bg-gradient-to-br from-violet-100 via-blue-50 to-indigo-100 border-2 border-violet-200 shadow-lg' 
        : 'bg-gradient-to-br from-white to-gray-50/80 hover:from-blue-50 hover:to-purple-50 border border-gray-200/60 hover:border-blue-200 shadow-md hover:shadow-lg'
    }`}>
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-500"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-pink-200/20 to-orange-200/20 rounded-full translate-y-8 -translate-x-8 group-hover:scale-110 transition-transform duration-500"></div>
      
      <div className="relative z-10 flex items-center gap-4">
        <div className="relative">
          <Avatar className={`h-14 w-14 ring-3 ring-offset-2 transition-all duration-300 ${
            isCurrentUser ? 'ring-violet-300' : 'ring-blue-200 group-hover:ring-blue-300'
          }`}>
            <AvatarImage src={student.avatarUrl} className="object-cover" />
            <AvatarFallback className={`bg-gradient-to-br ${getRankColor()} text-white text-lg font-bold shadow-lg`}>
              {getAvatarFallback()}
            </AvatarFallback>
          </Avatar>
          {rank && rank <= 3 && (
            <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-md">
              {getRankIcon()}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-gray-900 text-base truncate">
              {getDisplayName()}
            </p>
            {isCurrentUser && (
              <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 text-xs font-medium px-2 py-1 shadow-sm">
                <Sparkles className="h-3 w-3 mr-1" />
                Sen
              </Badge>
            )}
            {rank && rank <= 3 && !isCurrentUser && (
              <Badge variant="outline" className="text-xs font-medium border-yellow-300 text-yellow-700 bg-yellow-50">
                #{rank}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate mb-2">@{student.username}</p>
          {(student.points !== undefined && student.points !== null) && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-100 to-orange-100 px-2 py-1 rounded-full">
                <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-600" />
                <span className="font-semibold text-yellow-700 text-sm">{student.points}</span>
                <span className="text-yellow-600 text-xs">puan</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClassroomPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classroom, setClassroom] = useState<ClassroomInfo | null>(null);
  const [currentUserPoints, setCurrentUserPoints] = useState<number>(0);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'STUDENT') {
      setError('Bu sayfaya erişim yetkiniz bulunmamaktadır');
      return;
    }

    const fetchClassroomInfo = async () => {
      try {
        setLoading(true);
        
        const [classroomResponse, userResponse] = await Promise.all([
          fetch('/api/student/classroom', {
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
            }
          }),
          fetch('/api/auth/me', {
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
            }
          })
        ]);

        const classroomData = await classroomResponse.json();
        const userData = await userResponse.json();

        if (!classroomResponse.ok) {
          throw new Error(classroomData.error || 'Sınıf bilgileri alınamadı');
        }

        if (!classroomData.tutor) {
          throw new Error('Sınıf bilgileri eksik veya hatalı');
        }

        if (userResponse.ok && userData.user && userData.user.points !== undefined) {
          setCurrentUserPoints(userData.user.points);
        } else if (user && user.points !== undefined) {
          setCurrentUserPoints(user.points);
        }

        setClassroom(classroomData);
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

  if (authLoading || loading) {
    return <ClassroomSkeleton />;
  }

  if (error || !classroom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/80 backdrop-blur-sm border border-white/40 shadow-xl">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium mb-2">Sınıf Bulunamadı</p>
            <p className="text-gray-500">{error || 'Sınıf bilgileri bulunamadı'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sort students by points for ranking
  const allStudents = [
    {
      id: user!.id,
      username: user!.username,
      firstName: user!.firstName || '',
      lastName: user!.lastName || '',
      role: 'STUDENT' as const,
      avatarUrl: user!.avatarUrl,
      points: currentUserPoints
    },
    ...classroom.students
  ].sort((a, b) => (b.points || 0) - (a.points || 0));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-violet-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Sınıfım
          </h1>
          <p className="text-gray-600">Danışman öğretmeniniz ve sınıf arkadaşlarınız</p>
        </div>

        {/* Tutor Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 p-8 shadow-2xl transform hover:scale-[1.01] transition-all duration-300">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Danışman Öğretmen</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar className="h-20 w-20 ring-4 ring-white/30 shadow-xl">
                <AvatarImage src={classroom.tutor.avatarUrl} className="object-cover" />
                <AvatarFallback className="bg-white/20 text-white text-2xl font-bold backdrop-blur-sm">
                  {(() => {
                    if (classroom.tutor.firstName && classroom.tutor.lastName) {
                      return `${classroom.tutor.firstName[0]}${classroom.tutor.lastName[0]}`;
                    } else if (classroom.tutor.firstName) {
                      return classroom.tutor.firstName[0];
                    } else if (classroom.tutor.lastName) {
                      return classroom.tutor.lastName[0];
                    } else if (classroom.tutor.username) {
                      return classroom.tutor.username[0].toUpperCase();
                    }
                    return 'Ö';
                  })()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <p className="text-2xl font-bold text-white mb-1">
                  {(() => {
                    if (classroom.tutor.firstName && classroom.tutor.lastName) {
                      return `${classroom.tutor.firstName} ${classroom.tutor.lastName}`;
                    } else if (classroom.tutor.firstName) {
                      return classroom.tutor.firstName;
                    } else if (classroom.tutor.lastName) {
                      return classroom.tutor.lastName;
                    }
                    return classroom.tutor.username;
                  })()}
                </p>
                <p className="text-white/80 text-lg">@{classroom.tutor.username}</p>
                <div className="mt-3 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm inline-block">
                  <span className="text-white/90 font-medium">Öğretmen</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Students Section */}
        <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-white/40 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-100/60 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Sınıf Arkadaşları</h2>
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 font-medium">
                  {classroom.students.length + 1} Öğrenci
                </Badge>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold text-yellow-700">
                  Senin Puanın: {currentUserPoints}
                </span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {allStudents.map((student, index) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  isCurrentUser={student.id === user!.id}
                  rank={index + 1}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 