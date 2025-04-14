'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Users, Calendar, ShoppingBag, AlertCircle, ChevronRight, Home, User, UserPlus, BarChart2, Trophy } from "lucide-react";
import { HeaderSkeleton, StatsCardSkeleton } from '@/app/components/ui/skeleton-shimmer';

type Stats = {
  totalUsers: number;
  totalStudents: number;
  totalTutors: number;
  totalEvents: number;
  totalStoreItems: number;
  pendingRequests: number;
};

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
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
        
        try {
          // Get users count
          const usersRes = await fetch('/api/users');
          const usersData = await usersRes.json();
          if (usersData?.users) {
            defaultStats.totalUsers = usersData.users.length;
            defaultStats.totalStudents = usersData.users.filter((u: any) => u.role === 'student').length;
            defaultStats.totalTutors = usersData.users.filter((u: any) => u.role === 'tutor').length;
          }
        } catch (err) {
          console.error('Error fetching users:', err);
        }
        
        try {
          // Get events count
          const eventsRes = await fetch('/api/events');
          const eventsData = await eventsRes.json();
          if (eventsData?.events) {
            defaultStats.totalEvents = eventsData.events.length;
          }
        } catch (err) {
          console.error('Error fetching events:', err);
        }
        
        try {
          // Get store items count
          const storeRes = await fetch('/api/store');
          const storeData = await storeRes.json();
          if (storeData?.items) {
            defaultStats.totalStoreItems = storeData.items.length;
          }
        } catch (err) {
          console.error('Error fetching store items:', err);
        }
        
        try {
          // Get pending requests count
          const requestsRes = await fetch('/api/admin/registration-requests');
          const requestsData = await requestsRes.json();
          if (requestsData?.requests) {
            defaultStats.pendingRequests = requestsData.requests.filter((req: any) => req.status === 'pending').length;
          }
        } catch (err) {
          console.error('Error fetching registration requests:', err);
        }
        
        setStats(defaultStats);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Gösterge paneli verileri yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
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
              {[1, 2, 3, 4, 5].map((i) => (
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

  // Format date to Turkish locale
  const today = new Date().toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
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
            Bugün: {today}
          </div>
        </div>
        
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <CardDescription className="text-sm text-gray-500">Kullanıcılar</CardDescription>
                    <CardTitle className="text-3xl font-bold">{stats.totalUsers}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <div>Öğrenciler: <span className="font-semibold text-indigo-700">{stats.totalStudents}</span></div>
                  <div>Öğretmenler: <span className="font-semibold text-indigo-700">{stats.totalTutors}</span></div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-100 pt-3">
                <Link 
                  href="/admin/users" 
                  className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
                >
                  Kullanıcıları Yönet
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </CardFooter>
            </Card>
            
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
              <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <CardDescription className="text-sm text-gray-500">Etkinlikler</CardDescription>
                    <CardTitle className="text-3xl font-bold">{stats.totalEvents}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-500">
                  {stats.totalEvents === 0 ? 'Henüz etkinlik oluşturulmadı' : `${stats.totalEvents} etkinlik planlandı`}
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-100 pt-3">
                <Link 
                  href="/admin/events" 
                  className="flex items-center text-sm font-medium text-purple-600 hover:text-purple-500 transition-colors duration-200"
                >
                  Etkinlikleri Yönet
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </CardFooter>
            </Card>
            
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
              <div className="h-2 bg-gradient-to-r from-green-500 to-teal-500"></div>
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <div>
                    <CardDescription className="text-sm text-gray-500">Mağaza Ürünleri</CardDescription>
                    <CardTitle className="text-3xl font-bold">{stats.totalStoreItems}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-500">
                  {stats.totalStoreItems === 0 ? 'Ürün bulunmuyor' : `Mağazada ${stats.totalStoreItems} ürün var`}
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-100 pt-3">
                <Link 
                  href="/admin/store" 
                  className="flex items-center text-sm font-medium text-green-600 hover:text-green-500 transition-colors duration-200"
                >
                  Mağazayı Yönet
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </CardFooter>
            </Card>
          </div>
        )}
        
        {stats && stats.pendingRequests > 0 && (
          <Card className="mb-8 border-0 shadow-lg rounded-xl overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50">
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
                    <Link href="/admin/registration-requests">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/users" className="group">
              <div className="border border-gray-200 rounded-xl p-5 bg-white hover:bg-indigo-50 transition-all duration-200 hover:shadow-md group-hover:border-indigo-200 h-full flex flex-col">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-4 group-hover:bg-indigo-200 transition-colors duration-200">
                  <User className="h-6 w-6" />
                </div>
                <h3 className="font-medium text-gray-800 mb-2">Kullanıcı Yönetimi</h3>
                <p className="text-sm text-gray-500 mt-auto">Kullanıcıları yönet, düzenle ve görüntüle</p>
              </div>
            </Link>
            
            <Link href="/admin/events" className="group">
              <div className="border border-gray-200 rounded-xl p-5 bg-white hover:bg-purple-50 transition-all duration-200 hover:shadow-md group-hover:border-purple-200 h-full flex flex-col">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 mb-4 group-hover:bg-purple-200 transition-colors duration-200">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="font-medium text-gray-800 mb-2">Etkinlik Oluştur</h3>
                <p className="text-sm text-gray-500 mt-auto">Yeni etkinlikler ekle ve planla</p>
              </div>
            </Link>
            
            <Link href="/admin/leaderboard" className="group">
              <div className="border border-gray-200 rounded-xl p-5 bg-white hover:bg-blue-50 transition-all duration-200 hover:shadow-md group-hover:border-blue-200 h-full flex flex-col">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-4 group-hover:bg-blue-200 transition-colors duration-200">
                  <Trophy className="h-6 w-6" />
                </div>
                <h3 className="font-medium text-gray-800 mb-2">Liderlik Tablosu</h3>
                <p className="text-sm text-gray-500 mt-auto">Öğrenci başarı ve puan sıralamasını görüntüle</p>
              </div>
            </Link>
            
            <Link href="/admin/store" className="group">
              <div className="border border-gray-200 rounded-xl p-5 bg-white hover:bg-green-50 transition-all duration-200 hover:shadow-md group-hover:border-green-200 h-full flex flex-col">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-600 mb-4 group-hover:bg-green-200 transition-colors duration-200">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <h3 className="font-medium text-gray-800 mb-2">Ürün Ekle</h3>
                <p className="text-sm text-gray-500 mt-auto">Mağazaya yeni ürünler ekle ve düzenle</p>
              </div>
            </Link>
            
            <Link href="/admin/registration-requests" className="group">
              <div className="border border-gray-200 rounded-xl p-5 bg-white hover:bg-amber-50 transition-all duration-200 hover:shadow-md group-hover:border-amber-200 h-full flex flex-col">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-4 group-hover:bg-amber-200 transition-colors duration-200">
                  <UserPlus className="h-6 w-6" />
                </div>
                <h3 className="font-medium text-gray-800 mb-2">Kayıt İstekleri</h3>
                <p className="text-sm text-gray-500 mt-auto">Bekleyen kayıt isteklerini onayla veya reddet</p>
              </div>
            </Link>
          </div>
        </div>
        
        <div className="text-center mt-8 text-xs text-gray-500">
          © {new Date().getFullYear()} Öğrenci Takip Sistemi. Tüm hakları saklıdır.
        </div>
      </div>
    </div>
  );
} 