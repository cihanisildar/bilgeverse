"use client";

import { useAuth } from "@/app/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { Save, Send, ArrowLeft, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

interface WeeklyReportDetail {
  id: string;
  weekNumber: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  comments: string | null;
  fixedCriteria: Record<string, string> | null;
  variableCriteria: Record<string, string> | null;
  user: {
    role: string;
  };
  period: {
    id: string;
    name: string;
  };
}

interface FormData {
  fixedCriteria: Record<string, string>;
  variableCriteria: Record<string, string>;
  comments: string;
}

export default function EditWeeklyReportPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<WeeklyReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<FormData>({
    fixedCriteria: {},
    variableCriteria: {},
    comments: ""
  });

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

        // Initialize form data
        setFormData({
          fixedCriteria: data.fixedCriteria || {},
          variableCriteria: data.variableCriteria || {},
          comments: data.comments || ""
        });
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
    ...(isTutor ? [{ key: "parentMeeting", label: "Gençlerin Aileleriyle Tanıştınız mı?" }] : [])
  ];

  const attendanceOptions = [
    { value: "YAPILDI", label: "✓ YAPILDI", icon: CheckCircle, color: "text-green-600" },
    { value: "YAPILMADI", label: "✗ YAPILMADI", icon: XCircle, color: "text-red-600" },
    { value: "YOKTU", label: "○ FAALİYET/PROGRAM YOKTU", icon: MinusCircle, color: "text-gray-600" }
  ];

  const handleFixedCriteriaChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      fixedCriteria: { ...prev.fixedCriteria, [key]: value }
    }));
  };

  const handleVariableCriteriaChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      variableCriteria: { ...prev.variableCriteria, [key]: value }
    }));
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!report) return;

    try {
      setIsSaving(true);

      const payload = {
        ...formData,
        status: isDraft ? "DRAFT" : "SUBMITTED"
      };

      const response = await fetch(`/api/tutor/weekly-reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(isDraft ? "Rapor taslak olarak kaydedildi." : "Rapor başarıyla gönderildi.");
        router.push("/tutor/weekly-reports");
      } else {
        const error = await response.json();
        throw new Error(error.message || "Rapor kaydedilirken hata oluştu.");
      }
    } catch (error: any) {
      console.error("Error saving report:", error);
      toast.error(error.message || "Rapor kaydedilirken hata oluştu.");
    } finally {
      setIsSaving(false);
    }
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
            {Array.from({ length: 3 }).map((_, index) => (
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

  if (report.status !== "DRAFT") {
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
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg shadow-sm">
            Bu rapor sadece taslak durumunda düzenlenebilir.
          </div>
        </div>
      </div>
    );
  }

  const fixedCriteria = report.user.role === "TUTOR" ? tutorFixedCriteria : asistanFixedCriteria;

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
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {report.weekNumber}. Hafta Raporu Düzenle
              </span>
            </h1>
            <p className="text-gray-600">
              {report.period.name} dönemi - {report.user.role === "TUTOR" ? "Rehber" : "Rehber Yardımcısı"} Raporu
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Fixed Criteria */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Sabit Kriterler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {fixedCriteria.map((criterion) => (
                <div key={criterion.key} className="space-y-3">
                  <Label className="text-sm font-medium leading-relaxed">
                    {criterion.label}
                  </Label>
                  <RadioGroup
                    value={formData.fixedCriteria[criterion.key] || ""}
                    onValueChange={(value) => handleFixedCriteriaChange(criterion.key, value)}
                    className="flex flex-col space-y-2"
                  >
                    {attendanceOptions.slice(0, 2).map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`${criterion.key}-${option.value}`} />
                          <Label
                            htmlFor={`${criterion.key}-${option.value}`}
                            className={`flex items-center space-x-2 cursor-pointer ${option.color}`}
                          >
                            <IconComponent className="h-4 w-4" />
                            <span>{option.label}</span>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Variable Criteria */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Değişken Kriterler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {variableCriteria.map((criterion) => (
                <div key={criterion.key} className="space-y-3">
                  <Label className="text-sm font-medium leading-relaxed">
                    {criterion.label}
                  </Label>
                  <RadioGroup
                    value={formData.variableCriteria[criterion.key] || ""}
                    onValueChange={(value) => handleVariableCriteriaChange(criterion.key, value)}
                    className="flex flex-col space-y-2"
                  >
                    {attendanceOptions.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`${criterion.key}-${option.value}`} />
                          <Label
                            htmlFor={`${criterion.key}-${option.value}`}
                            className={`flex items-center space-x-2 cursor-pointer ${option.color}`}
                          >
                            <IconComponent className="h-4 w-4" />
                            <span>{option.label}</span>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Açıklamalar</CardTitle>
              <p className="text-sm text-gray-600">
                Kriterdeki işaretlerin gerekçeleri veya tabloda yer almayan ek faaliyetlerin belirtilmesi için
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={`${report.weekNumber}. hafta için açıklamalarınızı buraya yazın...`}
                value={formData.comments}
                onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                rows={6}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={isSaving}
              className="flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Taslak Kaydet
            </Button>
            <Button
              onClick={() => handleSubmit(false)}
              disabled={isSaving}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 flex items-center"
            >
              <Send className="h-4 w-4 mr-2" />
              Gönder
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}