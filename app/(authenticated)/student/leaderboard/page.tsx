'use client';

import { useAuth } from "@/app/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AlertCircle, Award, Medal, Trophy } from "lucide-react";
import Link from 'next/link';
import { useEffect, useState } from "react";

interface LeaderboardEntry {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  currentPoints: number;
  totalEarnedPoints: number;
  rank: number;
}

interface UserRanking {
  rank: number;
  currentPoints: number;
  totalEarnedPoints: number;
}

function HeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-[250px]" />
      <Skeleton className="h-4 w-[300px]" />
    </div>
  );
}

function LeaderboardEntrySkeleton() {
  return (
    <tr>
      <td className="px-4 py-3 whitespace-nowrap">
        <Skeleton className="h-6 w-8" />
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center">
          <Skeleton className="h-8 w-8 rounded-full mr-3" />
          <Skeleton className="h-4 w-32" />
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <Skeleton className="h-6 w-16 ml-auto" />
      </td>
    </tr>
  );
}

function StatsCardSkeleton() {
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudentLeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRanking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/leaderboard', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
      setUserRank(data.userRank || null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  function getDisplayName(user: { firstName: string | null; lastName: string | null; username: string }) {
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

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-8">
        <HeaderSkeleton />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>

        {/* Leaderboard Table */}
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
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[1, 2, 3, 4, 5].map((i) => (
                  <LeaderboardEntrySkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Gradient Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Liderlik Tablosu
            </span>
          </h1>
          <p className="mt-1 text-gray-600">En iyi öğrenciler ve sizin konumunuz</p>
        </div>

        {/* Personal Rank Card */}
        {userRank && (
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-800 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-indigo-500" />
                Sizin Sıralamanız
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center mr-4
                    ${userRank.rank <= 3 ? 
                      userRank.rank === 1 ? 'bg-yellow-100 text-yellow-700' : 
                      userRank.rank === 2 ? 'bg-gray-100 text-gray-700' : 
                      'bg-amber-100 text-amber-700' : 
                      'bg-indigo-100 text-indigo-700'}
                  `}>
                    <span className="text-2xl font-bold">#{userRank.rank}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <div className="flex flex-col gap-1">
                      <p className="text-gray-600">
                        Toplam <span className="font-medium">{userRank.totalEarnedPoints}</span> puan kazandınız
                      </p>
                      <p className="text-gray-600">
                        Mevcut <span className="font-medium">{userRank.currentPoints}</span> puanınız var
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Sıralama</div>
                    <div className="mt-1 text-xl font-medium text-gray-900">{userRank.rank} / {leaderboard.length}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Üst %</div>
                    <div className="mt-1 text-xl font-medium text-gray-900">
                      {Math.round((userRank.rank / leaderboard.length) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        <Card className="border-0 shadow-lg">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Trophy className="h-5 w-5 text-indigo-500" />
              En İyi 25 Öğrenci
            </CardTitle>
            <CardDescription>Puanlarına göre en başarılı öğrenciler</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Sıra</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Öğrenci</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Puan</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((student) => {
                    const isCurrentUser = student.id === user?.id;
                    
                    return (
                      <tr 
                        key={student.id}
                        className={cn(
                          isCurrentUser ? "bg-indigo-50" : 
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
                                isCurrentUser ? 'bg-indigo-200 text-indigo-800' :
                                student.rank === 1 ? 'bg-yellow-100 text-yellow-800' : 
                                student.rank === 2 ? 'bg-gray-100 text-gray-800' : 
                                student.rank === 3 ? 'bg-amber-100 text-amber-800' : 
                                'bg-indigo-100 text-indigo-800'
                              )}>
                                {getDisplayName(student).charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className={cn(
                                "text-sm font-medium",
                                isCurrentUser ? "text-indigo-700" : "text-gray-900"
                              )}>
                                {isCurrentUser ? "Siz" : getDisplayName(student)}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="py-4 px-6 border-t">
            <div className="w-full text-center text-sm text-gray-500">
              Gösterilen: {Math.min(25, leaderboard.length)} / {leaderboard.length} öğrenci
            </div>
          </CardFooter>
        </Card>
        
        {/* Motivation Card */}
        <Card className="border-0 shadow-lg rounded-xl overflow-hidden bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-800 flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              Daha Yüksek Puan Kazanın
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700">
                Puanınızı artırmak ve sıralamada yükselmek için:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Görevlerinizi zamanında tamamlayın</li>
                <li>Derslere düzenli katılın</li>
                <li>Sınavlarda başarılı olun</li>
                <li>Ekstra aktivitelere katılın</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="bg-white border-t py-4">
            <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md">
              <Link href="/student/tasks">
                Görevlerime Git
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 