"use client";

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
import Link from "next/link";
import { useEffect, useState } from "react";
import { LevelBadge } from "@/components/LevelBadge";

interface LeaderboardEntry {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  points: number;
  experience: number;
  rank: number;
}

interface UserRanking {
  rank: number;
  points: number;
  experience: number;
}

function HeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-6 sm:h-8 w-[200px] sm:w-[250px]" />
      <Skeleton className="h-3 sm:h-4 w-[250px] sm:w-[300px]" />
    </div>
  );
}

function LeaderboardEntrySkeleton() {
  return (
    <tr>
      <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
        <Skeleton className="h-5 sm:h-6 w-6 sm:w-8" />
      </td>
      <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
        <div className="flex items-center">
          <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full mr-2 sm:mr-3" />
          <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
        </div>
      </td>
      <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-right">
        <Skeleton className="h-5 sm:h-6 w-12 sm:w-16 ml-auto" />
      </td>
    </tr>
  );
}

function StatsCardSkeleton() {
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1 sm:space-y-2">
            <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
            <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
          </div>
          <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
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

      const response = await fetch("/api/leaderboard", {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard data");
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
      setUserRank(data.userRank || null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  function getDisplayName(user: {
    firstName: string | null;
    lastName: string | null;
    username: string;
  }) {
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header with Gradient Title */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Liderlik Tablosu
            </span>
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            En iyi öğrenciler ve sizin konumunuz
          </p>
        </div>

        {/* Personal Rank Card */}
        {userRank && (
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg font-medium text-gray-800 flex items-center gap-2">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" />
                Sizin Sıralamanız
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 sm:gap-4">
                  <div
                    className={`
                    w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center
                    ${
                      userRank.rank <= 3
                        ? userRank.rank === 1
                          ? "bg-yellow-100 text-yellow-700"
                          : userRank.rank === 2
                          ? "bg-gray-100 text-gray-700"
                          : "bg-amber-100 text-amber-700"
                        : "bg-indigo-100 text-indigo-700"
                    }
                  `}
                  >
                    <span className="text-xl sm:text-2xl font-bold">
                      #{userRank.rank}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <div className="flex flex-col gap-1">
                      <p className="text-xs sm:text-sm text-gray-600">
                        Toplam{" "}
                        <span className="font-medium">
                          {userRank.experience}
                        </span>{" "}
                        tecrübe puanı
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="text-xs sm:text-sm text-gray-500">
                      Sıralama
                    </div>
                    <div className="mt-1 text-base sm:text-xl font-medium text-gray-900">
                      {userRank.rank} / {leaderboard.length}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs sm:text-sm text-gray-500">
                      Üst %
                    </div>
                    <div className="mt-1 text-base sm:text-xl font-medium text-gray-900">
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
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" />
              En İyi 25 Öğrenci
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Puanlarına göre en başarılı öğrenciler
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12 sm:w-16">
                      Sıra
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Öğrenci
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20 sm:w-24">
                      Puan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((student) => {
                    const isCurrentUser = student.id === user?.id;

                    return (
                      <tr
                        key={student.id}
                        className={cn(
                          isCurrentUser
                            ? "bg-indigo-50"
                            : student.rank <= 3
                            ? student.rank === 1
                              ? "bg-yellow-50"
                              : student.rank === 2
                              ? "bg-gray-50"
                              : "bg-amber-50"
                            : "",
                          "hover:bg-gray-50 transition-colors"
                        )}
                      >
                        <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span
                              className={cn(
                                student.rank <= 3 ? "font-bold" : "",
                                student.rank === 1 ? "text-yellow-500" : "",
                                student.rank === 2 ? "text-gray-500" : "",
                                student.rank === 3 ? "text-amber-600" : "",
                                "text-sm sm:text-base"
                              )}
                            >
                              #{student.rank}
                            </span>
                            {getRankIcon(student.rank)}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3">
                              <AvatarFallback
                                className={cn(
                                  isCurrentUser
                                    ? "bg-indigo-200 text-indigo-800"
                                    : student.rank === 1
                                    ? "bg-yellow-100 text-yellow-800"
                                    : student.rank === 2
                                    ? "bg-gray-100 text-gray-800"
                                    : student.rank === 3
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-indigo-100 text-indigo-800",
                                  "text-xs sm:text-sm"
                                )}
                              >
                                {getDisplayName(student).charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span
                                className={cn(
                                  "text-xs sm:text-sm font-medium",
                                  isCurrentUser
                                    ? "text-indigo-700"
                                    : "text-gray-900"
                                )}
                              >
                                {isCurrentUser
                                  ? "Siz"
                                  : getDisplayName(student)}
                              </span>
                              <LevelBadge
                                points={student.experience}
                                showProgress={isCurrentUser}
                                className="mt-0.5 sm:mt-1 text-xs"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-right">
                          <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm">
                            {student.experience}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="py-3 sm:py-4 px-4 sm:px-6 border-t">
            <div className="w-full text-center text-xs sm:text-sm text-gray-500">
              Gösterilen: {Math.min(25, leaderboard.length)} /{" "}
              {leaderboard.length} öğrenci
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
