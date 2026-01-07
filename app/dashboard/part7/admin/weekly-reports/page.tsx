"use client";

import { useAuth } from "@/app/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import { useWeeklyReports, useActivePeriod, useUpdateWeeklyReport } from "@/app/hooks/use-weekly-reports";
import {
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Award,
  Calendar,
  FileText,
  Search,
  RefreshCw,
  Download,
  Trophy,
  Edit,
  Settings
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface WeeklyReport {
  id: string;
  weekNumber: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  submissionDate: Date | null;
  reviewDate: Date | null;
  reviewNotes: string | null;
  pointsAwarded: number;
  comments: string | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
    role: string;
  };
  reviewedBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
  } | null;
}

interface ReportStats {
  total: number;
  byStatus: {
    DRAFT: number;
    SUBMITTED: number;
    APPROVED: number;
    REJECTED: number;
  };
  byRole: {
    TUTOR: number;
    ASISTAN: number;
  };
  totalPointsAwarded: number;
}

interface CurrentPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date | null;
  totalWeeks: number;
}

export default function AdminWeeklyReportsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // ✨ TanStack Query hooks - replaces all useEffect + fetch logic!
  const { data: reports = [], isLoading, error, refetch } = useWeeklyReports();
  const { data: currentPeriod } = useActivePeriod();
  const updateReport = useUpdateWeeklyReport();

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [roleSearchFilter, setRoleSearchFilter] = useState("");
  const [weekFilter, setWeekFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Bulk review
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [bulkReviewStatus, setBulkReviewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [bulkReviewNotes, setBulkReviewNotes] = useState("");
  const [bulkPointsAwarded, setBulkPointsAwarded] = useState(10);

  // Period settings
  const [isPeriodDialogOpen, setIsPeriodDialogOpen] = useState(false);
  const [periodTotalWeeks, setPeriodTotalWeeks] = useState(8);

  const isAdmin = user?.role === "ADMIN";

  // ✨ Calculate stats from reports (derived state, not fetched separately)
  const stats = useMemo(() => {
    if (!reports || reports.length === 0) return null;

    const stats: ReportStats = {
      total: reports.length,
      byStatus: {
        DRAFT: 0,
        SUBMITTED: 0,
        APPROVED: 0,
        REJECTED: 0,
      },
      byRole: {
        TUTOR: 0,
        ASISTAN: 0,
      },
      totalPointsAwarded: 0,
    };

    reports.forEach((report: any) => {
      stats.byStatus[report.status as keyof typeof stats.byStatus]++;
      if (report.user.role === 'TUTOR') stats.byRole.TUTOR++;
      if (report.user.role === 'ASISTAN') stats.byRole.ASISTAN++;
      stats.totalPointsAwarded += report.pointsAwarded || 0;
    });

    return stats;
  }, [reports]);

  // ✨ Apply filters (derived state using useMemo for performance)
  const filteredReports = useMemo(() => {
    let filtered = reports || [];

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((r: any) => r.status === statusFilter);
    }

    if (roleFilter && roleFilter !== "all") {
      filtered = filtered.filter((r: any) => r.user.role === roleFilter);
    }

    if (weekFilter && weekFilter !== "all") {
      filtered = filtered.filter((r: any) => r.weekNumber === parseInt(weekFilter));
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((r: any) =>
        r.user.username?.toLowerCase().includes(term) ||
        r.user.firstName?.toLowerCase().includes(term) ||
        r.user.lastName?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [reports, statusFilter, roleFilter, weekFilter, searchTerm]);

  // ✨ No more fetchReports or applyFilters functions needed!

  // Loading states for mutations
  const [isReviewing, setIsReviewing] = useState(false);
  const [isUpdatingPeriod, setIsUpdatingPeriod] = useState(false);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      DRAFT: "secondary",
      SUBMITTED: "default",
      APPROVED: "default",
      REJECTED: "destructive"
    };

    const labels: Record<string, string> = {
      DRAFT: "Taslak",
      SUBMITTED: "Gönderildi",
      APPROVED: "Onaylandı",
      REJECTED: "Reddedildi"
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const handleBulkReview = async () => {
    if (selectedReports.length === 0) {
      toast.error("Lütfen en az bir rapor seçin.");
      return;
    }

    try {
      setIsReviewing(true);

      const payload = {
        reportIds: selectedReports,
        status: bulkReviewStatus,
        reviewNotes: bulkReviewNotes,
        pointsAwarded: bulkReviewStatus === "APPROVED" ? bulkPointsAwarded : 0,
      };

      const response = await fetch("/api/admin/weekly-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setSelectedReports([]);
        setBulkReviewNotes("");
        refetch(); // Refresh the data with TanStack Query
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error("Error reviewing reports:", error);
      toast.error(error.message || "Raporlar incelenirken hata oluştu.");
    } finally {
      setIsReviewing(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const submittedReports = filteredReports
        .filter(r => r.status === "SUBMITTED")
        .map(r => r.id);
      setSelectedReports(submittedReports);
    } else {
      setSelectedReports([]);
    }
  };

  const handleSelectReport = (reportId: string, checked: boolean) => {
    if (checked) {
      setSelectedReports(prev => [...prev, reportId]);
    } else {
      setSelectedReports(prev => prev.filter(id => id !== reportId));
    }
  };

  const handleUpdatePeriod = async () => {
    if (!currentPeriod) {
      toast.error("Aktif dönem bulunamadı.");
      return;
    }

    if (periodTotalWeeks < 1 || periodTotalWeeks > 52) {
      toast.error("Hafta sayısı 1-52 arasında olmalıdır.");
      return;
    }

    try {
      const response = await fetch(`/api/admin/periods/${currentPeriod.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalWeeks: periodTotalWeeks }),
      });

      if (response.ok) {
        toast.success("Dönem ayarları güncellendi.");
        setIsPeriodDialogOpen(false);
        refetch(); // Refresh data with TanStack Query
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error("Error updating period:", error);
      toast.error(error.message || "Dönem güncellenirken hata oluştu.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
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
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
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

  const submittedReports = filteredReports.filter(r => r.status === "SUBMITTED");

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-white">
      <div className="px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Haftalık Rapor Yönetimi
              </span>
            </h1>
            <p className="text-gray-600">
              {currentPeriod ? `${currentPeriod.name} dönemi rehber raporlarını inceleyin ve yönetin` : "Rapor yönetim paneli"}
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isPeriodDialogOpen} onOpenChange={setIsPeriodDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Dönem Ayarları
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Dönem Ayarları</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="period-name">Dönem Adı</Label>
                    <Input
                      id="period-name"
                      value={currentPeriod?.name || ""}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="total-weeks">Toplam Hafta Sayısı</Label>
                    <Input
                      id="total-weeks"
                      type="number"
                      min="1"
                      max="52"
                      value={periodTotalWeeks}
                      onChange={(e) => setPeriodTotalWeeks(Number(e.target.value))}
                      placeholder="Hafta sayısını girin"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Rehberlerin haftalık rapor doldurabilecekleri hafta sayısını belirler.
                    </p>
                  </div>
                  <Button
                    onClick={handleUpdatePeriod}
                    disabled={isUpdatingPeriod}
                    className="w-full"
                  >
                    {isUpdatingPeriod ? "Güncelleniyor..." : "Kaydet"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Link href="/dashboard/part7/admin/weekly-reports/questions">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Soru Yönetimi
              </Button>
            </Link>
            <Link href="/dashboard/part7/admin/weekly-reports/performance">
              <Button variant="outline">
                <Trophy className="h-4 w-4 mr-2" />
                Performans Raporu
              </Button>
            </Link>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-indigo-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Toplam Rapor</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Bekleyen</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.byStatus.SUBMITTED}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Onaylanan</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.byStatus.APPROVED}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Award className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Verilen Puan</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalPointsAwarded}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Actions */}
        <Card className="border-0 shadow-md mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtreler ve Toplu İşlemler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <Label htmlFor="status-filter">Durum</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tüm durumlar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm durumlar</SelectItem>
                    <SelectItem value="DRAFT">Taslak</SelectItem>
                    <SelectItem value="SUBMITTED">Gönderildi</SelectItem>
                    <SelectItem value="APPROVED">Onaylandı</SelectItem>
                    <SelectItem value="REJECTED">Reddedildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="role-filter">Rol</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tüm roller" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm roller</SelectItem>
                    <SelectItem value="TUTOR">Rehber</SelectItem>
                    <SelectItem value="ASISTAN">Lider</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="week-filter">Hafta</Label>
                <Select value={weekFilter} onValueChange={setWeekFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tüm haftalar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm haftalar</SelectItem>
                    {Array.from({ length: currentPeriod?.totalWeeks || 8 }, (_, i) => i + 1).map(week => (
                      <SelectItem key={week} value={week.toString()}>
                        {week}. Hafta
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="search">Arama</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    id="search"
                    className="pl-9"
                    placeholder="İsim veya açıklama ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {submittedReports.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={selectedReports.length === submittedReports.length && submittedReports.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-gray-600">
                      {selectedReports.length} / {submittedReports.length} rapor seçildi
                    </span>
                  </div>

                  {selectedReports.length > 0 && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>Toplu İnceleme</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Toplu Rapor İncelemesi</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Durum</Label>
                            <Select value={bulkReviewStatus} onValueChange={(value: "APPROVED" | "REJECTED") => setBulkReviewStatus(value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="APPROVED">Onayla</SelectItem>
                                <SelectItem value="REJECTED">Reddet</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {bulkReviewStatus === "APPROVED" && (
                            <div>
                              <Label>Verilecek Puan</Label>
                              <Input
                                type="number"
                                value={bulkPointsAwarded}
                                onChange={(e) => setBulkPointsAwarded(Number(e.target.value))}
                                min="0"
                                max="100"
                              />
                            </div>
                          )}

                          <div>
                            <Label>İnceleme Notları</Label>
                            <Textarea
                              value={bulkReviewNotes}
                              onChange={(e) => setBulkReviewNotes(e.target.value)}
                              placeholder="İsteğe bağlı inceleme notları..."
                              rows={3}
                            />
                          </div>

                          <Button
                            onClick={handleBulkReview}
                            disabled={isReviewing}
                            className="w-full"
                          >
                            {isReviewing ? "İşleniyor..." : `${selectedReports.length} Raporu ${bulkReviewStatus === "APPROVED" ? "Onayla" : "Reddet"}`}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Raporlar ({filteredReports.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredReports.length > 0 ? (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      {report.status === "SUBMITTED" && (
                        <Checkbox
                          checked={selectedReports.includes(report.id)}
                          onCheckedChange={(checked) => handleSelectReport(report.id, !!checked)}
                        />
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {report.user.firstName && report.user.lastName
                              ? `${report.user.firstName} ${report.user.lastName}`
                              : report.user.username}
                          </span>
                          <Badge variant="outline">{report.user.role}</Badge>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">{report.weekNumber}. Hafta</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          {report.submissionDate
                            ? `Gönderildi: ${new Date(report.submissionDate).toLocaleDateString("tr-TR")}`
                            : "Henüz gönderilmedi"}
                          {report.pointsAwarded > 0 && (
                            <>
                              <span>•</span>
                              <Award className="h-3 w-3 text-green-600" />
                              <span className="text-green-600">+{report.pointsAwarded} puan</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {getStatusBadge(report.status)}
                      <div className="flex space-x-2">
                        {(report.status === "DRAFT" || report.status === "SUBMITTED") && (
                          <Link href={`/dashboard/part7/admin/weekly-reports/${report.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3 mr-1" />
                              Düzenle
                            </Button>
                          </Link>
                        )}
                        <Link href={`/dashboard/part7/admin/weekly-reports/${report.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            İncele
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Rapor Bulunamadı
                </h3>
                <p className="text-gray-600">
                  Seçilen kriterlere uygun rapor bulunmuyor.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}