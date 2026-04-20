'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock, Star, Trophy, Settings, User, Users, FileText, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import CurrentPeriod from '@/app/components/CurrentPeriod';
import { useUserMeetings } from '@/app/hooks/use-meetings';
import { useCurrentUser, useLeaderboard, useEvents, usePoints, useRequests } from '@/app/hooks/use-student-dashboard';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { calculateLevelInfo, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Bell, ChevronRight, Zap, Award, ExternalLink } from 'lucide-react';

type StudentStats = {
  points: number;
  rank: number;
  totalStudents: number;
  pendingRequests: number;
  approvedRequests: number;
};

type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  createdBy: {
    username: string;
    firstName?: string;
    lastName?: string;
  };
};

type PointHistory = {
  id: string;
  points: number;
  type: string;
  reason: string;
  createdAt: string;
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: {
    firstName: string | null;
    lastName: string | null;
  };
};

function LoadingDashboard() {
  return (
    <div className="min-h-screen bg-gray-50/50 pb-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-100 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Skeleton className="h-8 sm:h-10 w-64 mb-2 rounded-lg" />
              <Skeleton className="h-4 w-48 rounded-md" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-28 rounded-xl" />
              <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">
            
            {/* Period & Stats Card Skeleton */}
            <Card className="overflow-hidden border-0 shadow-xl bg-white rounded-3xl">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-6 sm:p-8 border-b md:border-b-0 md:border-r border-gray-100 space-y-6">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-48 rounded-2xl" />
                </div>
                <div className="flex-1 p-6 sm:p-8 grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Events Section Skeleton */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <Skeleton className="h-8 w-48 rounded-lg" />
                <Skeleton className="h-4 w-20 rounded-md" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-0 shadow-lg rounded-2xl p-5 space-y-4">
                    <Skeleton className="h-5 w-16 rounded-lg" />
                    <Skeleton className="h-6 w-full rounded-md" />
                    <Skeleton className="h-10 w-full rounded-md" />
                    <div className="pt-4 border-t border-gray-50 flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-7 w-7 rounded-lg" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Announcements Skeleton */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <Skeleton className="h-8 w-40 rounded-lg" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
              {[1, 2].map((i) => (
                <Card key={i} className="border-0 shadow-lg rounded-3xl p-6 space-y-4">
                  <div className="flex justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-6 w-1/2 rounded-md" />
                      <Skeleton className="h-16 w-full rounded-md" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-2xl ml-4" />
                  </div>
                  <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-0 shadow-2xl rounded-3xl bg-indigo-600/10 p-6 space-y-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-2xl bg-indigo-200/50" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 bg-indigo-200/50" />
                  <Skeleton className="h-3 w-40 bg-indigo-200/50" />
                </div>
              </div>
              <Skeleton className="h-16 w-full rounded-2xl bg-indigo-200/50" />
              <Skeleton className="h-14 w-full rounded-2xl bg-white" />
            </Card>

            <Card className="border-0 shadow-lg rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="h-3 w-10 rounded-md" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
              </div>
            </Card>

            <Card className="border-0 shadow-lg rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <Skeleton className="h-5 w-28 rounded-md" />
                <Skeleton className="h-4 w-4 rounded-md" />
              </div>
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-2 w-12" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Meetings Section Skeleton */}
        <div className="mt-8">
          <Card className="border-0 shadow-md rounded-3xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-md" />
                <Skeleton className="h-6 w-48 rounded-md" />
              </div>
            </div>
            <div className="p-4 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="border border-gray-100 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-1/3 rounded-md" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full rounded-md" />
                  <div className="flex gap-4 pt-2">
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-4 w-20 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user: authUser, isStudent } = useAuth();
  const router = useRouter();

  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const { data: leaderboardData, isLoading: leaderboardLoading } = useLeaderboard();
  const { data: eventsData, isLoading: eventsLoading } = useEvents();
  const { data: pointsData, isLoading: pointsLoading } = usePoints();
  const { data: requestsData, isLoading: requestsLoading } = useRequests();
  const { data: userMeetings, isLoading: meetingsLoading } = useUserMeetings();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch("/api/announcements");
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setAnnouncements(data.slice(0, 3));
          }
        }
      } catch (error) {
        console.error("Error fetching announcements:", error);
      } finally {
        setAnnouncementsLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const loading = userLoading || leaderboardLoading || eventsLoading || pointsLoading || requestsLoading || meetingsLoading || announcementsLoading;

  if (loading) {
    return <LoadingDashboard />;
  }

  // Derived state
  const currentUser = userData?.user;

  // Find user's rank
  const userRank = leaderboardData?.leaderboard.findIndex(
    (student) => student.id === currentUser?.id
  ) ?? -1;
  const rank = userRank !== -1 ? userRank + 1 : 0;

  const pendingRequests = requestsData?.requests.filter(
    (req) => req.status === 'pending'
  ).length || 0;

  const approvedRequests = requestsData?.requests.filter(
    (req) => req.status === 'approved'
  ).length || 0;

  const stats: StudentStats = {
    points: currentUser?.points || 0,
    rank: rank,
    totalStudents: leaderboardData?.leaderboard.length || 0,
    pendingRequests,
    approvedRequests,
  };

  // Filter for upcoming events (today and future)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = eventsData?.events
    .filter((event) => new Date(event.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3) || [];

  // Get recent point history (last 5 transactions)
  const recentPoints = pointsData?.transactions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5) || [];

  // Level calculation
  const levelInfo = calculateLevelInfo(stats.points);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-8">
      {/* Dynamic Header */}
      <div className="bg-white border-b border-gray-100 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-6">
          <div className="flex justify-between items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 leading-tight">
                Hoş geldin, <span className="text-indigo-600 font-extrabold">{currentUser?.firstName || currentUser?.username}</span> 👋
              </h1>
              <p className="text-gray-500 mt-0.5 text-xs sm:text-sm hidden sm:block">İşte senin için güncel durum özeti</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/part7/student/profile"
                className="p-2 sm:px-4 sm:py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2 font-medium"
              >
                <User className="h-5 w-5" />
                <span className="hidden sm:inline">Profilim</span>
              </Link>
              <Link
                href="/dashboard/part7/student/settings"
                className="p-2 sm:px-4 sm:py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 font-medium shadow-sm"
              >
                <Settings className="h-5 w-5" />
                <span className="hidden sm:inline">Ayarlar</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">
            
            {/* Period & Stats Consolidated Card */}
            <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-indigo-50/30 rounded-3xl">
              {/* Mobile: compact period bar */}
              <div className="md:hidden flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-indigo-50/50">
                <Calendar className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="text-xs font-bold text-indigo-700">2025-2026 Kış Dönemi</span>
                <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <Clock className="h-3 w-3" />
                  142 gün kaldı
                </span>
              </div>

              <div className="flex flex-col md:flex-row">
                {/* Period Section - desktop only */}
                <div className="hidden md:flex flex-1 p-8 border-r border-gray-100 flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Mevcut Dönem</h3>
                      <p className="text-lg font-black text-gray-900 leading-tight">2025-2026 Kış Dönemi</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 bg-white/60 p-3 rounded-2xl border border-white">
                    <Clock className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium">Bitişe 142 gün kaldı</span>
                  </div>
                </div>

                {/* Stats Section */}
                <div className="flex-1 p-4 sm:p-5 md:p-8 grid grid-cols-2 gap-3">
                  <div className="p-3 md:p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center md:gap-3 mb-1">
                      <div className="p-1.5 md:p-2 bg-violet-100 rounded-lg group-hover:bg-violet-200 transition-colors w-fit">
                        <Star className="h-3 w-3 md:h-4 md:w-4 text-violet-600" />
                      </div>
                      <span className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-tight mt-1 md:mt-0">Puan</span>
                    </div>
                    <div className="text-lg md:text-2xl font-black text-gray-900">{stats.points}</div>
                  </div>

                  <div className="p-3 md:p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center md:gap-3 mb-1">
                      <div className="p-1.5 md:p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors w-fit">
                        <Trophy className="h-3 w-3 md:h-4 md:w-4 text-emerald-600" />
                      </div>
                      <span className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-tight mt-1 md:mt-0">Sıra</span>
                    </div>
                    <div className="text-lg md:text-2xl font-black text-gray-900">#{stats.rank}</div>
                  </div>

                  <div className="p-3 md:p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center md:gap-3 mb-1">
                      <div className="p-1.5 md:p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors w-fit">
                        <Zap className="h-3 w-3 md:h-4 md:w-4 text-amber-600" />
                      </div>
                      <span className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-tight mt-1 md:mt-0">Seviye</span>
                    </div>
                    <div className="text-lg md:text-2xl font-black text-gray-900">{levelInfo.level}</div>
                  </div>

                  <div className="p-3 md:p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center md:gap-3 mb-1">
                      <div className="p-1.5 md:p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors w-fit">
                        <Award className="h-3 w-3 md:h-4 md:w-4 text-indigo-600" />
                      </div>
                      <span className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-tight mt-1 md:mt-0">Ünvan</span>
                    </div>
                    <div className="text-sm md:text-base font-bold text-gray-900 truncate">{levelInfo.title}</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Upcoming Events Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-indigo-500 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-900">Yaklaşan Etkinlikler</h2>
                </div>
                <Link
                  href="/dashboard/part7/student/events"
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group"
                >
                  Tümünü Gör
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {upcomingEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {upcomingEvents.map((event) => (
                    <Card key={event.id} className="group hover:border-indigo-200 transition-all border-0 shadow-lg rounded-2xl overflow-hidden bg-white">
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 font-bold px-2 py-0.5 rounded-lg text-xs">
                            ETKINLIK
                          </Badge>
                          <span className="text-xs text-gray-400 font-medium">#{event.id.slice(-4)}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">{event.title}</h4>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{event.description}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs font-bold">{format(new Date(event.date), 'd MMM', { locale: tr })}</span>
                          </div>
                          <Link href={`/dashboard/part7/student/events/${event.id}`} className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                             <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-0 shadow-lg p-12 text-center rounded-3xl bg-white">
                   <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-gray-50 rounded-full">
                      <Calendar className="h-10 w-10 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">Yakınlarda etkinlik bulunmuyor.</p>
                   </div>
                </Card>
              )}
            </section>

            {/* Announcements Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-teal-500 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-900">Duyurular</h2>
                </div>
                <Link
                  href="/dashboard/part7/student/announcements"
                  className="text-sm font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1 group"
                >
                  Duyuru Panosu
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="space-y-4">
                {announcements.length > 0 ? (
                  announcements.map((announcement) => (
                    <Card key={announcement.id} className="border-0 shadow-lg hover:shadow-xl transition-all rounded-3xl bg-white overflow-hidden border-l-8 border-l-teal-500">
                      <div className="p-6">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">{announcement.title}</h4>
                            <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">{announcement.content}</p>
                          </div>
                          <div className="p-3 bg-teal-50 rounded-2xl">
                             <Bell className="h-6 w-6 text-teal-600" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                              {announcement.createdBy.firstName?.[0] || 'O'}
                            </div>
                            <span className="text-sm font-semibold text-gray-700">{announcement.createdBy.firstName} {announcement.createdBy.lastName}</span>
                          </div>
                          <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full italic">
                            {format(new Date(announcement.createdAt), 'd MMMM yyyy', { locale: tr })}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-10 text-center border-0 shadow-lg rounded-3xl bg-white">
                    <p className="text-gray-500">Henüz bir duyuru paylaşılmadı.</p>
                  </Card>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Store Preview / Request Quick Link */}
            <Card className="overflow-hidden border-0 shadow-2xl rounded-3xl bg-indigo-600 text-white group">
              <div className="p-6">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <Star className="h-6 w-6 text-yellow-300" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Hediye Mağazası</h3>
                      <p className="text-indigo-100 text-xs">Puanlarını ödüllere dönüştür</p>
                    </div>
                 </div>
                 <div className="bg-white/10 rounded-2xl p-4 mb-6 text-center backdrop-blur-sm">
                    <span className="text-3xl font-black">{stats.points}</span>
                    <span className="text-indigo-200 text-sm ml-2 font-bold">PUAN</span>
                 </div>
                 <Link 
                  href="/dashboard/part7/student/store" 
                  className="w-full py-4 bg-white text-indigo-600 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all shadow-lg"
                 >
                    Mağazaya Git
                    <ArrowRight className="h-4 w-4" />
                 </Link>
              </div>
            </Card>



            {/* Recent Points Section - Made more compact */}
            <Card className="border-0 shadow-lg rounded-3xl bg-white overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-gray-900">Son Puanlar</h3>
                <Clock className="h-4 w-4 text-gray-400" />
              </div>
              <div className="divide-y divide-gray-50">
                {recentPoints.length > 0 ? (
                  recentPoints.map((transaction) => (
                    <div key={transaction.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                          transaction.type === 'AWARD' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        )}>
                          {transaction.type === 'AWARD' ? '+' : '-'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{transaction.reason}</p>
                          <p className="text-[10px] text-gray-400 font-medium uppercase">{format(new Date(transaction.createdAt), 'd MMM', { locale: tr })}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "font-black text-sm",
                        transaction.type === 'AWARD' ? "text-green-600" : "text-red-600"
                      )}>
                        {transaction.points}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400 text-sm">Hareket bulunmuyor.</div>
                )}
              </div>
            </Card>

            {/* Merged Requests and Wishes */}
            <Card className="border-0 shadow-lg rounded-3xl bg-white overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">İstek ve Dilekler</h3>
                <Link href="/dashboard/part7/student/requests" className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-wider">Tüm Talepler</Link>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-amber-50 rounded-2xl border border-amber-100">
                    <div className="text-xl font-black text-amber-600">{stats.pendingRequests}</div>
                    <div className="text-[10px] font-bold text-amber-500 uppercase">Bekliyor</div>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="text-xl font-black text-emerald-600">{stats.approvedRequests}</div>
                    <div className="text-[10px] font-bold text-emerald-500 uppercase">Onaylandı</div>
                  </div>
                </div>
                
                <Link 
                  href="/dashboard/part7/student/wishes"
                  className="w-full py-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all border border-indigo-100 text-xs"
                >
                  <FileText className="h-4 w-4" />
                  Dilek ve İstek Bildir
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* My Meetings Section - Only show if user has attended meetings */}
      {!meetingsLoading && userMeetings && userMeetings.length > 0 && (
        <div className="px-4 sm:px-6 mt-6 sm:mt-8">
          <Card className="border-0 shadow-md">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b">
              <div className="flex items-center">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500 mr-2" />
                <h2 className="text-base sm:text-lg font-medium">Katıldığım Toplantılar</h2>
              </div>
            </div>
            <div className="p-3 sm:p-4">
              <div className="space-y-3 sm:space-y-4">
                {userMeetings.slice(0, 5).map((meeting) => (
                  <div
                    key={meeting.id}
                    className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => router.push(`/dashboard/part1/meetings/${meeting.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-2">
                          {meeting.title}
                        </h3>
                        {meeting.description && (
                          <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                            {meeting.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                            {format(new Date(meeting.meetingDate), 'd MMMM yyyy, HH:mm', { locale: tr })}
                          </div>
                          {meeting.location && (
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                              {meeting.location}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                            {meeting._count?.attendees || 0} katılımcı
                          </div>
                          <div className="flex items-center">
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                            {meeting._count?.decisions || 0} karar
                          </div>
                        </div>
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${meeting.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          meeting.status === 'ONGOING' ? 'bg-blue-100 text-blue-700' :
                            meeting.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                          }`}>
                          {meeting.status === 'COMPLETED' ? 'Tamamlandı' :
                            meeting.status === 'ONGOING' ? 'Devam Ediyor' :
                              meeting.status === 'CANCELLED' ? 'İptal Edildi' :
                                'Planlandı'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {userMeetings.length > 5 && (
                  <div className="text-center pt-2">
                    <p className="text-sm text-gray-500">
                      +{userMeetings.length - 5} toplantı daha
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 