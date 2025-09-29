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
  Calendar,
  Zap,
  TrendingUp,
  Crown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { LevelBadge } from "@/components/LevelBadge";

interface Student {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  points: number;
  experience: number;
  rank: number;
}

interface TutorStudent {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
}

interface WeeklyTopEarner {
  rank: number;
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  weeklyPoints: number;
  weeklyExperience: number;
  totalExperience: number;
  tutor: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

interface LeaderboardContentProps {
  leaderboardData: Student[];
  tutorStudents: TutorStudent[];
  weeklyTopEarners: WeeklyTopEarner[];
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
function LeaderboardContent({ leaderboardData, tutorStudents, weeklyTopEarners }: LeaderboardContentProps) {
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
    avgExperience: myStudentsLeaderboard.length > 0 
      ? Math.round(myStudentsLeaderboard.reduce((sum: number, student: any) => sum + student.experience, 0) / myStudentsLeaderboard.length) 
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
                <p className="text-sm font-medium text-gray-500">Ortalama Deneyim</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.avgExperience}</h3>
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

      {/* Enhanced Weekly Top Earners Section - Top 5 Podium Design */}
      {weeklyTopEarners.length > 0 && (
        <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-gradient-to-br from-yellow-50/50 via-orange-50/50 to-red-50/50 backdrop-blur-lg">
          <div className="h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>
          <CardHeader className="pb-8 bg-gradient-to-r from-yellow-50/30 via-orange-50/30 to-red-50/30">
            <div className="text-center">
              <CardTitle className="text-4xl font-black flex items-center justify-center gap-4 mb-4">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-xl animate-pulse">
                  <Trophy className="h-10 w-10" />
                </div>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600">
                  Bu Haftanın Şampiyonları
                </span>
                <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl animate-pulse delay-1000">
                  <Crown className="h-10 w-10" />
                </div>
              </CardTitle>
              <CardDescription className="text-xl text-orange-700 font-semibold flex items-center justify-center gap-3">
                <Calendar className="h-6 w-6" />
                Bu hafta en çok puan ve deneyim kazanan öğrenciler
                <Zap className="h-6 w-6" />
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
                  {weeklyTopEarners[1] && (
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
                                {getDisplayName(weeklyTopEarners[1]).charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <h3 className="font-black text-gray-900 text-lg mb-1 truncate">
                              {getDisplayName(weeklyTopEarners[1])}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3 truncate">@{weeklyTopEarners[1].username}</p>
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-xl text-sm font-bold mb-2">
                              {weeklyTopEarners[1].weeklyExperience} XP
                            </div>
                            <div className="text-sm text-gray-600 font-semibold">
                              {weeklyTopEarners[1].weeklyPoints} puan
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
                  {weeklyTopEarners[0] && (
                    <div className="flex flex-col items-center relative z-10">
                      {/* Floating crown */}
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 animate-bounce">
                        <Crown className="h-12 w-12 text-yellow-500" />
                      </div>

                      {/* Sparkles around winner */}
                      <div className="absolute -top-4 -left-4 animate-pulse">
                        <Zap className="h-6 w-6 text-yellow-400" />
                      </div>
                      <div className="absolute -top-4 -right-4 animate-pulse delay-500">
                        <Zap className="h-6 w-6 text-orange-400" />
                      </div>

                      {/* Student Card */}
                      <div className="relative mb-8 transform hover:scale-115 transition-all duration-500">
                        <div className="w-44 bg-gradient-to-br from-yellow-50 to-orange-100 border-4 border-yellow-400 rounded-2xl p-6 shadow-2xl hover:shadow-yellow-500/50">
                          <div className="text-center">
                            <div className="relative">
                              <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-yellow-400 shadow-2xl">
                                <AvatarFallback className="bg-gradient-to-br from-yellow-300 to-orange-400 text-yellow-900 text-3xl font-black">
                                  {getDisplayName(weeklyTopEarners[0]).charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                <Crown className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <h3 className="font-black text-gray-900 text-xl mb-2 truncate">
                              {getDisplayName(weeklyTopEarners[0])}
                            </h3>
                            <p className="text-base text-gray-700 mb-4 truncate">@{weeklyTopEarners[0].username}</p>
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl text-lg font-bold mb-3 shadow-lg">
                              {weeklyTopEarners[0].weeklyExperience} XP
                            </div>
                            <div className="text-lg text-orange-600 font-black mb-2">
                              {weeklyTopEarners[0].weeklyPoints} puan
                            </div>
                            <div className="text-sm text-gray-600 font-semibold">
                              Toplam: {weeklyTopEarners[0].totalExperience}
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
                  {weeklyTopEarners[2] && (
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
                                {getDisplayName(weeklyTopEarners[2]).charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <h3 className="font-black text-gray-900 text-lg mb-1 truncate">
                              {getDisplayName(weeklyTopEarners[2])}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3 truncate">@{weeklyTopEarners[2].username}</p>
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-xl text-sm font-bold mb-2">
                              {weeklyTopEarners[2].weeklyExperience} XP
                            </div>
                            <div className="text-sm text-gray-600 font-semibold">
                              {weeklyTopEarners[2].weeklyPoints} puan
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
              {weeklyTopEarners.length > 3 && (
                <div className="mt-12">
                  <h4 className="text-2xl font-bold text-center mb-8 text-gray-800">⭐ En İyi 5 ⭐</h4>
                  <div className="flex justify-center gap-8 max-w-4xl mx-auto">
                    {weeklyTopEarners.slice(3, 5).map((earner, index) => (
                      <div key={earner.id} className="flex flex-col items-center relative transform hover:scale-105 transition-all duration-500">
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
                                {getDisplayName(earner).charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">
                              {getDisplayName(earner)}
                            </h3>
                            <p className="text-xs text-gray-600 mb-2 truncate">@{earner.username}</p>
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-lg text-xs font-bold mb-1">
                              {earner.weeklyExperience} XP
                            </div>
                            <div className="text-xs text-gray-600 font-semibold">
                              {earner.weeklyPoints} puan
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Remaining Top Earners */}
              {weeklyTopEarners.length > 5 && (
                <div className="mt-12">
                  <h4 className="text-xl font-semibold text-center mb-6 text-gray-700">🌟 Diğer Başarılı Öğrenciler 🌟</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 max-w-6xl mx-auto">
                    {weeklyTopEarners.slice(5, 11).map((earner, index) => (
                      <div
                        key={earner.id}
                        className="bg-gradient-to-br from-slate-50 to-gray-100 border-2 border-slate-200 rounded-xl p-3 hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-slate-300"
                      >
                        <div className="text-center">
                          <div className="w-6 h-6 mx-auto mb-2 bg-gradient-to-r from-slate-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {index + 6}
                          </div>
                          <Avatar className="h-10 w-10 mx-auto mb-2">
                            <AvatarFallback className="bg-slate-200 text-slate-800 text-sm font-bold">
                              {getDisplayName(earner).charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <h3 className="font-semibold text-gray-900 text-xs mb-1 truncate">
                            {getDisplayName(earner)}
                          </h3>
                          <div className="text-xs font-bold text-green-600 mb-1">
                            {earner.weeklyExperience} XP
                          </div>
                          <div className="text-xs text-gray-500">
                            {earner.weeklyPoints} puan
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {weeklyTopEarners.length > 11 && (
                    <div className="text-center mt-6">
                      <div className="text-lg text-gray-600 font-semibold bg-gray-100 rounded-full px-6 py-2 inline-block">
                        ve {weeklyTopEarners.length - 11} öğrenci daha... 🎯
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Deneyim</th>
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
                                <LevelBadge 
                                  points={student.experience}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm">
                              {student.experience}
                            </span>
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
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Deneyim</th>
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
                              <LevelBadge 
                                points={student.experience}
                                className="mt-1"
                              />
                              {tutorStudents.some((tutorStudent: any) => tutorStudent.id === student.id) && (
                                <span className="text-xs text-indigo-600">Sizin öğrenciniz</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm">
                            {student.experience}
                          </span>
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

function LoadingLeaderboard() {
  return (
    <div className="space-y-8 p-8">
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
                  Deneyim
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
  const [weeklyTopEarners, setWeeklyTopEarners] = useState<WeeklyTopEarner[]>([]);

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

      // Fetch weekly top earners
      const weeklyRes = await fetch('/api/leaderboard/weekly-top-earners', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (weeklyRes.ok) {
        const weeklyJson = await weeklyRes.json();
        setWeeklyTopEarners(weeklyJson.weeklyLeaderboard || []);
      }
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
        weeklyTopEarners={weeklyTopEarners}
      />
    </div>
  );
} 