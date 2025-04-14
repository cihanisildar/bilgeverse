'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Calendar, Clock, Star, Trophy, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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
  const { user, isStudent } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentPoints, setRecentPoints] = useState<PointHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get leaderboard to determine rank
        const leaderboardRes = await fetch('/api/leaderboard');
        const leaderboardData = await leaderboardRes.json();
        
        // Find user's rank
        const userRank = leaderboardData.leaderboard.findIndex(
          (student: any) => student.id === user?.id
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
          points: user?.points || 0,
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
    <div className="min-h-screen bg-gray-50/50">
      <div className="flex justify-between items-center mb-8 px-4 md:px-6 pt-6">
        <h1 className="text-2xl font-semibold">Öğrenci Paneli</h1>
        <div className="flex gap-2">
          <Link
            href="/student/settings"
            className="px-4 py-2 bg-white text-indigo-600 rounded-lg shadow-sm hover:shadow-md transition-all border border-indigo-100 flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Ayarlar
          </Link>
          <Link
            href="/student/profile"
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            Profilim
          </Link>
        </div>
      </div>
      
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-6 mb-8">
          {/* Points Card */}
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Puanlarınız</h3>
                <Star className="h-5 w-5 text-white/80" />
              </div>
            </div>
            <div className="p-6 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold text-gray-900">{stats.points}</div>
              <div className="text-sm text-gray-500 mt-1">Toplam kazanılan puan</div>
              <Link
                href="/student/store"
                className="mt-4 inline-flex items-center px-4 py-2 bg-violet-100 text-violet-700 rounded-md text-sm font-medium hover:bg-violet-200 transition-colors"
              >
                Puan Harca
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </Card>
          
          {/* Rank Card */}
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Sıralama</h3>
                <Trophy className="h-5 w-5 text-white/80" />
              </div>
            </div>
            <div className="p-6 flex flex-col items-center justify-center">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">#{stats.rank}</span>
                <span className="text-lg text-gray-500 ml-2">/ {stats.totalStudents}</span>
              </div>
              <div className="text-sm text-gray-500 mt-1 text-center">
                {stats.rank <= 3 ? "🏆 Harika! İlk 3'tesin!" : 
                 stats.rank <= 10 ? "👏 Tebrikler! İlk 10'dasın!" :
                 stats.rank <= Math.ceil(stats.totalStudents * 0.25) ? "💪 İlk %25'tesin!" :
                 "Sıralamada yükselmek için puan topla!"}
              </div>
              <Link
                href="/student/leaderboard"
                className="mt-4 inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-md text-sm font-medium hover:bg-emerald-200 transition-colors"
              >
                Sıralamayı Gör
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </Card>
          
          {/* Requests Card */}
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Ürün İstekleri</h3>
                <Clock className="h-5 w-5 text-white/80" />
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 w-full mb-4">
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</div>
                  <div className="text-xs text-gray-500">Bekleyen</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.approvedRequests}</div>
                  <div className="text-xs text-gray-500">Onaylanan</div>
                </div>
              </div>
              <Link
                href="/student/requests"
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-orange-100 text-orange-700 rounded-md text-sm font-medium hover:bg-orange-200 transition-colors"
              >
                İsteklerim
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </Card>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 md:px-6">
        {/* Upcoming Events Section */}
        <Card className="border-0 shadow-md">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-violet-500 mr-2" />
              <h2 className="text-lg font-medium">Yaklaşan Etkinlikler</h2>
            </div>
            <Link
              href="/student/events"
              className="text-sm text-violet-600 hover:text-violet-800 font-medium inline-flex items-center"
            >
              Tümünü Gör
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="p-4">
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="border-l-4 border-violet-500 pl-4 py-2">
                    <div className="font-medium text-lg">{event.title}</div>
                    <div className="text-sm text-gray-600 mb-1">
                      {new Date(event.date).toLocaleDateString('tr-TR')}
                    </div>
                    <div className="text-sm text-gray-500">{event.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                Yaklaşan etkinlik bulunmuyor
              </div>
            )}
          </div>
        </Card>
        
        {/* Recent Points Section */}
        <Card className="border-0 shadow-md">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-violet-500 mr-2" />
              <h2 className="text-lg font-medium">Son Puan Hareketleri</h2>
            </div>
            <Link
              href="/student/points"
              className="text-sm text-violet-600 hover:text-violet-800 font-medium inline-flex items-center"
            >
              Tümünü Gör
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="p-4">
            {recentPoints.length > 0 ? (
              <div className="space-y-3">
                {recentPoints.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className={`border-l-4 p-3 text-sm ${
                      transaction.type === 'award' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-red-500 bg-red-50'
                    }`}
                  >
                    <div className="font-medium">
                      {transaction.type === 'award' ? 'Kazanıldı: ' : 'Harcandı: '}
                      <span className="font-bold">{transaction.points} puan</span>
                    </div>
                    <div className="text-gray-600">{transaction.reason}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(transaction.createdAt).toLocaleString('tr-TR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                Henüz puan hareketi bulunmuyor
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
} 