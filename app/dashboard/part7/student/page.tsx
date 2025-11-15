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
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

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

function LoadingDashboard() {
  return (
    <div className="p-4 md:p-6">
      <Skeleton className="h-10 w-48 mb-6" />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Points Card Skeleton */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24 bg-white/20" />
              <Skeleton className="h-5 w-5 rounded-full bg-white/20" />
            </div>
          </div>
          <div className="p-6 flex flex-col items-center justify-center">
            <Skeleton className="h-12 w-24 mb-2" />
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-9 w-32" />
          </div>
        </Card>
        
        {/* Rank Card Skeleton */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32 bg-white/20" />
              <Skeleton className="h-5 w-5 rounded-full bg-white/20" />
            </div>
          </div>
          <div className="p-6 flex flex-col items-center justify-center">
            <div className="flex items-baseline mb-2">
              <Skeleton className="h-12 w-20" />
              <Skeleton className="h-6 w-16 ml-2" />
            </div>
            <Skeleton className="h-4 w-48 mb-4" />
            <Skeleton className="h-9 w-40" />
          </div>
        </Card>
        
        {/* Requests Card Skeleton */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-28 bg-white/20" />
              <Skeleton className="h-5 w-5 rounded-full bg-white/20" />
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 w-full mb-4">
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            </div>
            <Skeleton className="h-9 w-32 mx-auto" />
          </div>
        </Card>
      </div>

      {/* Upcoming Events Section Skeleton */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1 text-gray-300" />
                <Skeleton className="h-4 w-24" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Points Section Skeleton */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Card>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 border-b last:border-b-0">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user, isStudent, refreshUser } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentPoints, setRecentPoints] = useState<PointHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { data: userMeetings, isLoading: meetingsLoading } = useUserMeetings();

  useEffect(() => {
      const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get fresh user data to ensure points are up to date
      const userRes = await fetch('/api/auth/me', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const userData = await userRes.json();
      const currentUser = userData.user;
      
      // Get leaderboard to determine rank
      const leaderboardRes = await fetch('/api/leaderboard');
      const leaderboardData = await leaderboardRes.json();
      
      // Find user's rank
      const userRank = leaderboardData.leaderboard.findIndex(
        (student: any) => student.id === currentUser?.id
      ) + 1;
      
      // Get upcoming events
      const eventsRes = await fetch('/api/events');
      const eventsData = await eventsRes.json();
      
      // Get points history
      const pointsRes = await fetch('/api/points');
      const pointsData = await pointsRes.json();
      
      // Get requests
      const requestsRes = await fetch('/api/requests');
      const requestsData = await requestsRes.json();
      
      const pendingRequests = requestsData.requests.filter(
        (req: any) => req.status === 'pending'
      ).length;
      
      const approvedRequests = requestsData.requests.filter(
        (req: any) => req.status === 'approved'
      ).length;
      
      setStats({
        points: currentUser?.points || 0,
        rank: userRank,
        totalStudents: leaderboardData.leaderboard.length,
        pendingRequests,
        approvedRequests,
      });
        
        // Filter for upcoming events (today and future)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcoming = eventsData.events
          .filter((event: any) => new Date(event.date) >= today)
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 3);
        
        setUpcomingEvents(upcoming);
        
        // Get recent point history (last 5 transactions)
        const recent = pointsData.transactions
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        
        setRecentPoints(recent);
      } catch (err) {
        console.error('Error fetching student dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (isStudent && user) {
      fetchDashboardData();
    }
  }, [isStudent, user]);

  if (loading) {
    return <LoadingDashboard />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8 px-4 sm:px-6 pt-4 sm:pt-6">
        <h1 className="text-xl sm:text-2xl font-semibold">Öğrenci Paneli</h1>
        <div className="flex w-full sm:w-auto gap-2">
          <Link
            href="/dashboard/part7/student/settings"
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white text-indigo-600 rounded-lg shadow-sm hover:shadow-md transition-all border border-indigo-100 flex items-center justify-center gap-2 text-sm"
          >
            <Settings className="h-4 w-4" />
            <span>Ayarlar</span>
          </Link>
          <Link
            href="/dashboard/part7/student/profile"
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 text-sm"
          >
            <User className="h-4 w-4" />
            <span>Profilim</span>
          </Link>
        </div>
      </div>

      <div className="px-4 sm:px-6 mb-6 sm:mb-8">
        <CurrentPeriod />
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-6 mb-6 sm:mb-8">
          {/* Points Card */}
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-medium text-white">Puanlarınız</h3>
                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-white/80" />
              </div>
            </div>
            <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900">{stats.points}</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">Toplam kazanılan puan</div>
              <Link
                href="/dashboard/part7/student/store"
                className="mt-3 sm:mt-4 inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-violet-100 text-violet-700 rounded-md text-xs sm:text-sm font-medium hover:bg-violet-200 transition-colors w-full sm:w-auto justify-center"
              >
                Puan Harca
                <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </div>
          </Card>
          
          {/* Rank Card */}
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-medium text-white">Sıralama</h3>
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-white/80" />
              </div>
            </div>
            <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
              <div className="flex items-baseline">
                <span className="text-3xl sm:text-4xl font-bold text-gray-900">#{stats.rank}</span>
                <span className="text-base sm:text-lg text-gray-500 ml-2">/ {stats.totalStudents}</span>
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1 text-center">
                {stats.rank <= 3 ? "🏆 Harika! İlk 3'tesin!" : 
                 stats.rank <= 10 ? "👏 Tebrikler! İlk 10'dasın!" :
                 stats.rank <= Math.ceil(stats.totalStudents * 0.25) ? "💪 İlk %25'tesin!" :
                 "Sıralamada yükselmek için puan topla!"}
              </div>
              <Link
                href="/dashboard/part7/student/leaderboard"
                className="mt-3 sm:mt-4 inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-100 text-emerald-700 rounded-md text-xs sm:text-sm font-medium hover:bg-emerald-200 transition-colors w-full sm:w-auto justify-center"
              >
                Sıralamayı Gör
                <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </div>
          </Card>
          
          {/* Requests Card */}
          <Card className="overflow-hidden border-0 shadow-md sm:col-span-2 lg:col-span-1">
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-medium text-white">Ürün İstekleri</h3>
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white/80" />
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full mb-3 sm:mb-4">
                <div className="text-center p-2 sm:p-3 bg-yellow-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pendingRequests}</div>
                  <div className="text-xs text-gray-500">Bekleyen</div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.approvedRequests}</div>
                  <div className="text-xs text-gray-500">Onaylanan</div>
                </div>
              </div>
              <Link
                href="/dashboard/part7/student/requests"
                className="w-full inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 bg-orange-100 text-orange-700 rounded-md text-xs sm:text-sm font-medium hover:bg-orange-200 transition-colors"
              >
                İsteklerim
                <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </div>
          </Card>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-6">
        {/* Upcoming Events Section */}
        <Card className="border-0 shadow-md">
          <div className="flex items-center justify-between p-3 sm:p-4 border-b">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500 mr-2" />
              <h2 className="text-base sm:text-lg font-medium">Yaklaşan Etkinlikler</h2>
            </div>
            <Link
              href="/dashboard/part7/student/events"
              className="text-xs sm:text-sm text-violet-600 hover:text-violet-800 font-medium inline-flex items-center"
            >
              Tümünü Gör
              <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
            </Link>
          </div>
          <div className="p-3 sm:p-4">
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="border-l-4 border-violet-500 pl-3 sm:pl-4 py-2">
                    <div className="font-medium text-base sm:text-lg">{event.title}</div>
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">
                      {new Date(event.date).toLocaleDateString('tr-TR')}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">{event.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-6 sm:py-8 text-sm">
                Yaklaşan etkinlik bulunmuyor
              </div>
            )}
          </div>
        </Card>
        
        {/* Recent Points Section */}
        <Card className="border-0 shadow-md">
          <div className="flex items-center justify-between p-3 sm:p-4 border-b">
            <div className="flex items-center">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500 mr-2" />
              <h2 className="text-base sm:text-lg font-medium">Son Puan Hareketleri</h2>
            </div>
            <Link
              href="/dashboard/part7/student/points"
              className="text-xs sm:text-sm text-violet-600 hover:text-violet-800 font-medium inline-flex items-center"
            >
              Tümünü Gör
              <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
            </Link>
          </div>
          <div className="p-3 sm:p-4">
            {recentPoints.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {recentPoints.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'AWARD' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.type === 'AWARD' ? '+' : '-'}
                      </div>
                      <div>
                        <div className="text-sm sm:text-base font-medium text-gray-900">
                          {transaction.reason}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm sm:text-base font-semibold ${
                      transaction.type === 'AWARD' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'AWARD' ? '+' : '-'}{transaction.points}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-6 sm:py-8 text-sm">
                Henüz puan hareketi bulunmuyor
              </div>
            )}
          </div>
        </Card>
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
                        <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                          meeting.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
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