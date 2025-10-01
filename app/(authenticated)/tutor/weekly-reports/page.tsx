"use client";

import { useAuth } from "@/app/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { Plus, Calendar, Clock, CheckCircle, XCircle, Edit, Eye, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface WeeklyReport {
  id: string;
  weekNumber: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  submissionDate: string | null;
  reviewDate: string | null;
  reviewNotes: string | null;
  pointsAwarded: number;
  createdAt: string;
  updatedAt: string;
}

interface CurrentPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  totalWeeks: number;
}

export default function WeeklyReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<CurrentPeriod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const isTutor = user?.role === "TUTOR";
  const isAsistan = user?.role === "ASISTAN";
  const isAuthenticated = user && !loading;

  useEffect(() => {
    if (!isAuthenticated || (!isTutor && !isAsistan)) {
      router.push("/login");
      return;
    }

    fetchReports();
  }, [isAuthenticated, isTutor, isAsistan, router]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);

      // Fetch current period
      const periodResponse = await fetch("/api/periods/current");
      if (periodResponse.ok) {
        const periodData = await periodResponse.json();
        setCurrentPeriod(periodData);
      }

      // Fetch weekly reports
      const reportsResponse = await fetch("/api/tutor/weekly-reports", {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData.reports || []);
      } else {
        throw new Error("Failed to fetch reports");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      setError("Haftalık raporlar yüklenirken bir hata oluştu.");
      toast.error("Haftalık raporlar yüklenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "SUBMITTED":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Edit className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
      DRAFT: "secondary",
      SUBMITTED: "default",
      APPROVED: "default",
      REJECTED: "destructive"
    };

    const labels = {
      DRAFT: "Taslak",
      SUBMITTED: "Gönderildi",
      APPROVED: "Onaylandı",
      REJECTED: "Reddedildi"
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getWeeklyReportsByWeek = () => {
    const weeklyReportsMap = new Map<number, WeeklyReport>();
    reports.forEach(report => {
      weeklyReportsMap.set(report.weekNumber, report);
    });

    // Generate weeks with reports or placeholders based on period totalWeeks
    const totalWeeks = currentPeriod?.totalWeeks || 8;
    return Array.from({ length: totalWeeks }, (_, index) => {
      const weekNumber = index + 1;
      return weeklyReportsMap.get(weekNumber) || {
        weekNumber,
        status: null,
        id: null
      };
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="px-4 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: currentPeriod?.totalWeeks || 8 }).map((_, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const weeklyReports = getWeeklyReportsByWeek();

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-white">
      <div className="px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {isTutor ? "Rehber" : "Rehber Yardımcısı"} Haftalık Raporları
              </span>
            </h1>
            <p className="text-gray-600">
              {currentPeriod ? `${currentPeriod.name} dönemi için haftalık raporlarınızı görüntüleyin ve yönetin` : "Aktif dönem bulunmuyor"}
            </p>
          </div>

          {currentPeriod && (
            <Button
              onClick={() => router.push("/tutor/weekly-reports/create")}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 text-white hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Rapor
            </Button>
          )}
        </div>

        {currentPeriod ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {weeklyReports.map((report) => (
              <Card
                key={report.weekNumber}
                className={`border-0 shadow-md hover:shadow-lg transition-all ${
                  report.status === "APPROVED" ? "border-t-4 border-t-green-500" :
                  report.status === "REJECTED" ? "border-t-4 border-t-red-500" :
                  report.status === "SUBMITTED" ? "border-t-4 border-t-yellow-500" :
                  report.id ? "border-t-4 border-t-gray-500" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-indigo-600" />
                      {report.weekNumber}. Hafta
                    </span>
                    {report.status && getStatusIcon(report.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.status ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Durum:</span>
                          {getStatusBadge(report.status)}
                        </div>

                        {report.status === "APPROVED" && report.pointsAwarded > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Puan:</span>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              +{report.pointsAwarded}
                            </Badge>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => router.push(`/tutor/weekly-reports/${report.id}`)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Görüntüle
                          </Button>

                          {(report.status === "DRAFT" || report.status === "SUBMITTED") && (
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => router.push(`/tutor/weekly-reports/${report.id}/edit`)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Düzenle
                            </Button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-3">
                          Henüz rapor oluşturulmamış
                        </p>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => router.push(`/tutor/weekly-reports/create?week=${report.weekNumber}`)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Oluştur
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aktif Dönem Bulunamadı
            </h3>
            <p className="text-gray-600">
              Haftalık rapor oluşturabilmek için aktif bir dönem bulunmalıdır.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}