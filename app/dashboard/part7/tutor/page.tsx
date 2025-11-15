"use client";

import { HeaderSkeleton, StatsCardSkeleton } from "@/app/components/ui/skeleton-shimmer";
import { useAuth } from "@/app/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from 'react-hot-toast';
import { AlertCircle, Award, Bell, Clock, Plus, Search, TrendingUp, ArrowRight, Users, Calendar, MapPin, FileText } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CurrentPeriod from '@/app/components/CurrentPeriod';
import { useUserMeetings } from '@/app/hooks/use-meetings';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface TutorStats {
  totalStudents: number;
  totalEvents: number;
  totalPointsAwarded: number;
  pendingRequests: number;
}

interface RecentTransaction {
  id: string;
  type: "AWARD" | "REDEEM";
  points: number;
  reason: string;
  createdAt: string;
  student: {
    firstName: string;
    username: string;
  };
  tutor: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

async function fetchDashboardData() {
        // Get students - use tutor students endpoint
        const studentsRes = await fetch("/api/tutor/students");
        const studentsData = await studentsRes.json();

        // Get events created by this tutor
        const eventsRes = await fetch("/api/events");
        const eventsData = await eventsRes.json();

        // Get pending requests - explicitly request PENDING status
        const requestsRes = await fetch("/api/requests?status=PENDING");
        const requestsData = await requestsRes.json();

        // Get recent points transactions
        const transactionsRes = await fetch("/api/points");
        const transactionsData = await transactionsRes.json();

        // Calculate total points awarded
        const totalPoints =
          transactionsData.transactions?.reduce(
            (total: number, transaction: any) => {
              return transaction.type === "AWARD"
                ? total + transaction.points
                : total;
            },
            0
          ) || 0;

  return {
    stats: {
          totalStudents: studentsData.students?.length || 0,
          totalEvents: eventsData.events?.length || 0,
          totalPointsAwarded: totalPoints,
          pendingRequests: requestsData.requests?.length || 0,
    },
    recentTransactions: transactionsData.transactions
            ? transactionsData.transactions
                .sort(
                  (a: any, b: any) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .slice(0, 5)
      : [],
  };
}

// Static Header Component
function DashboardHeader() {
  return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Öğretmen Paneli
          </span>
        </h1>
        <div className="flex space-x-2">
          <Link
            href="/dashboard/part7/tutor/profile"
            className="px-4 py-2 bg-white text-indigo-600 rounded-lg shadow-sm hover:shadow-md transition-all border border-indigo-100"
          >
            Profilim
          </Link>
          <Link
            href="/dashboard/part7/tutor/settings"
            className="px-4 py-2 bg-gradient-to-r hover:text-white from-indigo-500 to-purple-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            Ayarlar
          </Link>
        </div>
      </div>
  );
}

// Static Quick Actions Component
function QuickActions() {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-5">
          Hızlı İşlemler
        </h2>
        <div className="space-y-4">
          <Link
            href="/dashboard/part7/tutor/points/award"
            className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100 hover:shadow-md transition-all group"
          >
            <div className="p-2 rounded-lg bg-green-100 text-green-600 group-hover:bg-green-200 transition-colors">
              <Award size={20} />
            </div>
            <div className="ml-4">
              <span className="font-medium text-green-700">
                Öğrenciye Puan Ver
              </span>
              <p className="text-sm text-green-600">
                Öğrenci başarılarını ödüllendir
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/part7/tutor/events/new"
            className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:shadow-md transition-all group"
          >
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
              <Search size={20} />
            </div>
            <div className="ml-4">
              <span className="font-medium text-blue-700">
                Yeni Etkinlik Oluştur
              </span>
              <p className="text-sm text-blue-600">
                Ders veya aktivite planla
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/part7/tutor/leaderboard"
            className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100 hover:shadow-md transition-all group"
          >
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
              <TrendingUp size={20} />
            </div>
            <div className="ml-4">
              <span className="font-medium text-purple-700">
                Öğrenci Sıralamasını Görüntüle
              </span>
              <p className="text-sm text-purple-600">
                Öğrenci performansını takip et
              </p>
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading state components
function LoadingStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, index) => (
        <StatsCardSkeleton key={`stats-skeleton-${index}`} />
      ))}
    </div>
  );
}

function LoadingTransactions() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <Card key={`transaction-skeleton-${index}`} className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="flex items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32 ml-2" />
            </div>
            <Skeleton className="h-3 w-40 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Dynamic Stats Component
function DashboardStats() {
  const { isTutor } = useAuth();
  const [stats, setStats] = useState<TutorStats | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isTutor) {
      setIsLoading(true);
      fetchDashboardData()
        .then((result) => {
          setStats(result.stats);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching tutor dashboard data:", err);
          setError(
            "Gösterge paneli verilerini yüklerken bir hata oluştu. Lütfen daha sonra tekrar deneyin."
          );
          setIsLoading(false);
        });
    }
  }, [isTutor]);

  if (isLoading) {
    return <LoadingStats />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <div className={`h-1 bg-gradient-to-r ${
              i === 0 ? "from-indigo-500 to-purple-500" :
              i === 1 ? "from-blue-500 to-indigo-500" :
              i === 2 ? "from-green-500 to-emerald-500" :
              "from-amber-500 to-orange-500"
            }`} />
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${
                  i === 0 ? "bg-indigo-50" :
                  i === 1 ? "bg-blue-50" :
                  i === 2 ? "bg-green-50" :
                  "bg-amber-50"
                }`}>
                  {i === 0 ? <Users className="text-gray-400" size={24} /> :
                   i === 1 ? <Clock className="text-gray-400" size={24} /> :
                   i === 2 ? <Award className="text-gray-400" size={24} /> :
                   <Bell className="text-gray-400" size={24} />}
                </div>
                <div className="ml-5">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
              <div className="mt-6">
                <Skeleton className="h-4 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
        <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
        <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-50 text-indigo-600">
                <Users size={24} />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">
                  Öğrencilerim
                </p>
                <div className="flex items-center">
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalStudents}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Link
                href="/dashboard/part7/tutor/students"
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Öğrencileri Görüntüle <ArrowRight className="ml-1" />
              </Link>
            </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
        <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                <Clock size={24} />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Etkinlikler</p>
                <div className="flex items-center">
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalEvents}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Link
                href="/dashboard/part7/tutor/events"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Etkinlikleri Yönet <ArrowRight className="ml-1" />
              </Link>
            </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
        <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
        <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-50 text-green-600">
                <Award size={24} />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">
                  Verilen Puanlar
                </p>
                <div className="flex items-center">
                  <p className="text-3xl font-bold text-green-600">
                    +{stats.totalPointsAwarded}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Link
                href="/dashboard/part7/tutor/points"
                className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
              >
                Puan Ver <ArrowRight className="ml-1" />
              </Link>
            </div>
        </CardContent>
      </Card>

      <Card className={`border-0 shadow-md hover:shadow-lg transition-shadow ${
        stats.pendingRequests > 0 ? "border-amber-200" : ""
      }`}>
        <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        <CardContent className="p-6">
            <div className="flex items-center">
              <div
                className={`p-3 rounded-full ${
                  stats.pendingRequests > 0
                    ? "bg-amber-50 text-amber-600"
                    : "bg-gray-50 text-gray-600"
                }`}
              >
                <Bell size={24} />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">
                  Bekleyen İstekler
                </p>
                <div className="flex items-center">
                  <p
                    className={`text-3xl font-bold ${
                      stats.pendingRequests > 0
                        ? "text-amber-600"
                        : "text-gray-900"
                    }`}
                  >
                    {stats.pendingRequests}
                  </p>
                  {stats.pendingRequests > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                      Dikkat gerekli
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Link
                href="/dashboard/part7/tutor/requests"
                className={`inline-flex items-center text-sm font-medium ${
                  stats.pendingRequests > 0
                    ? "text-amber-600 hover:text-amber-800"
                    : "text-gray-600 hover:text-gray-800"
                } transition-colors`}
              >
                İstekleri Görüntüle <ArrowRight className="ml-1" />
              </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Dynamic Recent Transactions Component
function RecentTransactions() {
  const { isTutor } = useAuth();
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 5;

  useEffect(() => {
    if (isTutor) {
      setIsLoading(true);
      fetchDashboardData()
        .then((result) => {
          setTransactions(result.recentTransactions);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching recent transactions:", err);
          setError("İşlem geçmişi yüklenirken bir hata oluştu.");
          setIsLoading(false);
        });
    }
  }, [isTutor]);

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter((transaction) =>
    transaction.student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.student.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );

  if (isLoading) {
    return <LoadingTransactions />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
        {error}
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-800">Son İşlemler</h2>
          <Link
            href="/dashboard/part7/tutor/points/history"
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            Tümünü Görüntüle <ArrowRight className="ml-1" size={14} />
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              className="pl-9"
              placeholder="İşlemlerde ara..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
            />
          </div>
        </div>

        {currentTransactions.length > 0 ? (
          <>
            <div className="space-y-4">
              {currentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`rounded-lg p-4 ${
                    transaction.type === "AWARD"
                      ? "bg-green-50 border border-green-100"
                      : "bg-red-50 border border-red-100"
                  }`}
                >
                  <div className="flex justify-between">
                    <div className="font-medium">
                      {transaction.student.firstName ||
                        transaction.student.username}
                    </div>
                    <div
                      className={`font-bold ${
                        transaction.type === "AWARD"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "AWARD" ? "+" : "-"}
                      {Math.abs(transaction.points)} puan
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {transaction.reason}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(transaction.createdAt).toLocaleString("tr-TR")}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Puan veren: {transaction.tutor.firstName || transaction.tutor.username}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Önceki
                </Button>
                <span className="flex items-center px-3 py-1 rounded-md bg-gray-100">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Sonraki
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="inline-block p-3 bg-gray-100 rounded-full mb-4">
              <Award className="text-gray-400" size={24} />
            </div>
            <p className="text-gray-600 mb-2">
              {searchTerm ? "Aramanızla eşleşen işlem bulunamadı" : "Henüz işlem yok"}
            </p>
            <p className="text-sm text-gray-500">
              {searchTerm
                ? "Farklı bir arama terimi deneyin"
                : "Öğrencilere puan verdiğinizde burada görüntülenecek"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TutorDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { data: userMeetings, isLoading: meetingsLoading } = useUserMeetings();

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-white">
      <div className="px-4 py-8">
        {isLoading ? (
          <>
            <HeaderSkeleton />
            <div className="mt-8">
              <LoadingStats />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              <div className="lg:col-span-2">
                <LoadingTransactions />
              </div>
              <div>
                <Card className="border-0 shadow-md h-full">
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-32 mb-5" />
                    <div className="space-y-4">
                      {[...Array(3)].map((_, index) => (
                        <div key={`quick-action-skeleton-${index}`} className="flex items-center p-4 bg-gray-50 rounded-lg">
                          <Skeleton className="h-10 w-10 rounded-lg" />
                          <div className="ml-4 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <>
            <DashboardHeader />
            <div className="mt-8">
              <CurrentPeriod />
            </div>
            <div className="mt-8">
              <DashboardStats />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              <div className="lg:col-span-2">
                <RecentTransactions />
              </div>
              <div>
                <QuickActions />
              </div>
            </div>

            {/* My Meetings Section - Only show if user has attended meetings */}
            {!meetingsLoading && userMeetings && userMeetings.length > 0 && (
              <div className="mt-8">
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-indigo-500 mr-2" />
                        <h2 className="text-lg font-medium">Katıldığım Toplantılar</h2>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {userMeetings.slice(0, 5).map((meeting) => (
                        <div
                          key={meeting.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                          onClick={() => router.push(`/dashboard/part1/meetings/${meeting.id}`)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                                {meeting.title}
                              </h3>
                              {meeting.description && (
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                  {meeting.description}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1.5" />
                                  {format(new Date(meeting.meetingDate), 'd MMMM yyyy, HH:mm', { locale: tr })}
                                </div>
                                {meeting.location && (
                                  <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1.5" />
                                    {meeting.location}
                                  </div>
                                )}
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-1.5" />
                                  {meeting._count?.attendees || 0} katılımcı
                                </div>
                                <div className="flex items-center">
                                  <FileText className="h-4 w-4 mr-1.5" />
                                  {meeting._count?.decisions || 0} karar
                                </div>
                              </div>
                            </div>
                            <div className="ml-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
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
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
