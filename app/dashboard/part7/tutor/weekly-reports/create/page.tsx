"use client";

import { useAuth } from "@/app/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Save, Send, ArrowLeft, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

interface FormData {
  weekNumber: number;
  fixedCriteria: Record<string, string>;
  variableCriteria: Record<string, string>;
  comments: string;
  questionResponses: Array<{
    questionId: string;
    response: string;
  }>;
}

interface CurrentPeriod {
  id: string;
  name: string;
  totalWeeks: number;
}

interface WeeklyReportQuestion {
  id: string;
  text: string;
  type: "FIXED" | "VARIABLE";
  targetRole: "TUTOR" | "ASISTAN";
  orderIndex: number;
}

interface QuestionsData {
  questions: {
    FIXED: WeeklyReportQuestion[];
    VARIABLE: WeeklyReportQuestion[];
  };
  pointsPerQuestion: number;
}

export default function CreateWeeklyReportPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedWeek = searchParams.get("week");

  const [currentPeriod, setCurrentPeriod] = useState<CurrentPeriod | null>(null);
  const [questions, setQuestions] = useState<QuestionsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    weekNumber: selectedWeek ? parseInt(selectedWeek) : 1,
    fixedCriteria: {},
    variableCriteria: {},
    comments: "",
    questionResponses: []
  });

  const isTutor = user?.role === "TUTOR";
  const isAsistan = user?.role === "ASISTAN";

  useEffect(() => {
    if (!isAuthenticated || (!isTutor && !isAsistan)) {
      router.push("/login");
      return;
    }

    fetchCurrentPeriod();
    fetchQuestions();
  }, [isAuthenticated, isTutor, isAsistan, router]);

  const fetchCurrentPeriod = async () => {
    try {
      const response = await fetch("/api/periods/current");
      if (response.ok) {
        const data = await response.json();
        setCurrentPeriod(data);
      }
    } catch (error) {
      console.error("Error fetching current period:", error);
      toast.error("Aktif dönem bilgisi alınırken hata oluştu.");
    }
  };

  const fetchQuestions = async () => {
    try {
      setIsLoadingQuestions(true);
      const response = await fetch("/api/tutor/weekly-reports/questions", {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data);

        // Initialize question responses in form data
        const allQuestions = [...data.questions.FIXED, ...data.questions.VARIABLE];
        const questionResponses = allQuestions.map(question => ({
          questionId: question.id,
          response: ""
        }));

        setFormData(prev => ({
          ...prev,
          questionResponses
        }));
      } else {
        console.error("Failed to fetch questions");
        toast.error("Sorular yüklenirken hata oluştu.");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Sorular yüklenirken hata oluştu.");
    } finally {
      setIsLoadingQuestions(false);
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
    { key: "workshopParticipation", label: "Liderliğin yanında Bir Atölye Sorumlusu ise Atölye Çalışmalarına Katıldı mı?" }
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

  const handleQuestionResponseChange = (questionId: string, response: string) => {
    setFormData(prev => ({
      ...prev,
      questionResponses: prev.questionResponses.map(qr =>
        qr.questionId === questionId ? { ...qr, response } : qr
      )
    }));
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!currentPeriod) {
      toast.error("Aktif dönem bulunamadı.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        periodId: currentPeriod.id,
        status: isDraft ? "DRAFT" : "SUBMITTED"
      };

      const response = await fetch("/api/tutor/weekly-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(isDraft ? "Rapor taslak olarak kaydedildi." : "Rapor başarıyla gönderildi.");
        router.push("/dashboard/part7/tutor/weekly-reports");
      } else {
        const error = await response.json();
        throw new Error(error.message || "Rapor kaydedilirken hata oluştu.");
      }
    } catch (error: any) {
      console.error("Error saving report:", error);
      toast.error(error.message || "Rapor kaydedilirken hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const fixedCriteria = isTutor ? tutorFixedCriteria : asistanFixedCriteria;

  // Calculate progress based on answered questions
  const calculateProgress = () => {
    if (questions) {
      // Use dynamic questions
      const totalQuestions = questions.questions.FIXED.length + questions.questions.VARIABLE.length;
      const answeredQuestions = formData.questionResponses.filter(qr => qr.response !== "").length;
      return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
    } else {
      // Fallback to static criteria
      const totalQuestions = fixedCriteria.length + variableCriteria.length;
      const answeredFixed = Object.values(formData.fixedCriteria).filter(value => value !== "").length;
      const answeredVariable = Object.values(formData.variableCriteria).filter(value => value !== "").length;
      const totalAnswered = answeredFixed + answeredVariable;
      return Math.round((totalAnswered / totalQuestions) * 100);
    }
  };

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Sticky Progress Bar */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-semibold text-slate-700">Form İlerlemesi</h3>
              <div className="w-48 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">{progress}%</span>
              <p className="text-xs text-slate-500">
                {progress === 0 ? "Başlayın" :
                  progress < 50 ? "Yarı yoldasınız!" :
                    progress < 100 ? "Neredeyse bitti!" :
                      "Tamamlandı!"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-8 lg:px-8">
        {/* Header Section */}
        <div className="mb-12">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/dashboard/part7/tutor/weekly-reports">
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-slate-100 transition-colors duration-200 text-slate-600 hover:text-slate-800 group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                Geri Dön
              </Button>
            </Link>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-slate-600 font-medium text-sm">
                  {currentPeriod ? `${currentPeriod.name} dönemi` : "Aktif dönem yok"}
                </p>
              </div>
              <p className="text-xs text-slate-500">Haftalık Rapor Formu</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Yeni {isTutor ? "Rehber" : "Lider"} Raporu
              </span>
            </h1>
            <p className="text-slate-600 text-lg">Haftalık faaliyetlerinizi raporlayın</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Week Selection */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                Hafta Seçimi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.weekNumber.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, weekNumber: parseInt(value) }))}
              >
                <SelectTrigger className="w-full h-12 text-base border-slate-200 hover:border-indigo-300 focus:border-indigo-500 transition-colors">
                  <SelectValue placeholder="Hafta seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: currentPeriod?.totalWeeks || 8 }, (_, i) => i + 1).map(week => (
                    <SelectItem key={week} value={week.toString()} className="text-base py-3">
                      {week}. Hafta
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoadingQuestions && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Sorular yükleniyor...</p>
              </CardContent>
            </Card>
          )}

          {/* Dynamic Questions */}
          {!isLoadingQuestions && questions && (
            <>
              {/* Fixed Questions */}
              {questions.questions.FIXED.length > 0 && (
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
                      Sabit Kriterler
                    </CardTitle>
                    <p className="text-slate-600 text-sm">Her hafta düzenli olarak yapılması gereken faaliyetler (Her soru 10 puan)</p>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {questions.questions.FIXED.map((question, index) => {
                      const currentResponse = formData.questionResponses.find(qr => qr.questionId === question.id);
                      return (
                        <div key={question.id} className="space-y-4 p-6 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors duration-200">
                          <Label className="text-base font-medium leading-relaxed text-slate-700 block">
                            {question.text}
                          </Label>
                          <RadioGroup
                            value={currentResponse?.response || ""}
                            onValueChange={(value) => handleQuestionResponseChange(question.id, value)}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                          >
                            {attendanceOptions.slice(0, 2).map((option) => {
                              const IconComponent = option.icon;
                              const isSelected = currentResponse?.response === option.value;
                              return (
                                <div key={option.value} className="relative">
                                  <RadioGroupItem
                                    value={option.value}
                                    id={`${question.id}-${option.value}`}
                                    className="sr-only"
                                  />
                                  <Label
                                    htmlFor={`${question.id}-${option.value}`}
                                    className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${isSelected
                                        ? option.value === "YAPILDI"
                                          ? "border-green-500 bg-green-50 shadow-md"
                                          : "border-red-500 bg-red-50 shadow-md"
                                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                                      }`}
                                  >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${isSelected
                                        ? option.value === "YAPILDI"
                                          ? "border-green-500 bg-green-500"
                                          : "border-red-500 bg-red-500"
                                        : "border-slate-300"
                                      }`}>
                                      {isSelected && (
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                      )}
                                    </div>
                                    <IconComponent className={`h-5 w-5 ${option.color}`} />
                                    <span className={`font-medium ${option.color}`}>{option.label}</span>
                                  </Label>
                                </div>
                              );
                            })}
                          </RadioGroup>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Variable Questions */}
              {questions.questions.VARIABLE.length > 0 && (
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
                      Değişken Kriterler
                    </CardTitle>
                    <p className="text-slate-600 text-sm">Dönemsel ve özel faaliyetler (Her soru 10 puan)</p>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {questions.questions.VARIABLE.map((question, index) => {
                      const currentResponse = formData.questionResponses.find(qr => qr.questionId === question.id);
                      return (
                        <div key={question.id} className="space-y-4 p-6 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors duration-200">
                          <Label className="text-base font-medium leading-relaxed text-slate-700 block">
                            {question.text}
                          </Label>
                          <RadioGroup
                            value={currentResponse?.response || ""}
                            onValueChange={(value) => handleQuestionResponseChange(question.id, value)}
                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                          >
                            {attendanceOptions.map((option) => {
                              const IconComponent = option.icon;
                              const isSelected = currentResponse?.response === option.value;
                              return (
                                <div key={option.value} className="relative">
                                  <RadioGroupItem
                                    value={option.value}
                                    id={`${question.id}-${option.value}`}
                                    className="sr-only"
                                  />
                                  <Label
                                    htmlFor={`${question.id}-${option.value}`}
                                    className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${isSelected
                                        ? option.value === "YAPILDI"
                                          ? "border-green-500 bg-green-50 shadow-md"
                                          : option.value === "YAPILMADI"
                                            ? "border-red-500 bg-red-50 shadow-md"
                                            : "border-gray-500 bg-gray-50 shadow-md"
                                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                                      }`}
                                  >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${isSelected
                                        ? option.value === "YAPILDI"
                                          ? "border-green-500 bg-green-500"
                                          : option.value === "YAPILMADI"
                                            ? "border-red-500 bg-red-500"
                                            : "border-gray-500 bg-gray-500"
                                        : "border-slate-300"
                                      }`}>
                                      {isSelected && (
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                      )}
                                    </div>
                                    <IconComponent className={`h-5 w-5 ${option.color}`} />
                                    <span className={`font-medium ${option.color}`}>{option.label}</span>
                                  </Label>
                                </div>
                              );
                            })}
                          </RadioGroup>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Fallback to static criteria if no questions loaded */}
          {!isLoadingQuestions && !questions && (
            <>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
                    Sabit Kriterler
                  </CardTitle>
                  <p className="text-slate-600 text-sm">Her hafta düzenli olarak yapılması gereken faaliyetler</p>
                </CardHeader>
                <CardContent className="space-y-8">
                  {fixedCriteria.map((criterion, index) => (
                    <div key={criterion.key} className="space-y-4 p-6 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors duration-200">
                      <Label className="text-base font-medium leading-relaxed text-slate-700 block">
                        {criterion.label}
                      </Label>
                      <RadioGroup
                        value={formData.fixedCriteria[criterion.key] || ""}
                        onValueChange={(value) => handleFixedCriteriaChange(criterion.key, value)}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        {attendanceOptions.slice(0, 2).map((option) => {
                          const IconComponent = option.icon;
                          const isSelected = formData.fixedCriteria[criterion.key] === option.value;
                          return (
                            <div key={option.value} className="relative">
                              <RadioGroupItem
                                value={option.value}
                                id={`${criterion.key}-${option.value}`}
                                className="sr-only"
                              />
                              <Label
                                htmlFor={`${criterion.key}-${option.value}`}
                                className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${isSelected
                                    ? option.value === "YAPILDI"
                                      ? "border-green-500 bg-green-50 shadow-md"
                                      : "border-red-500 bg-red-50 shadow-md"
                                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                                  }`}
                              >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${isSelected
                                    ? option.value === "YAPILDI"
                                      ? "border-green-500 bg-green-500"
                                      : "border-red-500 bg-red-500"
                                    : "border-slate-300"
                                  }`}>
                                  {isSelected && (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  )}
                                </div>
                                <IconComponent className={`h-5 w-5 ${option.color}`} />
                                <span className={`font-medium ${option.color}`}>{option.label}</span>
                              </Label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Variable Criteria (Static fallback) */}
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
                    Değişken Kriterler
                  </CardTitle>
                  <p className="text-slate-600 text-sm">Opsiyonel faaliyetler ve ek görevler</p>
                </CardHeader>
                <CardContent className="space-y-8">
                  {variableCriteria.map((criterion, index) => (
                    <div key={criterion.key} className="space-y-4 p-6 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors duration-200">
                      <Label className="text-base font-medium leading-relaxed text-slate-700 block">
                        {criterion.label}
                      </Label>
                      <RadioGroup
                        value={formData.variableCriteria[criterion.key] || ""}
                        onValueChange={(value) => handleVariableCriteriaChange(criterion.key, value)}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                      >
                        {attendanceOptions.map((option) => {
                          const IconComponent = option.icon;
                          const isSelected = formData.variableCriteria[criterion.key] === option.value;
                          return (
                            <div key={option.value} className="relative">
                              <RadioGroupItem
                                value={option.value}
                                id={`${criterion.key}-${option.value}`}
                                className="sr-only"
                              />
                              <Label
                                htmlFor={`${criterion.key}-${option.value}`}
                                className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${isSelected
                                    ? option.value === "YAPILDI"
                                      ? "border-green-500 bg-green-50 shadow-md"
                                      : option.value === "YAPILMADI"
                                        ? "border-red-500 bg-red-50 shadow-md"
                                        : "border-gray-500 bg-gray-50 shadow-md"
                                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                                  }`}
                              >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${isSelected
                                    ? option.value === "YAPILDI"
                                      ? "border-green-500 bg-green-500"
                                      : option.value === "YAPILMADI"
                                        ? "border-red-500 bg-red-500"
                                        : "border-gray-500 bg-gray-500"
                                    : "border-slate-300"
                                  }`}>
                                  {isSelected && (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  )}
                                </div>
                                <IconComponent className={`h-5 w-5 ${option.color}`} />
                                <span className={`font-medium text-sm ${option.color}`}>{option.label}</span>
                              </Label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          {/* Comments */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-violet-500 to-purple-500 rounded-full"></div>
                Açıklamalar
              </CardTitle>
              <p className="text-slate-600 text-sm">
                Kriterdeki işaretlerin gerekçeleri veya tabloda yer almayan ek faaliyetlerin belirtilmesi için
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={`${formData.weekNumber}. hafta için açıklamalarınızı buraya yazın...`}
                value={formData.comments}
                onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                rows={6}
                className="resize-none border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-colors text-base"
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end pt-8 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => handleSubmit(true)}
                disabled={isLoading}
                className="flex items-center justify-center h-12 px-8 text-base font-medium border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Save className="h-5 w-5 mr-2" />
                Taslak Kaydet
              </Button>
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isLoading}
                className="text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 flex items-center justify-center h-12 px-8 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              >
                <Send className="h-5 w-5 mr-2" />
                Gönder
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}