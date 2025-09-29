'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Award,
  BookOpen,
  Download,
  GraduationCap,
  PieChart,
  RefreshCw,
  School,
  Search,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type PeriodReportData = {
  metadata: {
    generatedAt: string;
    periodInfo: {
      name: string;
      description: string;
      startDate: string;
      endDate: string;
    };
    dateRange: { start: string; end: string };
    totalStudents: number;
    totalTutors: number;
    totalPointsDistributed: number;
    totalTransactions: number;
    averagePointsPerStudent: number;
  };
  tutorStats: Array<{
    id: string;
    name: string;
    studentCount: number;
    students: Array<{
      id: string;
      name: string;
      points: number;
      experience: number;
    }>;
  }>;
  activityStats: Array<{
    name: string;
    description?: string;
    participantCount: number;
    transactionCount: number;
    totalPointsDistributed: number;
    participants: Array<{
      id: string;
      name: string;
      transactionCount: number;
      totalPoints: number;
    }>;
  }>;
  topStudentsByPoints: Array<{
    rank: number;
    id: string;
    name: string;
    points: number;
    experience: number;
    tutor: string;
  }>;
  studentActivityParticipation: Array<{
    id: string;
    name: string;
    points: number;
    activityCount: number;
    transactionCount: number;
  }>;
  performanceAnalysis: {
    highestEarningStudent: {
      name: string;
      points: number;
      activities: Record<string, number>;
    } | null;
    passiveStudents: {
      noPoints: number;
      lowPoints: number;
      noPointsList: Array<{ name: string; tutor: string }>;
      lowPointsList: Array<{ name: string; points: number; tutor: string }>;
    };
  };
  penaltyStats: {
    totalPenalties: number;
    totalStudentsPenalized: number;
    totalPointsDeducted: number;
    penalizedStudents: Array<{
      studentName: string;
      points: number;
      reason: string;
      date: string;
    }>;
  };
  insights: {
    mostPopularActivity: string;
    leastPopularActivity: string;
    averageActivitiesPerStudent: number;
  };
};

export default function PeriodReportPage() {
  const [report, setReport] = useState<PeriodReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);

      const response = await fetch(`/api/admin/summer-school-report?${params}`);
      if (!response.ok) throw new Error('Failed to fetch report');

      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error('Error fetching period report:', error);
      toast.error('Dönem raporu yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!report) return;

    const reportContent = generateReportText(report);
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `donem-raporu-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Rapor başarıyla indirildi');
  };

  const generateReportText = (report: PeriodReportData): string => {
    let content = 'DÖNEM RAPORU\\n\\n';
    content += `Rapor Tarihi: ${new Date(report.metadata.generatedAt).toLocaleDateString('tr-TR')}\\n`;
    content += `Tarih Aralığı: ${report.metadata.dateRange.start} - ${report.metadata.dateRange.end}\\n\\n`;

    content += 'GENEL İSTATİSTİKLER\\n';
    content += `Dönemde toplam ${report.metadata.totalTutors} rehber ile ${report.metadata.totalStudents} öğrenciye hizmet verildi.\\n\\n`;

    content += 'REHBERLER VE REHBERLERE DÜŞEN ÖĞRENCİ SAYILARI\\n\\n';
    report.tutorStats.forEach((tutor, index) => {
      content += `${index + 1}-) ${tutor.name} \\t--> ${tutor.studentCount} Öğrenci\\n`;
    });
    content += '\\n';

    content += 'Öğrencilere Bilgeverse Kapsamında Bilge Para Kazanabilecekleri Kriterler Aşağıdaki Gibidir:\\n';
    content += '(Aşağıda belirtilen etkinliklerin katılımcı sayıları ve kazanılan bilge para miktarları)\\n\\n';

    report.activityStats.forEach((activity, index) => {
      content += `${index + 1}-) ${activity.name} \\t\\t\\t\\t--> ${activity.participantCount} öğrenci katıldı, ${activity.totalPointsDistributed} BP dağıtıldı\\n`;
    });
    content += '\\n';

    if (report.penaltyStats.totalPenalties > 0) {
      content += `==> Bunlara ek olarak etkinlik ve derslerde uygunsuz davranışlar sergileyen öğrencilerden puan kırılmıştır.\\n`;
      content += `==> Bu minvalde toplam ${report.penaltyStats.totalStudentsPenalized} öğrenciye ceza verildi. ${report.penaltyStats.totalPenalties} adet ceza girişi yapıldı.\\n\\n`;
    }

    content += `==> Toplam "${report.metadata.totalTransactions} PUAN GİRİŞİ" yapılmıştır.\\n`;
    content += `==> Tüm öğrencilere toplam ${report.metadata.totalPointsDistributed} BİLGE PARA dağıtılmıştır.\\n`;

    if (report.performanceAnalysis.highestEarningStudent) {
      content += `==> En yüksek Bilge Para Kazanan Öğrenci ${report.performanceAnalysis.highestEarningStudent.points} Bilge Para topladı (${report.performanceAnalysis.highestEarningStudent.name}).\\n`;
    }

    content += `==> ${report.performanceAnalysis.passiveStudents.noPoints} öğrenci hiç Bilge Para kazanamadı. ${report.performanceAnalysis.passiveStudents.lowPoints} öğrenci 50 Bilge Paranın altında kaldı. Bu pasif öğrenci grubu gözden kaçırılmamalıdır.\\n\\n`;

    content += 'EN ÇOK BP ALAN İLK 10 ÖĞRENCİ\\n';
    report.topStudentsByPoints.slice(0, 10).forEach((student) => {
      content += `${student.rank}. ${student.name} - ${student.points} BP (Rehber: ${student.tutor})\\n`;
    });
    content += '\\n';

    content += 'ÖĞRENCİLERİN ETKİNLİK KATILIM SAYILARINA GÖRE SIRALAMALARI\\n';
    report.studentActivityParticipation.slice(0, 30).forEach((student, index) => {
      content += `${index + 1}. ${student.name} \\t${student.activityCount} etkinlik, ${student.points} BP\\n`;
    });

    return content;
  };

  const filteredActivities = report?.activityStats.filter(activity =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col justify-center items-center min-h-[60vh] space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-600 font-medium">Dönem raporu yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col justify-center items-center min-h-[60vh] space-y-4">
          <School className="h-16 w-16 text-gray-300" />
          <p className="text-gray-600 font-medium">Rapor yüklenemedi</p>
          <div className="flex gap-2">
            <Button onClick={fetchReport} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tekrar Dene
            </Button>
            <Link href="/admin/reports">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri Dön
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 opacity-5 rounded-2xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="p-2 sm:p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white shadow-lg w-fit">
                    <School className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {report.metadata.periodInfo?.name || 'Dönem Raporu'}
                    </h1>
                    <p className="text-gray-600 text-base sm:text-lg">
                      {report.metadata.periodInfo?.description || 'Dinamik dönem performans analizi ve istatistikleri'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {report.metadata.periodInfo?.startDate} - {report.metadata.periodInfo?.endDate}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="Başlangıç"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-40"
                  />
                  <Input
                    type="date"
                    placeholder="Bitiş"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-40"
                  />
                </div>
                <Button onClick={exportReport} className="bg-green-600 hover:bg-green-700">
                  <Download className="h-4 w-4 mr-2" />
                  İndir
                </Button>
                <Button onClick={fetchReport} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Yenile
                </Button>
                <Link href="/admin/reports">
                  <Button variant="ghost">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Geri
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-blue-900">
              {report.metadata.periodInfo?.name || 'Dönem'} Özeti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800 text-lg leading-relaxed">
              <span className="font-bold">{report.metadata.periodInfo?.name || 'Bu dönem'}</span> kapsamında toplam{' '}
              <span className="font-bold">{report.metadata.totalTutors} rehber</span> ile{' '}
              <span className="font-bold">{report.metadata.totalStudents} öğrenciye</span> hizmet verildi.
              Toplamda <span className="font-bold">{report.metadata.totalPointsDistributed.toLocaleString()} Bilge Para</span> dağıtıldı.
              {report.performanceAnalysis.highestEarningStudent && (
                <>
                  {' '}En yüksek Bilge Para kazanan öğrenci{' '}
                  <span className="font-bold">{report.performanceAnalysis.highestEarningStudent.points} BP</span> topladı
                  ({report.performanceAnalysis.highestEarningStudent.name}).
                </>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-blue-600">Toplam Öğrenci</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-800">
                    {report.metadata.totalStudents}
                  </p>
                </div>
                <Users className="h-8 w-8 sm:h-12 sm:w-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-green-600">Toplam BP</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-800">
                    {report.metadata.totalPointsDistributed.toLocaleString()}
                  </p>
                </div>
                <Award className="h-8 w-8 sm:h-12 sm:w-12 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-purple-600">Ortalama/Öğrenci</p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-800">
                    {report.metadata.averagePointsPerStudent}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-orange-600">Toplam İşlem</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-800">
                    {report.metadata.totalTransactions}
                  </p>
                </div>
                <Activity className="h-8 w-8 sm:h-12 sm:w-12 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-red-600">Pasif Öğrenci</p>
                  <p className="text-2xl sm:text-3xl font-bold text-red-800">
                    {report.performanceAnalysis.passiveStudents.noPoints + report.performanceAnalysis.passiveStudents.lowPoints}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 sm:h-12 sm:w-12 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tutors" className="space-y-6 sm:space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-4xl grid-cols-5 h-12 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg rounded-xl p-1">
              <TabsTrigger value="tutors" className="flex items-center justify-center gap-2 rounded-lg text-sm font-medium">
                <BookOpen className="h-4 w-4" />
                Rehberler
              </TabsTrigger>
              <TabsTrigger value="activities" className="flex items-center justify-center gap-2 rounded-lg text-sm font-medium">
                <Activity className="h-4 w-4" />
                Aktiviteler
              </TabsTrigger>
              <TabsTrigger value="students" className="flex items-center justify-center gap-2 rounded-lg text-sm font-medium">
                <GraduationCap className="h-4 w-4" />
                Öğrenciler
              </TabsTrigger>
              <TabsTrigger value="participation" className="flex items-center justify-center gap-2 rounded-lg text-sm font-medium">
                <Star className="h-4 w-4" />
                Katılım
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center justify-center gap-2 rounded-lg text-sm font-medium">
                <PieChart className="h-4 w-4" />
                Analiz
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tutors Tab */}
          <TabsContent value="tutors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rehberler ve Rehberlere Düşen Öğrenci Sayıları</CardTitle>
                <CardDescription>Rehberlerin öğrenci sayıları ve sınıf performansları</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {report.tutorStats.map((tutor, index) => (
                    <Card key={tutor.id} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {index + 1}-) {tutor.name}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Öğrenci Sayısı:</span>
                            <span className="font-bold text-green-700">{tutor.studentCount} Öğrenci</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Toplam BP:</span>
                            <span className="font-medium">
                              {tutor.students.reduce((sum, s) => sum + s.points, 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ortalama:</span>
                            <span className="font-medium">
                              {tutor.studentCount > 0
                                ? Math.round(tutor.students.reduce((sum, s) => sum + s.points, 0) / tutor.studentCount)
                                : 0}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Öğrencilere Bilge Para Kazandıran Kriterler</CardTitle>
                    <CardDescription>Aktivite katılımları ve puan dağılımları</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Aktivite ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {filteredActivities.map((activity, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <h4 className="font-bold text-lg text-gray-900 mb-4">
                          {index + 1}-) {activity.name}
                        </h4>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <span className="text-blue-600 font-medium">Katılımcı:</span>
                            <p className="font-bold text-blue-800">{activity.participantCount} öğrenci</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <span className="text-green-600 font-medium">Toplam BP:</span>
                            <p className="font-bold text-green-800">{activity.totalPointsDistributed} BP</p>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <span className="text-purple-600 font-medium">İşlem Sayısı:</span>
                            <p className="font-bold text-purple-800">{activity.transactionCount} işlem</p>
                          </div>
                          {activity.errorCount > 0 && (
                            <div className="bg-red-50 p-3 rounded-lg">
                              <span className="text-red-600 font-medium">Hatalı Giriş:</span>
                              <p className="font-bold text-red-800">{activity.errorCount} adet</p>
                            </div>
                          )}
                        </div>

                        {/* Insights */}
                        {activity.insights && activity.insights.length > 0 && (
                          <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                            <h5 className="font-semibold text-yellow-800 mb-2">Değerlendirmeler:</h5>
                            <ul className="list-disc list-inside space-y-1">
                              {activity.insights.map((insight, i) => (
                                <li key={i} className="text-yellow-700 text-sm">{insight}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Participant List */}
                        <div className="mt-4">
                          <h5 className="font-semibold text-gray-800 mb-3">Katılan Öğrenciler:</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                            {activity.participants.map((participant, i) => (
                              <div key={participant.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <span className="text-sm">
                                  {i + 1}. {participant.name}
                                  {participant.hasMultipleTransactions && <span className="text-orange-500 ml-1">★</span>}
                                </span>
                                <span className="text-xs font-medium text-gray-600">
                                  {participant.totalPoints} BP
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            ★ işareti bulunan öğrenciler bu aktiviteyi birden fazla kez gerçekleştirmiştir.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>En Çok BP Alan İlk 10 Öğrenci</CardTitle>
                <CardDescription>Puan sıralamasına göre en başarılı öğrenciler</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.topStudentsByPoints.slice(0, 10).map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge
                          variant={student.rank <= 3 ? 'default' : 'secondary'}
                          className={`text-base px-3 py-1 ${
                            student.rank === 1 ? 'bg-yellow-500 text-white' :
                            student.rank === 2 ? 'bg-gray-400 text-white' :
                            student.rank === 3 ? 'bg-amber-600 text-white' : ''
                          }`}
                        >
                          #{student.rank}
                        </Badge>
                        <div>
                          <p className="font-semibold">{student.name}</p>
                          <p className="text-sm text-gray-600">Rehber: {student.tutor}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{student.points} BP</p>
                        <p className="text-sm text-gray-600">{student.experience} XP</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Participation Tab */}
          <TabsContent value="participation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>En Çok Etkinliğe Katılan Öğrenciler</CardTitle>
                <CardDescription>Etkinlik katılım sayısına göre öğrenci sıralaması</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {report.studentActivityParticipation.slice(0, 30).map((student, index) => (
                    <div key={student.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge className="text-base px-3 py-1">
                          #{index + 1}
                        </Badge>
                        <div>
                          <p className="font-semibold">{student.name}</p>
                          <p className="text-sm text-gray-600">{student.transactionCount} işlem yapıldı</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{student.activityCount} etkinlik</p>
                        <p className="text-sm text-gray-600">{student.points} BP</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performans Analizi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.performanceAnalysis.highestEarningStudent && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-800">En Yüksek Bilge Para Kazanan</h4>
                      <p className="text-green-700 font-medium">
                        {report.performanceAnalysis.highestEarningStudent.name}
                      </p>
                      <p className="text-green-600">
                        {report.performanceAnalysis.highestEarningStudent.points} Bilge Para topladı
                      </p>
                    </div>
                  )}

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold text-yellow-800">Pasif Öğrenciler</h4>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-yellow-700 text-sm">Hiç puan kazanamayan</p>
                        <p className="font-bold text-yellow-800">
                          {report.performanceAnalysis.passiveStudents.noPoints} öğrenci
                        </p>
                      </div>
                      <div>
                        <p className="text-yellow-700 text-sm">50 BP altında kalan</p>
                        <p className="font-bold text-yellow-800">
                          {report.performanceAnalysis.passiveStudents.lowPoints} öğrenci
                        </p>
                      </div>
                    </div>
                    <p className="text-yellow-600 text-sm mt-2">
                      Bu pasif öğrenci grubu gözden kaçırılmamalıdır.
                    </p>
                  </div>

                  {report.penaltyStats.totalPenalties > 0 && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <h4 className="font-semibold text-red-800">Ceza İstatistikleri</h4>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <p className="text-red-700 text-sm">Toplam Ceza</p>
                          <p className="font-bold text-red-800">{report.penaltyStats.totalPenalties} adet</p>
                        </div>
                        <div>
                          <p className="text-red-700 text-sm">Kesilen Puan</p>
                          <p className="font-bold text-red-800">{report.penaltyStats.totalPointsDeducted} BP</p>
                        </div>
                      </div>
                      <p className="text-red-600 text-sm mt-2">
                        {report.penaltyStats.totalStudentsPenalized} farklı öğrenciye ceza verildi.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Önemli Bulgular
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800">En Popüler Aktivite</h4>
                    <p className="text-blue-700">{report.insights.mostPopularActivity}</p>
                    <p className="text-blue-600 text-sm">En çok katılım gören etkinlik</p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-800">En Az Popüler Aktivite</h4>
                    <p className="text-purple-700">{report.insights.leastPopularActivity}</p>
                    <p className="text-purple-600 text-sm">Daha fazla teşvik gerekebilir</p>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <h4 className="font-semibold text-indigo-800">Ortalama Aktivite Katılımı</h4>
                    <p className="text-indigo-700">{report.insights.averageActivitiesPerStudent} aktivite/öğrenci</p>
                    <p className="text-indigo-600 text-sm">Öğrenci başına ortalama</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800">Genel Değerlendirme</h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>• Toplam {report.metadata.totalTransactions} işlem gerçekleştirildi</p>
                      <p>• Öğrenci başına ortalama {report.metadata.averagePointsPerStudent} BP kazanıldı</p>
                      <p>• {report.activityStats.length} farklı aktivite türü mevcut</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}