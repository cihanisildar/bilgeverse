'use client';

import { HeaderSkeleton } from '@/app/components/ui/skeleton-shimmer';
import { useAuth } from "@/app/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Award,
  BarChart2,
  Medal,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Student {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  currentPoints: number;
  totalEarnedPoints: number;
  rank: number;
}

interface TutorStudent {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
}

interface LeaderboardContentProps {
  leaderboardData: Student[];
  tutorStudents: TutorStudent[];
}

// Static Header Component
function LeaderboardHeader() {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
          Liderlik Tablosu
        </span>
      </h1>
      <p className="mt-1 text-gray-600">Tüm öğrenciler ve sizin öğrencilerinizin sıralaması</p>
    </div>
  );
}

// Dynamic Leaderboard Content Component
function LeaderboardContent({ leaderboardData, tutorStudents }: LeaderboardContentProps) {
  function getDisplayName(user: any) {
    return user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username;
  }

  function getRankIcon(rank: number) {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-500" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
    return null;
  }
  
  // Extract tutor's students from the leaderboard
  const myStudentsLeaderboard = leaderboardData.filter((student: any) => 
    tutorStudents.some((tutorStudent: any) => tutorStudent.id === student.id)
  );
  
  // Calculate statistics for my students
  const stats = {
    count: myStudentsLeaderboard.length,
    avgRank: myStudentsLeaderboard.length > 0 
      ? Math.round(myStudentsLeaderboard.reduce((sum: number, student: any) => sum + student.rank, 0) / myStudentsLeaderboard.length) 
      : 0,
    avgPoints: myStudentsLeaderboard.length > 0 
      ? Math.round(myStudentsLeaderboard.reduce((sum: number, student: any) => sum + student.totalEarnedPoints, 0) / myStudentsLeaderboard.length) 
      : 0,
    topRank: myStudentsLeaderboard.length > 0 
      ? Math.min(...myStudentsLeaderboard.map((student: any) => student.rank)) 
      : 0,
  };

  return (
    <>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Öğrenci Sayınız</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.count}</h3>
              </div>
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Ortalama Sıralama</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.avgRank}</h3>
              </div>
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <BarChart2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
          <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Ortalama Puan</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.avgPoints}</h3>
              </div>
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <Award className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
          <div className="h-1 bg-gradient-to-r from-yellow-400 to-amber-500"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">En İyi Sıralama</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">#{stats.topRank}</h3>
              </div>
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                <Trophy className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Table */}
      <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Trophy className="h-5 w-5 text-indigo-500" />
            Öğrenci Sıralaması
          </CardTitle>
          <CardDescription>Tüm öğrenciler ve sizin öğrencileriniz</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="myStudents" className="w-full">
            <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-6">
              <TabsTrigger value="myStudents">Öğrencilerim</TabsTrigger>
              <TabsTrigger value="allStudents">Tüm Öğrenciler</TabsTrigger>
            </TabsList>
            
            <TabsContent value="myStudents">
              {myStudentsLeaderboard.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Sıra</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Öğrenci</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Puan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myStudentsLeaderboard.map((student: any) => (
                        <tr 
                          key={student.id}
                          className={cn(
                            student.rank <= 3 ? 
                              student.rank === 1 ? 'bg-yellow-50' : 
                              student.rank === 2 ? 'bg-gray-50' : 
                              'bg-amber-50' : '',
                            "hover:bg-gray-50 transition-colors"
                          )}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                student.rank <= 3 ? 'font-bold' : '',
                                student.rank === 1 ? 'text-yellow-500' : '',
                                student.rank === 2 ? 'text-gray-500' : '',
                                student.rank === 3 ? 'text-amber-600' : ''
                              )}>
                                #{student.rank}
                              </span>
                              {getRankIcon(student.rank)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-3">
                                <AvatarFallback className={cn(
                                  student.rank === 1 ? 'bg-yellow-100 text-yellow-800' : 
                                  student.rank === 2 ? 'bg-gray-100 text-gray-800' : 
                                  student.rank === 3 ? 'bg-amber-100 text-amber-800' : 
                                  'bg-indigo-100 text-indigo-800'
                                )}>
                                  {getDisplayName(student).charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">
                                  {getDisplayName(student)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium">Kazanılan:</span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm">
                                  {student.totalEarnedPoints}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium">Mevcut:</span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm">
                                  {student.currentPoints}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <User className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-lg font-medium">Henüz öğrenciniz bulunmuyor</p>
                  <p className="text-sm">Size atanan öğrenciler burada listelenecek</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="allStudents">
              <div className="rounded-md border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Sıra</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Öğrenci</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Puan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((student: any) => (
                      <tr 
                        key={student.id}
                        className={cn(
                          student.rank <= 3 ? 
                            student.rank === 1 ? 'bg-yellow-50' : 
                            student.rank === 2 ? 'bg-gray-50' : 
                            'bg-amber-50' : '',
                          tutorStudents.some((tutorStudent: any) => tutorStudent.id === student.id) ? 'bg-indigo-50/40' : '',
                          "hover:bg-gray-50 transition-colors"
                        )}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              student.rank <= 3 ? 'font-bold' : '',
                              student.rank === 1 ? 'text-yellow-500' : '',
                              student.rank === 2 ? 'text-gray-500' : '',
                              student.rank === 3 ? 'text-amber-600' : ''
                            )}>
                              #{student.rank}
                            </span>
                            {getRankIcon(student.rank)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarFallback className={cn(
                                student.rank === 1 ? 'bg-yellow-100 text-yellow-800' : 
                                student.rank === 2 ? 'bg-gray-100 text-gray-800' : 
                                student.rank === 3 ? 'bg-amber-100 text-amber-800' : 
                                tutorStudents.some((tutorStudent: any) => tutorStudent.id === student.id) ? 'bg-indigo-100 text-indigo-800' :
                                'bg-gray-100 text-gray-800'
                              )}>
                                {getDisplayName(student).charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">
                                {getDisplayName(student)}
                              </span>
                              {tutorStudents.some((tutorStudent: any) => tutorStudent.id === student.id) && (
                                <span className="text-xs text-indigo-600">Sizin öğrenciniz</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 font-medium">Kazanılan:</span>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm">
                                {student.totalEarnedPoints}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 font-medium">Mevcut:</span>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm">
                                {student.currentPoints}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}

// Loading state components
function StatsCardSkeleton() {
  return (
    <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200">
      <div className="h-1 bg-gradient-to-r from-gray-200 to-gray-300"></div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-16 mt-1" />
          </div>
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function LeaderboardTableSkeleton() {
  return (
    <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-gray-200 to-gray-300"></div>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-4 w-64 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Skeleton className="h-10 w-[400px]" />
          <div className="rounded-md border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 w-16">
                    <Skeleton className="h-4 w-8" />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <Skeleton className="h-4 w-24" />
                  </th>
                  <th className="px-4 py-3 text-right w-24">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...Array(10)].map((_, index) => (
                  <tr key={`row-skeleton-${index}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-6" />
                        {index < 3 && <Skeleton className="h-4 w-4" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingLeaderboard() {
  return (
    <div className="space-y-8">
      <HeaderSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <div key={`stats-skeleton-${index}`} className="border rounded-xl overflow-hidden shadow-lg">
            <div className="h-1 bg-gradient-to-r from-gray-200 to-gray-300" />
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <Card className="border-0 shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sıralama
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Öğrenci
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Öğretmen
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-8" />
                      <Skeleton className="h-6 w-6" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Skeleton className="h-10 w-10 rounded-full mr-3" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Skeleton className="h-6 w-20 rounded-full ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function TutorLeaderboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<Student[]>([]);
  const [tutorStudents, setTutorStudents] = useState<TutorStudent[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch leaderboard data
      const leaderboardRes = await fetch('/api/tutor/leaderboard', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!leaderboardRes.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }

      const leaderboardJson = await leaderboardRes.json();
      setLeaderboardData(leaderboardJson.leaderboard || []);

      // Fetch tutor's students
      const studentsRes = await fetch('/api/tutor/students', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!studentsRes.ok) {
        throw new Error('Failed to fetch tutor students');
      }

      const studentsJson = await studentsRes.json();
      setTutorStudents(studentsJson.students || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <LoadingLeaderboard />;
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-700">
              <BarChart2 className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <LeaderboardHeader />
      <LeaderboardContent 
        leaderboardData={leaderboardData} 
        tutorStudents={tutorStudents} 
      />
    </div>
  );
} 