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
import { AlertCircle, Award, Medal, Trophy, Crown, Star, Users, Sparkles, Zap, Target, TrendingUp } from "lucide-react";
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
  tutor?: {
    firstName: string | null;
    lastName: string | null;
  } | null;
}

interface UserRanking {
  rank: number;
  points: number;
  experience: number;
}

function HeaderSkeleton() {
  return (
    <div className="text-center mb-16 space-y-6">
      <div className="flex justify-center gap-4">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <Skeleton className="h-16 w-80 rounded-2xl" />
        <Skeleton className="h-14 w-14 rounded-2xl" />
      </div>
      <Skeleton className="mx-auto h-6 w-96 rounded-xl" />
    </div>
  );
}

function LeaderboardEntrySkeleton() {
  return (
    <div className="flex items-center justify-between p-6 bg-white/50 rounded-2xl border border-gray-100">
      <div className="flex items-center gap-6">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </div>
      </div>
      <Skeleton className="h-12 w-32 rounded-2xl" />
    </div>
  );
}

function StatsCardSkeleton() {
  return (
    <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white/80 p-8">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <Skeleton className="h-20 w-20 rounded-2xl" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-48 rounded-xl" />
            <Skeleton className="h-12 w-40 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <Skeleton className="h-24 w-32 rounded-2xl" />
          <Skeleton className="h-24 w-32 rounded-2xl" />
        </div>
      </div>
    </Card>
  );
}

function PodiumCard({ student, isCurrentUser }: { student: LeaderboardEntry; isCurrentUser: boolean }) {
  const getPodiumConfig = (rank: number) => {
    if (rank === 1) return {
      height: "h-40",
      width: "w-32",
      bgGradient: "from-yellow-300 via-yellow-400 to-yellow-600",
      shadowColor: "shadow-yellow-500/50",
      borderGradient: "from-yellow-200 to-yellow-400",
      avatarRing: "ring-yellow-400",
      badgeGradient: "from-yellow-500 to-amber-600",
      glowColor: "shadow-yellow-400/60",
      position: "relative z-20",
      scale: "scale-110",
      icon: <Crown className="h-8 w-8 text-yellow-600" />,
      title: "Şampiyon"
    };
    if (rank === 2) return {
      height: "h-32",
      width: "w-28",
      bgGradient: "from-slate-300 via-slate-400 to-slate-600",
      shadowColor: "shadow-slate-500/50",  
      borderGradient: "from-slate-200 to-slate-400",
      avatarRing: "ring-slate-400",
      badgeGradient: "from-slate-500 to-slate-700",
      glowColor: "shadow-slate-400/60",
      position: "relative z-10",
      scale: "scale-105",
      icon: <Medal className="h-7 w-7 text-slate-600" />,
      title: "İkinci"
    };
    if (rank === 3) return {
      height: "h-28",
      width: "w-26",
      bgGradient: "from-orange-300 via-orange-400 to-orange-600",
      shadowColor: "shadow-orange-500/50",
      borderGradient: "from-orange-200 to-orange-400", 
      avatarRing: "ring-orange-400",
      badgeGradient: "from-orange-500 to-red-600",
      glowColor: "shadow-orange-400/60",
      position: "relative z-10",
      scale: "scale-105",
      icon: <Medal className="h-7 w-7 text-orange-600" />,
      title: "Üçüncü"
    };
    return {
      height: "h-24", width: "w-24", bgGradient: "from-blue-400 to-blue-600",
      shadowColor: "shadow-blue-500/50", borderGradient: "from-blue-200 to-blue-400",
      avatarRing: "ring-blue-400", badgeGradient: "from-blue-500 to-blue-700",
      glowColor: "shadow-blue-400/60", position: "relative", scale: "scale-100",
      icon: <Trophy className="h-6 w-6 text-blue-600" />, title: "En İyi Performans"
    };
  };

  const config = getPodiumConfig(student.rank);

  return (
    <div className={cn("flex flex-col items-center transition-all duration-500 hover:scale-105", config.position)}>
      {/* Floating Icon */}
      <div className="relative mb-6">
        <div className={cn(
          "absolute -top-6 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-2 shadow-lg",
          "animate-bounce"
        )}>
          {config.icon}
        </div>
        
        {/* Main Avatar */}
        <div className={cn("relative", config.scale)}>
          <Avatar className={cn(
            "h-20 w-20 ring-4 ring-white shadow-2xl transition-all duration-300",
            config.avatarRing,
            config.glowColor
          )}>
            <AvatarFallback className={cn(
              "text-2xl font-bold text-white bg-gradient-to-br text-shadow-sm",
              config.bgGradient
            )}>
              {getDisplayName(student).charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          {/* Floating Sparkles - Better positioning */}
          <div className="absolute -top-2 -right-3 animate-pulse">
            <Sparkles className="h-4 w-4 text-yellow-400" />
          </div>
          <div className="absolute -bottom-2 -left-3 animate-pulse delay-500">
            <Star className="h-3 w-3 text-blue-400" />
          </div>
        </div>
      </div>
      
      {/* Student Info Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 mb-4 shadow-xl border border-white/20 min-w-[180px]">
        <div className="text-center">
          <div className={cn(
            "text-xs font-semibold uppercase tracking-wider mb-1",
            student.rank === 1 ? "text-yellow-600" :
            student.rank === 2 ? "text-slate-600" :
            "text-orange-600"
          )}>
            {config.title}
          </div>
          <h3 className="font-bold text-lg text-gray-900 mb-2">
            {isCurrentUser ? "Siz ✨" : getDisplayName(student)}
          </h3>
          <div className="flex justify-center mb-3">
            <LevelBadge points={student.experience} className="text-xs" />
          </div>
          
          {/* Experience Badge */}
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white shadow-lg",
            `bg-gradient-to-r ${config.badgeGradient}`
          )}>
            <Zap className="h-4 w-4" />
            {student.experience.toLocaleString()} TP
          </div>
        </div>
      </div>

      {/* Podium Base with 3D Effect */}
      <div className="relative">
        {/* Shadow/Base */}
        <div className={cn(
          "absolute top-2 left-2 rounded-t-2xl opacity-30",
          config.height,
          config.width,
          "bg-gray-400"
        )}></div>
        
        {/* Main Podium */}
        <div className={cn(
          "rounded-t-2xl bg-gradient-to-t flex flex-col items-center justify-end pb-4 shadow-2xl border-t-4",
          config.height,
          config.width,
          config.bgGradient,
          config.shadowColor,
          `border-gradient-to-r ${config.borderGradient}`,
          "relative overflow-hidden"
        )}>
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shine"></div>
          
          {/* Rank Number */}
          <div className="text-4xl font-black text-white drop-shadow-lg">
            #{student.rank}
          </div>
          
          {/* Decorative Pattern */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-2 left-2 w-2 h-2 bg-white rounded-full"></div>
            <div className="absolute top-4 right-3 w-1 h-1 bg-white rounded-full"></div>
            <div className="absolute bottom-8 left-3 w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getDisplayName(user: {
  firstName: string | null;
  lastName: string | null;
  username: string;
}) {
  return user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.username;
}

export default function StudentLeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRanking | null>(null);
  const [scope, setScope] = useState<'all' | 'group'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (currentScope: 'all' | 'group') => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/leaderboard?scope=${currentScope}`, {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error("Liderlik tablosu yüklenemedi");
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
      fetchData(scope);
    }
  }, [user, scope]);

  function getRankIcon(rank: number) {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-500" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-orange-500" />;
    return null;
  }

  function getMotivationalMessage(rank: number, total: number) {
    const percentage = (rank / total) * 100;
    if (rank === 1) return "🏆 Tebrikler! Liderlik tablosunda zirvedesiniz!";
    if (rank <= 3) return "🥉 Harika! İlk 3'te yer alıyorsunuz!";
    if (percentage <= 10) return `⭐ Mükemmel! En iyi %10'da yerinizi aldınız!`;
    if (percentage <= 25) return `🎯 Çok iyi! En başarılı %25'te yer alıyorsunuz!`;
    if (percentage <= 50) return `💪 Güzel bir ilerleme! Daha da yukarı çıkabilirsiniz!`;
    return `🚀 Yolculuğunuz başladı! Çalışmaya devam edin!`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <HeaderSkeleton />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
          <Card className="border-0 shadow-lg">
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <LeaderboardEntrySkeleton key={i} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="p-6 text-red-700 bg-red-50/80 backdrop-blur-sm rounded-2xl border border-red-200 shadow-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Split leaderboard into top 3 and rest
  const topThree = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);

  // Arrange top three in podium order: [2nd, 1st, 3rd]
  const podiumOrder = topThree.length >= 3 ? [topThree[1], topThree[0], topThree[2]] : 
                     topThree.length === 2 ? [null, topThree[0], topThree[1]] :
                     topThree.length === 1 ? [null, topThree[0], null] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-r from-pink-400/10 to-yellow-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-gradient-to-r from-green-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Enhanced Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl shadow-lg">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Liderlik Tablosu
              </h1>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {scope === 'all' 
                ? 'En başarılı öğrenciler arasında yerinizi keşfedin ve hedefinize doğru ilerleyin'
                : `Grubunuzdaki arkadaşlarınız arasındaki yerinizi görün${leaderboard[0]?.tutor ? ` (Rehber: ${leaderboard[0].tutor.firstName} ${leaderboard[0].tutor.lastName})` : ''}`
              }
            </p>
          </div>

          {/* Scope Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/40 shadow-xl flex gap-1">
              <button
                onClick={() => setScope('all')}
                className={cn(
                  "px-8 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2",
                  scope === 'all'
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200 scale-105"
                    : "text-gray-500 hover:bg-white/80 hover:text-indigo-600"
                )}
              >
                <Users className="h-5 w-5" />
                Genel Sıralama
              </button>
              <button
                onClick={() => setScope('group')}
                className={cn(
                  "px-8 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2",
                  scope === 'group'
                    ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-200 scale-105"
                    : "text-gray-500 hover:bg-white/80 hover:text-teal-600"
                )}
              >
                <Award className="h-5 w-5" />
                Grubum
              </button>
            </div>
          </div>

          {/* Enhanced Personal Rank Card */}
          {userRank && (
            <div className="relative">
              <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-lg">
                <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"></div>
                <CardHeader className="pb-6 bg-gradient-to-r from-purple-50/50 to-pink-50/50">
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                    Sizin Performansınız
                    <div className="ml-auto">
                      <Target className="h-6 w-6 text-purple-500" />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="flex flex-col lg:flex-row items-center gap-6">
                      <div className="relative">
                        <div className={cn(
                          "w-20 h-20 rounded-2xl flex items-center justify-center font-black text-white shadow-xl",
                          "bg-gradient-to-br transition-transform hover:scale-105",
                          userRank.rank === 1 ? "from-yellow-400 to-yellow-600 shadow-yellow-500/50" :
                          userRank.rank === 2 ? "from-slate-400 to-slate-600 shadow-slate-500/50" :
                          userRank.rank === 3 ? "from-orange-400 to-orange-600 shadow-orange-500/50" :
                          "from-purple-500 to-indigo-600 shadow-purple-500/50"
                        )}>
                          <span className="text-2xl">#{userRank.rank}</span>
                        </div>
                        {getRankIcon(userRank.rank) && (
                          <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg">
                            {getRankIcon(userRank.rank)}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 animate-bounce">
                          <Sparkles className="h-5 w-5 text-purple-500" />
                        </div>
                      </div>
                      
                      <div className="text-center lg:text-left">
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                          {user?.firstName} {user?.lastName}
                        </h3>
                        <p className="text-lg text-gray-700 mb-4 max-w-md">
                          {getMotivationalMessage(userRank.rank, leaderboard.length)}
                        </p>
                        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl px-6 py-3 shadow-inner">
                          <Star className="h-5 w-5 text-purple-600" />
                          <span className="text-lg font-bold text-purple-900">
                            {userRank.experience.toLocaleString()} Tecrübe Puanı
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-inner">
                        <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-sm font-medium text-blue-600 mb-1">Sıralama</div>
                        <div className="text-3xl font-black text-blue-900">
                          {userRank.rank}
                          <span className="text-lg text-blue-600">/{leaderboard.length}</span>
                        </div>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl shadow-inner">
                        <Target className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                        <div className="text-sm font-medium text-emerald-600 mb-1">Üst Yüzde</div>
                        <div className="text-3xl font-black text-emerald-900">
                          %{Math.round((userRank.rank / leaderboard.length) * 100)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Enhanced Top 5 Podium - Complete Redesign */}
          {topThree.length > 0 && (
            <div className="relative">
              <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-gradient-to-br from-yellow-50/50 via-orange-50/50 to-red-50/50 backdrop-blur-lg">
                <div className="h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>
                <CardHeader className="pb-8 bg-gradient-to-r from-yellow-50/30 via-orange-50/30 to-red-50/30">
                  <div className="text-center">
                    <CardTitle className="text-4xl font-black flex items-center justify-center gap-4 mb-4">
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-xl animate-pulse">
                        <Trophy className="h-10 w-10" />
                      </div>
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600">
                        {scope === 'all' ? 'Şeref Listesi' : 'Grup Şeref Listesi'}
                      </span>
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl animate-pulse delay-1000">
                        <Crown className="h-10 w-10" />
                      </div>
                    </CardTitle>
                    <CardDescription className="text-xl text-orange-700 font-semibold">
                      Liderlik tablosunun efsanevi zirve üçlüsü ✨
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {/* Top 5 Enhanced Podium */}
                  <div className="relative px-4 sm:px-8 pb-12 pt-8">
                    {/* Background decorative elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="absolute top-0 left-1/4 w-64 h-64 bg-gradient-to-r from-yellow-200/20 to-orange-200/20 rounded-full blur-3xl animate-pulse"></div>
                      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-r from-orange-200/20 to-red-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                    </div>

                    {/* Main Podium - Top 3 */}
                    <div className="relative mb-16">
                      <h3 className="text-2xl font-bold text-center mb-8 text-gray-800">🏆 Podyum 🏆</h3>
                      <div className="flex justify-center items-end gap-6 lg:gap-12 max-w-6xl mx-auto">

                        {/* 2nd Place */}
                        {podiumOrder[0] && (
                          <div className="flex flex-col items-center relative">
                            {/* Floating effects */}
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                              <Medal className="h-8 w-8 text-gray-500" />
                            </div>

                            {/* Student Card */}
                            <div className="relative mb-6 transform hover:scale-110 transition-all duration-500">
                              <div className="w-36 bg-gradient-to-br from-gray-50 to-slate-100 border-4 border-gray-300 rounded-2xl p-4 shadow-2xl hover:shadow-gray-500/50">
                                <div className="text-center">
                                  <Avatar className="h-20 w-20 mx-auto mb-3 ring-4 ring-gray-300 shadow-xl">
                                    <AvatarFallback className="bg-gradient-to-br from-gray-200 to-gray-400 text-gray-800 text-2xl font-black">
                                      {getDisplayName(podiumOrder[0]).charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <h3 className="font-black text-gray-900 text-lg mb-1 truncate">
                                    {podiumOrder[0].id === user?.id ? "Siz 🌟" : getDisplayName(podiumOrder[0])}
                                  </h3>
                                  <p className="text-sm text-gray-600 mb-3 truncate">@{podiumOrder[0].username}</p>
                                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-xl text-sm font-bold mb-2">
                                    {podiumOrder[0].experience} XP
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Podium Base */}
                            <div className="relative">
                              <div className="w-32 h-24 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-2xl shadow-2xl flex items-center justify-center border-t-4 border-gray-200">
                                <div className="text-center">
                                  <div className="text-3xl font-black text-gray-800 drop-shadow-lg">2</div>
                                  <div className="text-sm font-bold text-gray-700">İKİNCİ</div>
                                </div>
                              </div>
                              {/* Shine effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-t-2xl animate-pulse"></div>
                            </div>
                          </div>
                        )}

                        {/* 1st Place */}
                        {podiumOrder[1] && (
                          <div className="flex flex-col items-center relative z-10">
                            {/* Floating crown */}
                            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 animate-bounce">
                              <Crown className="h-12 w-12 text-yellow-500" />
                            </div>

                            {/* Sparkles around winner */}
                            <div className="absolute -top-4 -left-4 animate-pulse">
                              <Sparkles className="h-6 w-6 text-yellow-400" />
                            </div>
                            <div className="absolute -top-4 -right-4 animate-pulse delay-500">
                              <Star className="h-6 w-6 text-orange-400" />
                            </div>

                            {/* Student Card */}
                            <div className="relative mb-8 transform hover:scale-115 transition-all duration-500">
                              <div className="w-44 bg-gradient-to-br from-yellow-50 to-orange-100 border-4 border-yellow-400 rounded-2xl p-6 shadow-2xl hover:shadow-yellow-500/50">
                                <div className="text-center">
                                  <div className="relative">
                                    <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-yellow-400 shadow-2xl">
                                      <AvatarFallback className="bg-gradient-to-br from-yellow-300 to-orange-400 text-yellow-900 text-3xl font-black">
                                        {getDisplayName(podiumOrder[1]).charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                      <Crown className="h-5 w-5 text-white" />
                                    </div>
                                  </div>
                                  <h3 className="font-black text-gray-900 text-xl mb-2 truncate">
                                    {podiumOrder[1].id === user?.id ? "Siz 🏆" : getDisplayName(podiumOrder[1])}
                                  </h3>
                                  <p className="text-base text-gray-700 mb-4 truncate">@{podiumOrder[1].username}</p>
                                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl text-lg font-bold mb-3 shadow-lg">
                                    {podiumOrder[1].experience} XP
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Winner Podium Base */}
                            <div className="relative">
                              <div className="w-40 h-32 bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t-2xl shadow-2xl flex items-center justify-center border-t-4 border-yellow-200">
                                <div className="text-center">
                                  <div className="text-4xl font-black text-yellow-900 drop-shadow-lg">1</div>
                                  <div className="text-lg font-bold text-yellow-800">ŞAMPIYON</div>
                                </div>
                              </div>
                              {/* Golden shine effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/50 to-transparent rounded-t-2xl animate-pulse"></div>
                            </div>
                          </div>
                        )}

                        {/* 3rd Place */}
                        {podiumOrder[2] && (
                          <div className="flex flex-col items-center relative">
                            {/* Floating medal */}
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-bounce delay-500">
                              <Medal className="h-8 w-8 text-amber-600" />
                            </div>

                            {/* Student Card */}
                            <div className="relative mb-6 transform hover:scale-110 transition-all duration-500">
                              <div className="w-36 bg-gradient-to-br from-amber-50 to-yellow-100 border-4 border-amber-400 rounded-2xl p-4 shadow-2xl hover:shadow-amber-500/50">
                                <div className="text-center">
                                  <Avatar className="h-20 w-20 mx-auto mb-3 ring-4 ring-amber-400 shadow-xl">
                                    <AvatarFallback className="bg-gradient-to-br from-amber-200 to-amber-400 text-amber-900 text-2xl font-black">
                                      {getDisplayName(podiumOrder[2]).charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <h3 className="font-black text-gray-900 text-lg mb-1 truncate">
                                    {podiumOrder[2].id === user?.id ? "Siz 🥉" : getDisplayName(podiumOrder[2])}
                                  </h3>
                                  <p className="text-sm text-gray-600 mb-3 truncate">@{podiumOrder[2].username}</p>
                                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-xl text-sm font-bold mb-2">
                                    {podiumOrder[2].experience} XP
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Bronze Podium Base */}
                            <div className="relative">
                              <div className="w-32 h-20 bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-2xl shadow-2xl flex items-center justify-center border-t-4 border-amber-200">
                                <div className="text-center">
                                  <div className="text-3xl font-black text-amber-900 drop-shadow-lg">3</div>
                                  <div className="text-sm font-bold text-amber-800">ÜÇÜNCÜ</div>
                                </div>
                              </div>
                              {/* Bronze shine effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/40 to-transparent rounded-t-2xl animate-pulse"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Top 5 - 4th and 5th Place */}
                    {leaderboard.length > 3 && (
                      <div className="mt-12">
                        <h4 className="text-2xl font-bold text-center mb-8 text-gray-800">⭐ En İyi 5 ⭐</h4>
                        <div className="flex justify-center gap-8 max-w-4xl mx-auto">
                          {leaderboard.slice(3, 5).map((student, index) => (
                            <div key={student.id} className="flex flex-col items-center relative transform hover:scale-105 transition-all duration-500">
                              {/* Floating star */}
                              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 animate-bounce" style={{animationDelay: `${index * 200}ms`}}>
                                <Award className="h-6 w-6 text-indigo-500" />
                              </div>

                              {/* Student Card */}
                              <div className="w-32 bg-gradient-to-br from-indigo-50 to-purple-100 border-3 border-indigo-300 rounded-xl p-4 shadow-xl hover:shadow-indigo-500/30">
                                <div className="text-center">
                                  <div className="w-8 h-8 mx-auto mb-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold text-sm">{index + 4}</span>
                                  </div>
                                  <Avatar className="h-16 w-16 mx-auto mb-2 ring-3 ring-indigo-300 shadow-lg">
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-200 to-purple-300 text-indigo-900 text-lg font-bold">
                                      {getDisplayName(student).charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">
                                    {student.id === user?.id ? "Siz ⭐" : getDisplayName(student)}
                                  </h3>
                                  <p className="text-xs text-gray-600 mb-2 truncate">@{student.username}</p>
                                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-lg text-xs font-bold mb-1">
                                    {student.experience} XP
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional visual enhancements */}
                    {leaderboard.length > 5 && (
                      <div className="mt-12 text-center">
                        <div className="text-lg text-gray-600 font-semibold bg-gradient-to-r from-gray-100 to-gray-200 rounded-full px-6 py-3 inline-block shadow-lg">
                          ve {leaderboard.length - 5} öğrenci daha yarışıyor... 🎯
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Enhanced Rest of Leaderboard */}
          {restOfLeaderboard.length > 0 && (
            <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white/70 backdrop-blur-xl">
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
              <CardHeader className="bg-gradient-to-r from-indigo-50/30 to-purple-50/30">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  {scope === 'all' ? 'Yükselen Yıldızlar (4. Sırada ve Sonrası)' : 'Grup Sıralaması (Devamı)'}
                </CardTitle>
                <CardDescription className="text-lg">
                  Zirveye doğru yolculuklarını sürdüren yetenekli öğrenciler
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-2 p-6">
                  {restOfLeaderboard.map((student, index) => {
                    const isCurrentUser = student.id === user?.id;

                    return (
                      <div
                        key={student.id}
                        className={cn(
                          "flex items-center justify-between p-6 rounded-2xl transition-all duration-300",
                          "hover:shadow-lg hover:scale-[1.02] bg-white/50 backdrop-blur-sm",
                          isCurrentUser && "bg-gradient-to-r from-purple-100/80 to-pink-100/80 border-2 border-purple-300 shadow-lg",
                          !isCurrentUser && "hover:bg-white/80"
                        )}
                      >
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-md",
                              isCurrentUser ? 
                                "bg-gradient-to-r from-purple-500 to-pink-500 text-white" :
                                "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700"
                            )}>
                              #{student.rank}
                            </div>
                            {isCurrentUser && (
                              <div className="absolute -top-1 -right-1 animate-pulse">
                                <Star className="h-4 w-4 text-yellow-500" />
                              </div>
                            )}
                          </div>
                          
                          <Avatar className="h-14 w-14 ring-4 ring-white shadow-lg">
                            <AvatarFallback className={cn(
                              "text-lg font-bold",
                              isCurrentUser ? 
                                "bg-gradient-to-br from-purple-400 to-pink-500 text-white" : 
                                "bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700"
                            )}>
                              {getDisplayName(student).charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex flex-col">
                            <span className="font-bold text-lg text-gray-900">
                              {isCurrentUser ? "Siz 🌟" : getDisplayName(student)}
                            </span>
                            <LevelBadge
                              points={student.experience}
                              showProgress={isCurrentUser}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={cn(
                            "inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-lg font-bold shadow-lg",
                            "bg-gradient-to-r from-emerald-500 to-teal-600 text-white",
                            "hover:from-emerald-400 hover:to-teal-500 transition-all duration-300"
                          )}>
                            <Zap className="h-5 w-5" />
                            {student.experience.toLocaleString()} TP
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 text-center py-6">
                <div className="w-full text-lg text-gray-600 font-medium">
                  Gösterilen: {Math.min(25, leaderboard.length)} / {leaderboard.length} öğrenci
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        .animate-shine {
          animation: shine 2s infinite;
        }
      `}</style>
    </div>
  );
}
