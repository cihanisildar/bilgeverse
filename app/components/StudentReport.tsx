"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Activity,
  Award,
  Calendar,
  TrendingUp,
  Users,
  BookOpen,
  MessageCircle,
  Palette,
  Download,
  FileText,
  Clock,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type StudentReportProps = {
  studentId: string;
  studentName?: string;
};

type Student = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  points: number;
  experience: number;
  createdAt: string;
};

type ActivityBreakdown = {
  events: {
    count: number;
    totalPoints: number;
    participations: any[];
  };
  transactions: {
    count: number;
    totalPoints: number;
    totalExperience: number;
    byActivity: {
      [key: string]: { total: number; count: number; transactions: any[] };
    };
    experienceByActivity: {
      [key: string]: { total: number; count: number; transactions: any[] };
    };
  };
};

type OverallStats = {
  totalPoints: number;
  totalExperience: number;
  totalPointsEarned: number;
  totalExperienceEarned: number;
  memberSince: string;
  eventParticipations: number;
  totalTransactions: number;
};

type RecentTransactions = {
  points: any[];
  experience: any[];
};

type ReportData = {
  student: Student;
  activityBreakdown: ActivityBreakdown;
  overallStats: OverallStats;
  recentTransactions: RecentTransactions;
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function StudentReport({
  studentId,
  studentName,
}: StudentReportProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchReportData();
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [studentId]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/student/reports?studentId=${studentId}`
      );
      if (!response.ok) throw new Error("Failed to fetch report data");

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Rapor verileri yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStudentDisplayName = (student: Student) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    }
    return student.username;
  };

  const preparePieChartData = () => {
    if (!reportData) return [];

    const { byActivity } = reportData.activityBreakdown.transactions;
    const eventPoints = reportData.activityBreakdown.events.totalPoints;

    const data = [
      ...Object.entries(byActivity).map(([category, data]) => ({
        name: category,
        value: data.total,
        count: data.count,
      })),
      ...(eventPoints > 0
        ? [
            {
              name: "Etkinlik Katılımı",
              value: eventPoints,
              count: reportData.activityBreakdown.events.count,
            },
          ]
        : []),
    ].filter((item) => item.value > 0);

    return data;
  };

  const prepareActivityBarData = () => {
    if (!reportData) return [];

    const { byActivity } = reportData.activityBreakdown.transactions;

    return Object.entries(byActivity).map(([category, data]) => ({
      activity: category,
      points: data.total,
      count: data.count,
    }));
  };

  const calculateTotalEarned = () => {
    if (!reportData) return 0;
    return (
      reportData.activityBreakdown.events.totalPoints +
      reportData.activityBreakdown.transactions.totalPoints
    );
  };

  const getActivityIcon = (activityName: string) => {
    switch (activityName) {
      case "Sohbet (Karakter Eğitimi)":
        return <MessageCircle className="h-4 w-4" />;
      case "Atölye Faaliyetleri":
        return <Palette className="h-4 w-4" />;
      case "Kitap Okuma":
        return <BookOpen className="h-4 w-4" />;
      case "Etkinlik Katılımı":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (activityName: string) => {
    switch (activityName) {
      case "Sohbet (Karakter Eğitimi)":
        return "bg-blue-100 text-blue-800";
      case "Atölye Faaliyetleri":
        return "bg-green-100 text-green-800";
      case "Kitap Okuma":
        return "bg-purple-100 text-purple-800";
      case "Etkinlik Katılımı":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDownload = async () => {
    if (!reportData) return;

    const studentDisplayName =
      studentName || getStudentDisplayName(reportData.student);
    const totalEarned = calculateTotalEarned();

    try {
      // Create a temporary HTML element with proper styling
      const reportElement = document.createElement('div');
      reportElement.style.width = '794px'; // A4 width in pixels at 96 DPI
      reportElement.style.minHeight = '1123px'; // A4 height in pixels
      reportElement.style.padding = '40px';
      reportElement.style.fontFamily = '"Poppins", "Segoe UI", "Arial", sans-serif';
      reportElement.style.fontSize = '14px';
      reportElement.style.lineHeight = '1.6';
      reportElement.style.color = '#333';
      reportElement.style.backgroundColor = '#ffffff';
      reportElement.style.position = 'absolute';
      reportElement.style.left = '-9999px';
      reportElement.style.top = '0';

      reportElement.innerHTML = `
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 20px; margin: -40px -40px 30px -40px; text-align: center; border-radius: 0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px;">ÖĞRENCİ PERFORMANS RAPORU</h1>
          <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.9;">Rapor Tarihi: ${formatDate(new Date().toISOString())}</p>
        </div>

        <!-- Student Info -->
        <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #22C55E;">
          <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 600; color: #14532D; border-bottom: 2px solid #22C55E; padding-bottom: 5px; display: inline-block;">ÖĞRENCİ BİLGİLERİ</h3>
          <div style="font-size: 13px; line-height: 1.8;">
            <div style="margin-bottom: 6px;">• <strong>Kullanıcı Adı:</strong> ${reportData.student.username}</div>
            <div style="margin-bottom: 6px;">• <strong>Üye Olma Tarihi:</strong> ${formatDate(reportData.student.createdAt)}</div>
            <div style="margin-bottom: 6px;">• <strong>Toplam Kazanılan Puan:</strong> ${reportData.overallStats.totalPointsEarned}</div>
            <div>• <strong>Toplam Kazanılan Deneyim:</strong> ${reportData.overallStats.totalExperienceEarned} XP</div>
          </div>
        </div>

        <!-- Statistics -->
        <div style="background: #F0F9FF; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #0EA5E9;">
          <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 600; color: #0C4A6E; border-bottom: 2px solid #0EA5E9; padding-bottom: 5px; display: inline-block;">ÖZET İSTATİSTİKLERİ</h3>
          <div style="font-size: 13px; line-height: 1.8;">
            <div style="margin-bottom: 8px;">• <strong>Toplam Bilge Parası:</strong> ${reportData.student.points} (Kazanılan: ${totalEarned})</div>
            <div style="margin-bottom: 8px;">• <strong>Toplam Deneyim:</strong> ${reportData.student.experience} XP</div>
            <div style="margin-bottom: 8px;">• <strong>Etkinlik Katılımı:</strong> ${reportData.overallStats.eventParticipations} etkinlik</div>
            <div style="margin-bottom: 8px;">• <strong>Toplam İşlem Sayısı:</strong> ${reportData.overallStats.totalTransactions}</div>
            <div>• <strong>Aktiflik Skoru:</strong> ${Math.round((reportData.overallStats.eventParticipations + reportData.overallStats.totalTransactions) / 2)} puan</div>
          </div>
        </div>

        <!-- Activities -->
        <div style="background: #FAF5FF; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #A855F7;">
          <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 600; color: #7C2D12; border-bottom: 2px solid #A855F7; padding-bottom: 5px; display: inline-block;">AKTİVİTE DAĞILIMI</h3>
          <div style="font-size: 13px; line-height: 1.8;">
            ${Object.entries(reportData.activityBreakdown.transactions.byActivity).map(([activity, data]) => 
              `<div style="margin-bottom: 6px;">• <strong>${activity}:</strong> ${data.total} puan (${data.count} aktivite)</div>`
            ).join('')}
            ${reportData.activityBreakdown.events.totalPoints > 0 ? 
              `<div style="margin-bottom: 6px;">• <strong>Etkinlik Katılımı:</strong> ${reportData.activityBreakdown.events.totalPoints} puan (${reportData.activityBreakdown.events.count} etkinlik)</div>`
              : ''
            }
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; font-size: 11px; color: #64748B; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
          <p style="margin: 0 0 5px 0;">Bu rapor BilgeVerse sistemi tarafından otomatik olarak oluşturulmuştur.</p>
          <p style="margin: 0;">Oluşturulma Tarihi: ${new Date().toLocaleString("tr-TR")} | Sayfa 1</p>
        </div>
      `;

      // Add to DOM temporarily
      document.body.appendChild(reportElement);

      // Wait for fonts to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Convert to canvas
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123
      });

      // Remove from DOM
      document.body.removeChild(reportElement);

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      // Add image to PDF (A4 size: 210 x 297 mm)
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);

      // Save PDF
      pdf.save(`${studentDisplayName}-raporu-${new Date().toISOString().split("T")[0]}.pdf`);

      toast.success("Mükemmel PDF raporu başarıyla indirildi!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("PDF oluşturulurken bir hata oluştu");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Rapor verileri yüklenemedi</p>
      </div>
    );
  }

  const pieChartData = preparePieChartData();
  const barChartData = prepareActivityBarData();
  const totalEarned = calculateTotalEarned();

  return (
    <div className="space-y-8 sm:space-y-10">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 sm:space-y-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-0">
          <div className="flex-1" />
          <TabsList className="grid w-full max-w-full lg:max-w-lg grid-cols-2 sm:grid-cols-4 h-auto sm:h-12 bg-white/70 backdrop-blur-sm border-white/20 shadow-lg rounded-xl p-1">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-1 sm:gap-2 rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg p-2 sm:p-3"
            >
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Analitik</span>
              <span className="sm:hidden">Analiz</span>
            </TabsTrigger>
            <TabsTrigger
              value="activities"
              className="flex items-center gap-1 sm:gap-2 rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg p-2 sm:p-3"
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Aktiviteler</span>
              <span className="sm:hidden">Aktivite</span>
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="flex items-center gap-1 sm:gap-2 rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-lg p-2 sm:p-3"
            >
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Geçmiş</span>
              <span className="sm:hidden">Geçmiş</span>
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="flex items-center gap-1 sm:gap-2 rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg p-2 sm:p-3"
            >
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Etkinlikler</span>
              <span className="sm:hidden">Etkinlik</span>
            </TabsTrigger>
          </TabsList>
          <div className="flex-1 flex justify-start lg:justify-end">
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-white/70 backdrop-blur-sm border-white/20 hover:bg-white/90 shadow-sm text-xs sm:text-sm px-3 sm:px-4 py-2"
              onClick={handleDownload}
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Raporu İndir</span>
              <span className="sm:hidden">İndir</span>
            </Button>
          </div>
        </div>

        {/* Analytics Overview Tab */}
        <TabsContent value="overview" className="space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
            {/* Enhanced Pie Chart */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="pb-4 sm:pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg text-white">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Aktivite Dağılımı</CardTitle>
                    <CardDescription className="text-sm">
                      Bilge para kazanım kaynaklarının analizi
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {pieChartData.length > 0 ? (
                  <div className="h-80 sm:h-96 p-2 sm:p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={isMobile ? 70 : 100}
                          innerRadius={isMobile ? 28 : 40}
                          fill="#8884d8"
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [`${value} puan`, "Toplam"]}
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: "12px",
                            backdropFilter: "blur(8px)",
                            padding: "8px 12px",
                            fontSize: "12px",
                          }}
                        />
                        <Legend 
                          wrapperStyle={{
                            paddingTop: "15px",
                            fontSize: isMobile ? "12px" : "14px"
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 sm:h-96 flex flex-col items-center justify-center text-gray-500">
                    <Activity className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mb-4" />
                    <p className="text-base sm:text-lg font-medium text-center">
                      Henüz aktivite verisi bulunmuyor
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400 text-center">
                      Öğrenci aktivitelere katıldıkça burada görünecek
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Performance Metrics */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="pb-4 sm:pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">
                      Performans Metrikleri
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Detaylı aktivite performansı
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 sm:space-y-8 pt-0">
                {/* Enhanced Metrics Cards */}
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-4 sm:p-6 text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-blue-700 mb-2">
                        {reportData.overallStats.eventParticipations}
                      </div>
                      <p className="text-xs sm:text-sm text-blue-600 font-medium">Etkinlik Katılımı</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4 sm:p-6 text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-green-700 mb-2">
                        {reportData.overallStats.totalTransactions}
                      </div>
                      <p className="text-xs sm:text-sm text-green-600 font-medium">Toplam İşlem</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-4 sm:p-6 text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-purple-700 mb-2">
                        {Math.round(
                          (reportData.overallStats.eventParticipations +
                            reportData.overallStats.totalTransactions) /
                            2
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-purple-600 font-medium">Aktiflik Skoru</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardContent className="p-4 sm:p-6 text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-orange-700 mb-2">
                        {totalEarned}
                      </div>
                      <p className="text-xs sm:text-sm text-orange-600 font-medium">Kazanılan Puan</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Activity Efficiency */}
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="font-semibold text-gray-800 text-base sm:text-lg">
                    Aktivite Verimliliği
                  </h4>
                  {Object.entries(
                    reportData.activityBreakdown.transactions.byActivity
                  ).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(
                        reportData.activityBreakdown.transactions.byActivity
                      ).map(([activity, data]) => (
                        <div
                          key={activity}
                          className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${getActivityColor(
                                activity
                              )}`}
                            >
                              {getActivityIcon(activity)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-xs sm:text-sm truncate">{activity}</p>
                              <p className="text-xs text-gray-500">
                                {data.count} aktivite
                              </p>
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="font-bold text-gray-800 text-base sm:text-lg">
                              {data.total}
                            </div>
                            <p className="text-xs text-gray-500">puan</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8 text-gray-500">
                      <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm">Henüz aktivite bulunmuyor</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Enhanced Activities Tab */}
        <TabsContent value="activities" className="space-y-6 sm:space-y-8">
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader className="pb-4 sm:pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl">Aktivite Dağılımı</CardTitle>
                  <CardDescription className="text-sm">
                    Her aktivite türünden kazanılan puanların detaylı analizi
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {barChartData.length > 0 ? (
                <div className="h-80 sm:h-96 mb-6 sm:mb-8 p-2 sm:p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={barChartData}
                      margin={{ 
                        top: 20, 
                        right: isMobile ? 10 : 30, 
                        left: isMobile ? 10 : 20, 
                        bottom: isMobile ? 80 : 100 
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="activity"
                        tick={{ fontSize: isMobile ? 10 : 11, fontWeight: 500 }}
                        angle={isMobile ? -45 : -35}
                        textAnchor="end"
                        height={isMobile ? 80 : 100}
                        interval={0}
                        label={{ 
                          value: 'Aktivite Türü', 
                          position: 'insideBottom', 
                          offset: isMobile ? -5 : -10,
                          style: { 
                            textAnchor: 'middle', 
                            fontSize: isMobile ? '12px' : '14px', 
                            fontWeight: 'bold' 
                          }
                        }}
                      />
                      <YAxis 
                        tick={{ fontSize: isMobile ? 10 : 11, fontWeight: 500 }}
                        label={{ 
                          value: 'Puan', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { 
                            textAnchor: 'middle', 
                            fontSize: isMobile ? '12px' : '14px', 
                            fontWeight: 'bold' 
                          }
                        }}
                      />
                      <Tooltip
                        formatter={(value, name) => [`${value} puan`, "Toplam"]}
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "12px",
                          backdropFilter: "blur(8px)",
                          padding: "8px 12px",
                          fontSize: isMobile ? "12px" : "14px",
                        }}
                      />
                      <Bar
                        dataKey="points"
                        fill="url(#gradient)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={isMobile ? 40 : 60}
                      />
                      <defs>
                        <linearGradient
                          id="gradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3B82F6"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#1D4ED8"
                            stopOpacity={0.6}
                          />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 sm:h-96 flex flex-col items-center justify-center text-gray-500">
                  <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mb-4" />
                  <p className="text-base sm:text-lg font-medium text-center">
                    Henüz aktivite verisi bulunmuyor
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 text-center">
                    Aktiviteler başladıkça burada görünecek
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Enhanced Points Transactions */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="pb-4 sm:pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg text-white">
                    <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Puan İşlemleri</CardTitle>
                    <CardDescription className="text-sm">
                      Son bilge para kazanım geçmişi
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
                  {reportData.recentTransactions.points.length > 0 ? (
                    reportData.recentTransactions.points.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 sm:p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <div className="p-2 bg-green-500 rounded-lg text-white">
                            <Award className="h-3 w-3 sm:h-4 sm:w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-xs sm:text-sm text-gray-800 truncate">
                              {transaction.reason}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDateTime(transaction.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-green-500 text-white font-semibold px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm ml-2">
                          +{transaction.points}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 sm:py-16 text-gray-500">
                      <Award className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-base sm:text-lg font-medium">
                        Henüz puan işlemi bulunmuyor
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400 mt-2">
                        İlk aktivite sonrası burada görünecek
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Experience Transactions */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="pb-4 sm:pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg text-white">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Deneyim İşlemleri</CardTitle>
                    <CardDescription className="text-sm">
                      Son deneyim kazanım geçmişi
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
                  {reportData.recentTransactions.experience.length > 0 ? (
                    reportData.recentTransactions.experience.map(
                      (transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-3 sm:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                            <div className="p-2 bg-blue-500 rounded-lg text-white">
                              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-xs sm:text-sm text-gray-800">
                                Deneyim Eklendi
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDateTime(transaction.createdAt)}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-blue-500 text-white font-semibold px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm ml-2">
                            +{transaction.amount}
                          </Badge>
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-center py-12 sm:py-16 text-gray-500">
                      <TrendingUp className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-base sm:text-lg font-medium">
                        Henüz deneyim işlemi bulunmuyor
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400 mt-2">
                        İlk aktivite sonrası burada görünecek
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Enhanced Events Tab */}
        <TabsContent value="events" className="space-y-6 sm:space-y-8">
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader className="pb-4 sm:pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg text-white">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl">
                    Etkinlik Katılımları
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Öğrencinin katıldığı tüm etkinlikler ve kazanımlar
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4 sm:space-y-5 max-h-80 sm:max-h-96 overflow-y-auto">
                {reportData.activityBreakdown.events.participations.length >
                0 ? (
                  reportData.activityBreakdown.events.participations.map(
                    (participation) => (
                      <div
                        key={participation.id}
                        className="p-3 sm:p-5 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 sm:gap-4 mb-3">
                              <div className="p-2 bg-orange-500 rounded-lg text-white">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                                  {participation.event.title}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                  {formatDateTime(
                                    participation.event.startDateTime
                                  )}
                                </p>
                              </div>
                            </div>

                            {participation.event.tags &&
                              participation.event.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 sm:gap-2 mt-3 sm:mt-4">
                                  {participation.event.tags.map(
                                    (tag: string, index: number) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs bg-white/70 border-orange-300 text-orange-700 px-2 sm:px-3 py-1"
                                      >
                                        {tag}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              )}
                          </div>

                          <div className="text-left sm:text-right sm:ml-6">
                            <Badge className="bg-orange-500 text-white font-semibold px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm">
                              +{participation.event.points || 0}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <div className="text-center py-12 sm:py-16 text-gray-500">
                    <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-base sm:text-lg font-medium">
                      Henüz etkinlik katılımı bulunmuyor
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-2">
                      İlk etkinliğe katıldıktan sonra burada görünecek
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
