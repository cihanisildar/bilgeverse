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
import { useState, useEffect } from "react";
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
  submissionDate: string | null;
  reviewDate: string | null;
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
  startDate: string;
  endDate: string | null;
}

export default function AdminWeeklyReportsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<WeeklyReport[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<CurrentPeriod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);

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

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.push("/login");
      return;
    }

    fetchReports();
  }, [isAuthenticated, isAdmin, router]);

  useEffect(() => {
    applyFilters();
  }, [reports, statusFilter, roleFilter, weekFilter, searchTerm]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);

      const queryParams = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") queryParams.append("status", statusFilter);
      if (roleFilter && roleFilter !== "all") queryParams.append("role", roleFilter);
      if (weekFilter && weekFilter !== "all") queryParams.append("week", weekFilter);

      const response = await fetch(`/api/admin/weekly-reports?${queryParams}`);

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
        setStats(data.stats);
        setCurrentPeriod(data.period);
      } else {
        throw new Error("Failed to fetch reports");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Raporlar yüklenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reports];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(report =>
        report.user.firstName?.toLowerCase().includes(term) ||
        report.user.lastName?.toLowerCase().includes(term) ||
        report.user.username.toLowerCase().includes(term) ||
        report.comments?.toLowerCase().includes(term)
      );
    }

    setFilteredReports(filtered);
  };

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
        fetchReports(); // Refresh the data
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
            <Link href="/admin/weekly-reports/questions">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Soru Yönetimi
              </Button>
            </Link>
            <Link href="/admin/weekly-reports/performance">
              <Button variant="outline">
                <Trophy className="h-4 w-4 mr-2" />
                Performans Raporu
              </Button>
            </Link>
            <Button onClick={fetchReports} variant="outline">
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
                    <SelectItem value="ASISTAN">Rehber Yardımcısı</SelectItem>
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
                    {Array.from({ length: 8 }, (_, i) => i + 1).map(week => (
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
                          <Link href={`/admin/weekly-reports/${report.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3 mr-1" />
                              Düzenle
                            </Button>
                          </Link>
                        )}
                        <Link href={`/admin/weekly-reports/${report.id}`}>
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