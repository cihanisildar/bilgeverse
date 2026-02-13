'use client';

import { useEffect, useState, Suspense, useMemo, lazy } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Users, Calendar, ShoppingBag, AlertCircle, ChevronRight, Home, User, UserPlus, BarChart2, Trophy, Star, FileText, Heart } from "lucide-react";
import { HeaderSkeleton, StatsCardSkeleton } from '@/app/components/ui/skeleton-shimmer';
import { UserRole } from '@prisma/client';
import dynamic from 'next/dynamic';
import CurrentPeriod from '@/app/components/CurrentPeriod';

// Lazy load heavy components to improve FID
const QuickAccessGrid = lazy(() => import('./components/QuickAccessGrid'));

type Stats = {
  totalUsers: number;
  totalStudents: number;
  totalTutors: number;
  totalEvents: number;
  totalStoreItems: number;
  pendingRequests: number;
};

// Memoized component for stats cards to prevent unnecessary re-renders
const StatsCards = ({ stats }: { stats: Stats }) => {
  const cards = useMemo(() => [
    {
      id: 'users',
      title: 'Kullanıcılar',
      value: stats.totalUsers,
      icon: Users,
      color: 'indigo',
      gradient: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-100',
      textColor: 'text-indigo-600',
      linkColor: 'text-indigo-600 hover:text-indigo-500',
      href: '/dashboard/part7/admin/users',
      linkText: 'Kullanıcıları Yönet',
      subtitle: (
        <div className="flex justify-between text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
          <div>Öğrenciler: <span className="font-semibold text-indigo-700">{stats.totalStudents}</span></div>
          <div>Öğretmenler: <span className="font-semibold text-indigo-700">{stats.totalTutors}</span></div>
        </div>
      )
    },
    {
      id: 'events',
      title: 'Etkinlikler',
      value: stats.totalEvents,
      icon: Calendar,
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      linkColor: 'text-purple-600 hover:text-purple-500',
      href: '/dashboard/part7/admin/events',
      linkText: 'Etkinlikleri Yönet',
      subtitle: (
        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-500">
          {stats.totalEvents === 0 ? 'Henüz etkinlik oluşturulmadı' : `${stats.totalEvents} etkinlik planlandı`}
        </div>
      )
    },
    {
      id: 'store',
      title: 'Mağaza Ürünleri',
      value: stats.totalStoreItems,
      icon: ShoppingBag,
      color: 'green',
      gradient: 'from-green-500 to-teal-500',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      linkColor: 'text-green-600 hover:text-green-500',
      href: '/dashboard/part7/admin/store',
      linkText: 'Mağazayı Yönet',
      subtitle: (
        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-500">
          {stats.totalStoreItems === 0 ? 'Ürün bulunmuyor' : `Mağazada ${stats.totalStoreItems} ürün var`}
        </div>
      )
    }
  ], [stats]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <Card key={card.id} className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
            <div className={`h-2 bg-gradient-to-r ${card.gradient}`}></div>
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 flex items-center justify-center rounded-full ${card.bgColor} ${card.textColor}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div>
                  <CardDescription className="text-sm text-gray-500">{card.title}</CardDescription>
                  <CardTitle className="text-3xl font-bold">{card.value}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {card.subtitle}
            </CardContent>
            <CardFooter className="border-t border-gray-100 pt-3">
              <Link
                href={card.href}
                className={`flex items-center text-sm font-medium ${card.linkColor} transition-colors duration-200`}
              >
                {card.linkText}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      // Don't fetch if we already have stats (prevents refetch on tab focus)
      if (stats) return;

      try {
        setLoading(true);

        // Initialize default stats
        const defaultStats = {
          totalUsers: 0,
          totalStudents: 0,
          totalTutors: 0,
          totalEvents: 0,
          totalStoreItems: 0,
          pendingRequests: 0,
        };

        // Use Promise.allSettled for better error handling and parallel requests
        const requests = [
          fetch('/api/users').then(res => res.json()),
          fetch('/api/events').then(res => res.json()),
          fetch('/api/store').then(res => res.json()),
          fetch('/api/admin/registration-requests').then(res => res.json())
        ];

        const results = await Promise.allSettled(requests);

        // Process users data
        if (results[0].status === 'fulfilled' && results[0].value?.users) {
          const users = results[0].value.users;
          defaultStats.totalUsers = users.length;
          defaultStats.totalStudents = users.filter((u: any) =>
            (u.roles && u.roles.includes(UserRole.STUDENT)) || u.role === UserRole.STUDENT
          ).length;
          defaultStats.totalTutors = users.filter((u: any) =>
            (u.roles && (u.roles.includes(UserRole.TUTOR) || u.roles.includes(UserRole.ASISTAN))) ||
            u.role === UserRole.TUTOR || u.role === UserRole.ASISTAN
          ).length;
        }

        // Process events data
        if (results[1].status === 'fulfilled' && results[1].value?.events) {
          defaultStats.totalEvents = results[1].value.events.length;
        }

        // Process store data
        if (results[2].status === 'fulfilled' && results[2].value?.items) {
          defaultStats.totalStoreItems = results[2].value.items.length;
        }

        // Process requests data
        if (results[3].status === 'fulfilled' && results[3].value?.requests) {
          defaultStats.pendingRequests = results[3].value.requests.filter((req: any) => req.status === 'PENDING').length;
        }

        setStats(defaultStats);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Gösterge paneli verileri yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    const userRoles = (session?.user as any)?.roles || [];
    const isAdmin = userRoles.includes(UserRole.ADMIN) || session?.user?.role === UserRole.ADMIN;

    if (isAdmin) {
      fetchStats();
    }
  }, [session?.user]); // Depend on session object to catch role changes

  // Memoized date calculation
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  }, []);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
        <div className="space-y-6">
          <HeaderSkeleton />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>

          {/* Quick Access Grid */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
            <Separator className="mb-6 bg-gray-200" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-5 bg-white">
                  <div className="w-12 h-12 rounded-full bg-gray-100 mb-4" />
                  <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Yönetici Gösterge Paneli
              </span>
            </h1>
            <p className="mt-2 text-gray-600">Sistem durumunu ve istatistikleri buradan takip edebilirsiniz.</p>
          </div>
          <div className="bg-white py-2 px-4 rounded-lg border border-gray-200 shadow-sm text-sm text-gray-500 flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
            Bugün: {todayFormatted}
          </div>
        </div>

        <div className="space-y-8">
          <CurrentPeriod />

          {stats && <StatsCards stats={stats} />}

          {stats && stats.pendingRequests > 0 && (
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="h-2 bg-gradient-to-r from-amber-400 to-orange-400"></div>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 flex-shrink-0">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-800">
                      Dikkat Gerekiyor
                    </h3>
                    <div className="mt-2 text-amber-700">
                      <p className="text-sm">{stats.pendingRequests} onay bekleyen kayıt isteği bulunuyor.</p>
                    </div>
                    <div className="mt-4">
                      <Link href="/dashboard/part7/admin/registration-requests">
                        <button className="inline-flex items-center px-4 py-2 border border-amber-300 text-sm font-medium rounded-lg text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors duration-200 shadow-sm">
                          İstekleri Görüntüle
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Hızlı Erişim
            </h2>
            <Separator className="mb-6 bg-gray-200" />
            <Suspense fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-5 bg-white">
                    <div className="w-12 h-12 rounded-full bg-gray-100 mb-4 animate-pulse" />
                    <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse" />
                    <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            }>
              <QuickAccessGrid />
            </Suspense>
          </div>
        </div>

        <div className="text-center mt-12 text-xs text-gray-500">
          © {new Date().getFullYear()} Öğrenci Takip Sistemi. Tüm hakları saklıdır.
        </div>
      </div>
    </div>
  );
} 