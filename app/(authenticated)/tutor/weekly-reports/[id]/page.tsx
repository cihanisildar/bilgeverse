"use client";

import { useAuth } from "@/app/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, User, Clock, CheckCircle, XCircle, MinusCircle, Edit, Award } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

interface WeeklyReportDetail {
  id: string;
  weekNumber: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  submissionDate: string | null;
  reviewDate: string | null;
  reviewNotes: string | null;
  pointsAwarded: number;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
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
  fixedCriteria: Record<string, string> | null;
  variableCriteria: Record<string, string> | null;
  period: {
    id: string;
    name: string;
  };
}

export default function WeeklyReportDetailPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<WeeklyReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const isTutor = user?.role === "TUTOR";
  const isAsistan = user?.role === "ASISTAN";

  useEffect(() => {
    if (!isAuthenticated || (!isTutor && !isAsistan)) {
      router.push("/login");
      return;
    }

    if (reportId) {
      fetchReport();
    }
  }, [isAuthenticated, isTutor, isAsistan, router, reportId]);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tutor/weekly-reports/${reportId}`);

      if (response.ok) {
        const data = await response.json();
        setReport(data);
      } else if (response.status === 404) {
        setError("Rapor bulunamadı.");
      } else {
        throw new Error("Failed to fetch report");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      setError("Rapor yüklenirken bir hata oluştu.");
      toast.error("Rapor yüklenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
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
      <Badge variant={(variants[status as keyof typeof variants] as "default" | "secondary" | "destructive" | "outline") || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getAttendanceIcon = (value: string) => {
    switch (value) {
      case "YAPILDI":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "YAPILMADI":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "YOKTU":
        return <MinusCircle className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getAttendanceLabel = (value: string) => {
    switch (value) {
      case "YAPILDI":
        return "✓ YAPILDI";
      case "YAPILMADI":
        return "✗ YAPILMADI";
      case "YOKTU":
        return "○ FAALİYET/PROGRAM YOKTU";
      default:
        return value;
    }
  };

  const tutorFixedCriteria = [
    { key: "weeklyMeeting", label: "Haftalık sohbetinize katıldınız mı? (Kendi haftalık sohbetiniz)" },
    { key: "groupMeeting", label: "Haftalık buluşmanıza katıldınız mı? (Dernekte gençlerle buluşma)" },
    { key: "calledAbsentStudents", label: "Gelmeyen öğrencileri aradınız mı?" },
    { key: "curriculumEducation", label: "Müfredat eğitimini işlediniz mi?" },
    { key: "groupActivity", label: "Gurubunuza veya genele bir etkinlik yaptınız mı?" },
    { key: "individualAttention", label: "Haftalık buluşma dışında gurubunuzdaki bir gençle veya gençlerle bir arada bulunup ilgi gösterdiniz mi?" }
  ];

  const asistanFixedCriteria = [
    { key: "weeklyMeetingAsistan", label: "Haftalık sohbetinize katıldınız mı? (Kendi haftalık sohbetiniz)" },
    { key: "groupMeetingAsistan", label: "Haftalık buluşmanıza katıldınız mı? (Dernekte gençlerle buluşma)" },
    { key: "informationMessages", label: "Özel günlerde gurubu bilgilendirme mesajları paylaşıldı mı?" },
    { key: "bilgeverseDataEntry", label: "Bilgeverse'e öğrenci veri girişi yaptınız mı?" },
    { key: "groupActivityAsistan", label: "Gurubunuza veya genele bir etkinlik yaptınız mı?" },
    { key: "individualAttentionAsistan", label: "Haftalık buluşma dışında gurubunuzdaki bir gençle veya gençlerle bir arada bulunup ilgi gösterdiniz mi?" },
    { key: "workshopParticipation", label: "Rehber Yardımcılığının yanında Bir Atölye Sorumlusu ise Atölye Çalışmalarına Katıldı mı?" }
  ];

  const variableCriteria = [
    { key: "internalTraining", label: "Dernek içi eğitim ve programlara katıldınız mı?" },
    { key: "jointActivityLeadership", label: "Ortak faaliyette gurubunuzun başında bulundunuz mu?" },
    { key: "originalActivity", label: "Orijinal bir etkinlik ürettiniz mi?" },
    { key: "parentMeeting", label: "Gençlerin Aileleriyle Tanıştınız mı?" }
  ];

  const calculateAttendanceScore = () => {
    if (!report?.fixedCriteria && !report?.variableCriteria) return 0;

    let totalCriteria = 0;
    let completedCriteria = 0;

    // Count fixed criteria
    if (report.fixedCriteria) {
      const fixedValues = Object.values(report.fixedCriteria).filter(v => v);
      totalCriteria += fixedValues.length;
      completedCriteria += fixedValues.filter(v => v === "YAPILDI").length;
    }

    // Count variable criteria
    if (report.variableCriteria) {
      const variableValues = Object.values(report.variableCriteria).filter(v => v);
      totalCriteria += variableValues.length;
      completedCriteria += variableValues.filter(v => v === "YAPILDI").length;
    }

    return totalCriteria > 0 ? Math.round((completedCriteria / totalCriteria) * 100) : 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-8 w-24" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i}>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-8 w-32" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/tutor/weekly-reports">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri Dön
              </Button>
            </Link>
          </div>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const isOwner = report.user.id === user?.id;
  const fixedCriteria = report.user.role === "TUTOR" ? tutorFixedCriteria : asistanFixedCriteria;
  const filteredVariableCriteria = report.user.role === "TUTOR" ? variableCriteria : variableCriteria.filter(c => c.key !== "parentMeeting");
  const attendanceScore = calculateAttendanceScore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-white">
      <div className="px-4 py-8">
        <div className="mb-8">
          {/* Main Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-purple-50/20 to-pink-50/30"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100/40 to-purple-100/40 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-100/40 to-pink-100/40 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
                    <h1 className="text-4xl font-bold text-gray-900">
                      <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {report.weekNumber}. Hafta {report.user.role === "TUTOR" ? "Rehber" : "Rehber Yardımcısı"} Raporu
                      </span>
                    </h1>
                  </div>
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                      <span className="text-sm font-medium">{report.period.name} dönemi</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                    <span className="text-sm">Rapor Detayı</span>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(report.status)}
                  {attendanceScore > 0 && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                      %{attendanceScore} Katılım
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Link href="/tutor/weekly-reports">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="group hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                    Geri Dön
                  </Button>
                </Link>
                {(report.status === "DRAFT" || report.status === "SUBMITTED" || report.status === "REJECTED") && isOwner && (
                  <Link href={`/tutor/weekly-reports/${report.id}/edit`}>
                    <Button 
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      size="sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Düzenle
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Report Info */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Rapor Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Rapor Sahibi:</span>
                    <span className="font-medium">
                      {report.user.firstName && report.user.lastName
                        ? `${report.user.firstName} ${report.user.lastName}`
                        : report.user.username}
                    </span>
                    <Badge variant="outline">{report.user.role}</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Hafta:</span>
                    <span className="font-medium">{report.weekNumber}. Hafta</span>
                  </div>
                  {report.submissionDate && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Gönderim Tarihi:</span>
                      <span className="font-medium">
                        {new Date(report.submissionDate).toLocaleString("tr-TR")}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {report.reviewDate && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">İnceleme Tarihi:</span>
                      <span className="font-medium">
                        {new Date(report.reviewDate).toLocaleString("tr-TR")}
                      </span>
                    </div>
                  )}
                  {report.reviewedBy && (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">İnceleyen:</span>
                      <span className="font-medium">
                        {report.reviewedBy.firstName && report.reviewedBy.lastName
                          ? `${report.reviewedBy.firstName} ${report.reviewedBy.lastName}`
                          : report.reviewedBy.username}
                      </span>
                    </div>
                  )}
                  {report.pointsAwarded > 0 && (
                    <div className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">Verilen Puan:</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        +{report.pointsAwarded}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fixed Criteria */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Sabit Kriterler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fixedCriteria.map((criterion) => {
                  const value = report.fixedCriteria?.[criterion.key];
                  return (
                    <div key={criterion.key} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-gray-900 leading-relaxed flex-1">
                          {criterion.label}
                        </p>
                        <div className="flex items-center space-x-2 ml-4">
                          {value && getAttendanceIcon(value)}
                          <span className={`text-sm font-medium ${
                            value === "YAPILDI" ? "text-green-600" :
                            value === "YAPILMADI" ? "text-red-600" :
                            "text-gray-600"
                          }`}>
                            {value ? getAttendanceLabel(value) : "Cevaplanmamış"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Variable Criteria */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Değişken Kriterler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredVariableCriteria.map((criterion) => {
                  const value = report.variableCriteria?.[criterion.key];
                  return (
                    <div key={criterion.key} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-gray-900 leading-relaxed flex-1">
                          {criterion.label}
                        </p>
                        <div className="flex items-center space-x-2 ml-4">
                          {value && getAttendanceIcon(value)}
                          <span className={`text-sm font-medium ${
                            value === "YAPILDI" ? "text-green-600" :
                            value === "YAPILMADI" ? "text-red-600" :
                            "text-gray-600"
                          }`}>
                            {value ? getAttendanceLabel(value) : "Cevaplanmamış"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          {report.comments && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Açıklamalar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {report.comments}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Notes */}
          {report.reviewNotes && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>İnceleme Notları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`p-4 rounded-lg ${
                  report.status === "APPROVED" ? "bg-green-50 border border-green-200" :
                  report.status === "REJECTED" ? "bg-red-50 border border-red-200" :
                  "bg-gray-50"
                }`}>
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {report.reviewNotes}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}