"use client";

import { useAuth } from "@/app/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle,
  Download,
  RefreshCw,
  Target,
  Trophy,
  Users
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface UserPerformance {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
    role: string;
  };
  totalReports: number;
  submittedReports: number;
  approvedReports: number;
  totalPointsEarned: number;
  averageAttendance: number;
  weeklyProgress: Array<{
    week: number;
    submitted: boolean;
    approved: boolean;
    attendanceScore: number;
    pointsAwarded: number;
  }>;
}

interface CurrentPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
}

export default function WeeklyReportsPerformancePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [performances, setPerformances] = useState<UserPerformance[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<CurrentPeriod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("points");

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.push("/login");
      return;
    }

    fetchPerformanceData();
  }, [isAuthenticated, isAdmin, router]);

  const fetchPerformanceData = async () => {
    try {
      setIsLoading(true);

      // For now, we'll simulate this data since the API endpoint doesn't exist yet
      // In a real implementation, you'd call: /api/admin/weekly-reports/performance

      const periodResponse = await fetch("/api/periods/current");
      if (periodResponse.ok) {
        const periodData = await periodResponse.json();
        setCurrentPeriod(periodData);
      }

      const reportsResponse = await fetch("/api/admin/weekly-reports");
      if (reportsResponse.ok) {
        const data = await reportsResponse.json();

        // Process the reports to calculate performance metrics
        const performanceMap = new Map<string, UserPerformance>();

        data.reports.forEach((report: any) => {
          const userId = report.user.id;

          if (!performanceMap.has(userId)) {
            performanceMap.set(userId, {
              user: report.user,
              totalReports: 0,
              submittedReports: 0,
              approvedReports: 0,
              totalPointsEarned: 0,
              averageAttendance: 0,
              weeklyProgress: Array.from({ length: 8 }, (_, i) => ({
                week: i + 1,
                submitted: false,
                approved: false,
                attendanceScore: 0,
                pointsAwarded: 0
              }))
            });
          }

          const performance = performanceMap.get(userId)!;
          performance.totalReports++;

          if (report.status !== "DRAFT") {
            performance.submittedReports++;
          }

          if (report.status === "APPROVED") {
            performance.approvedReports++;
            performance.totalPointsEarned += report.pointsAwarded;
          }

          // Update weekly progress
          const weekIndex = report.weekNumber - 1;
          if (weekIndex >= 0 && weekIndex < 8) {
            performance.weeklyProgress[weekIndex] = {
              week: report.weekNumber,
              submitted: report.status !== "DRAFT",
              approved: report.status === "APPROVED",
              attendanceScore: calculateAttendanceScore(report.fixedCriteria, report.variableCriteria),
              pointsAwarded: report.pointsAwarded
            };
          }
        });

        // Calculate average attendance for each user
        performanceMap.forEach((performance) => {
          const submittedWeeks = performance.weeklyProgress.filter(w => w.submitted);
          if (submittedWeeks.length > 0) {
            performance.averageAttendance = Math.round(
              submittedWeeks.reduce((sum, w) => sum + w.attendanceScore, 0) / submittedWeeks.length
            );
          }
        });

        setPerformances(Array.from(performanceMap.values()));
      }
    } catch (error) {
      console.error("Error fetching performance data:", error);
      toast.error("Performans verileri yüklenirken hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAttendanceScore = (fixedCriteria: any, variableCriteria: any): number => {
    let totalCriteria = 0;
    let completedCriteria = 0;

    if (fixedCriteria) {
      const fixedValues = Object.values(fixedCriteria).filter(v => v);
      totalCriteria += fixedValues.length;
      completedCriteria += fixedValues.filter(v => v === "YAPILDI").length;
    }

    if (variableCriteria) {
      const variableValues = Object.values(variableCriteria).filter(v => v);
      totalCriteria += variableValues.length;
      completedCriteria += variableValues.filter(v => v === "YAPILDI").length;
    }

    return totalCriteria > 0 ? Math.round((completedCriteria / totalCriteria) * 100) : 0;
  };

  const getFilteredAndSortedPerformances = () => {
    let filtered = [...performances];

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(p => p.user.role === roleFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "points":
          return b.totalPointsEarned - a.totalPointsEarned;
        case "attendance":
          return b.averageAttendance - a.averageAttendance;
        case "reports":
          return b.submittedReports - a.submittedReports;
        case "name":
          const aName = a.user.firstName && a.user.lastName
            ? `${a.user.firstName} ${a.user.lastName}`
            : a.user.username;
          const bName = b.user.firstName && b.user.lastName
            ? `${b.user.firstName} ${b.user.lastName}`
            : b.user.username;
          return aName.localeCompare(bName, 'tr');
        default:
          return 0;
      }
    });

    return filtered;
  };

  const calculateTotalStats = () => {
    const filtered = getFilteredAndSortedPerformances();
    return {
      totalUsers: filtered.length,
      totalPoints: filtered.reduce((sum, p) => sum + p.totalPointsEarned, 0),
      totalReports: filtered.reduce((sum, p) => sum + p.submittedReports, 0),
      averageAttendance: filtered.length > 0
        ? Math.round(filtered.reduce((sum, p) => sum + p.averageAttendance, 0) / filtered.length)
        : 0
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="px-4 py-8">
          {/* Breadcrumb Skeleton */}
          <div className="mb-6">
            <Skeleton className="h-4 w-48 mb-4" />
          </div>

          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-6 w-px" />
              </div>
              <Skeleton className="h-10 w-80 mb-2" />
              <Skeleton className="h-6 w-96" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const filteredPerformances = getFilteredAndSortedPerformances();
  const totalStats = calculateTotalStats();

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-white">
      <div className="px-4 py-8">
        {/* Header with Breadcrumb Navigation */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link href="/dashboard/part7/admin" className="hover:text-indigo-600 transition-colors">
              Admin
            </Link>
            <span>/</span>
            <Link href="/dashboard/part7/admin/weekly-reports" className="hover:text-indigo-600 transition-colors">
              Haftalık Raporlar
            </Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">Performans Raporu</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/dashboard/part7/admin/weekly-reports">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 group"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                  Geri dön
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-200"></div>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Rehber Performans Raporu
              </span>
            </h1>
            <p className="text-gray-600 text-lg">
              {currentPeriod ? `${currentPeriod.name} dönemi tutora ve asistan performansları` : "Performans takip paneli"}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={fetchPerformanceData} 
              variant="outline" 
              className="hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
            <Button 
              variant="outline" 
              className="hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-all duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Dışa Aktar
            </Button>
          </div>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-indigo-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Toplam Rehber</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Toplam Puan</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStats.totalPoints}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Toplam Rapor</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStats.totalReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Ortalama Katılım</p>
                  <p className="text-2xl font-bold text-gray-900">%{totalStats.averageAttendance}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-md mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Rol Filtresi</label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Roller</SelectItem>
                    <SelectItem value="TUTOR">Rehber</SelectItem>
                    <SelectItem value="ASISTAN">Rehber Yardımcısı</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Sıralama</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sıralama türü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">Toplam Puana Göre</SelectItem>
                    <SelectItem value="attendance">Katılım Oranına Göre</SelectItem>
                    <SelectItem value="reports">Rapor Sayısına Göre</SelectItem>
                    <SelectItem value="name">İsme Göre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Link href="/dashboard/part7/admin/weekly-reports" className="w-full">
                  <Button variant="outline" className="w-full">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Rapor Listesi
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance List */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>
              Performans Sıralaması ({filteredPerformances.length} Rehber)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPerformances.length > 0 ? (
              <div className="space-y-4">
                {filteredPerformances.map((performance, index) => (
                  <div
                    key={performance.user.id}
                    className="flex items-center justify-between p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full font-bold">
                        {index + 1}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {performance.user.firstName && performance.user.lastName
                              ? `${performance.user.firstName} ${performance.user.lastName}`
                              : performance.user.username}
                          </span>
                          <Badge variant="outline">{performance.user.role}</Badge>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {performance.submittedReports}/{performance.totalReports} rapor
                          </span>
                          <span className="flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {performance.approvedReports} onaylı
                          </span>
                          <span className="flex items-center">
                            <Target className="h-3 w-3 mr-1" />
                            %{performance.averageAttendance} katılım
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <Trophy className="h-5 w-5 text-yellow-600" />
                          <span className="text-2xl font-bold text-gray-900">
                            {performance.totalPointsEarned}
                          </span>
                          <span className="text-sm text-gray-500">puan</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Ortalama: {performance.submittedReports > 0
                            ? Math.round(performance.totalPointsEarned / performance.submittedReports)
                            : 0}/hafta
                        </div>
                      </div>

                      {/* Weekly Progress Mini Chart */}
                      <div className="flex space-x-1">
                        {performance.weeklyProgress.map((week) => (
                          <div
                            key={week.week}
                            className={`w-3 h-8 rounded-sm ${
                              week.approved ? "bg-green-500" :
                              week.submitted ? "bg-yellow-500" :
                              "bg-gray-200"
                            }`}
                            title={`${week.week}. Hafta - ${
                              week.approved ? `Onaylandı (${week.pointsAwarded} puan)` :
                              week.submitted ? "Gönderildi" :
                              "Henüz gönderilmedi"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Performans Verisi Bulunamadı
                </h3>
                <p className="text-gray-600">
                  Seçilen kriterlere uygun performans verisi bulunmuyor.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}