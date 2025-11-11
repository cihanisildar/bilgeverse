'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Award, 
  Calendar, 
  Clock, 
  PieChart, 
  TrendingUp, 
  Users,
  BookOpen,
  Activity,
  Star,
  ChevronRight,
  GraduationCap,
  Target,
  BarChart3
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type Classroom = {
  id: string;
  name: string;
  description?: string;
  tutor?: { id: string; username: string; firstName?: string; lastName?: string };
};

type ClassReport = {
  classroom: Classroom;
  totalStudents: number;
  totalPoints: number;
  totalExperience: number;
  totalPointsEarned: number;
  totalExperienceEarned: number;
  activityDistribution: any[];
  averagePointsPerStudent: number;
  averageExperiencePerStudent: number;
  students: { id: string; name: string; points: number; experience: number }[];
  eventStats: {
    totalEvents: number;
    totalAttendances: number;
    averageAttendancePerEvent: number;
  };
  pointsList: { points: number; reason: string; date: string }[];
  experienceList: { amount: number; date: string }[];
};

export default function ClassReportPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [classReport, setClassReport] = useState<ClassReport | null>(null);
  const [loading, setLoading] = useState(true);

  const classroomId = params.id as string;

  useEffect(() => {
    if (classroomId) {
      fetchClassReport();
    }
  }, [classroomId]);

  const fetchClassReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/classroom/reports?classroomId=${classroomId}`);
      if (!res.ok) throw new Error('Failed to fetch class report');
      const data = await res.json();
      setClassReport(data);
    } catch (error) {
      console.error('Error fetching class report:', error);
      toast.error('Sınıf raporu yüklenirken bir hata oluştu');
      router.push('/dashboard/part7/admin/reports');
    } finally {
      setLoading(false);
    }
  };

  const getTutorDisplayName = (tutor: any) => {
    if (tutor.firstName && tutor.lastName) {
      return `${tutor.firstName} ${tutor.lastName}`;
    }
    return tutor.username;
  };

  const getStudentLevelColor = (points: number) => {
    if (points >= 1000) return 'from-purple-500 to-purple-600';
    if (points >= 500) return 'from-blue-500 to-blue-600';
    if (points >= 200) return 'from-green-500 to-green-600';
    if (points >= 50) return 'from-yellow-500 to-yellow-600';
    return 'from-gray-400 to-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 flex flex-col justify-center items-center space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 absolute top-0 left-0"></div>
        </div>
        <p className="text-gray-600 font-medium">Sınıf raporu yükleniyor...</p>
      </div>
    );
  }

  if (!classReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 flex justify-center items-center">
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl p-8">
          <div className="text-center space-y-4">
            <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Sınıf Bulunamadı</h2>
            <p className="text-gray-600">Aradığınız sınıf raporu bulunamadı veya erişim izniniz yok.</p>
            <Button 
              onClick={() => router.push('/dashboard/part7/admin/reports')}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Raporlara Dön
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <div className="p-6 space-y-8">
        {/* Back Button */}
        <div className="flex items-center justify-start">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/part7/admin/reports')}
            className="flex items-center gap-2 bg-white/70 backdrop-blur-sm border-white/20 hover:bg-white/90 transition-all duration-200 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri Dön
          </Button>
        </div>

        {/* Enhanced Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 opacity-5 rounded-2xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl text-white shadow-lg">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {classReport.classroom.name}
                    </h1>
                    <p className="text-gray-600 text-lg">
                      Sınıf Performans Raporu
                    </p>
                    {classReport.classroom.tutor && (
                      <p className="text-sm text-purple-600 font-medium mt-1">
                        Eğitmen: {getTutorDisplayName(classReport.classroom.tutor)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge className="bg-purple-100 text-purple-800 text-base px-4 py-2 border border-purple-200">
                  <Users className="h-4 w-4 mr-2" />
                  {classReport.totalStudents} Öğrenci
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <Tabs defaultValue="overview" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-3xl grid-cols-4 h-14 bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg rounded-2xl p-2">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 rounded-xl text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <Activity className="h-4 w-4" />
                Genel Bakış
              </TabsTrigger>
              <TabsTrigger 
                value="points"
                className="flex items-center gap-2 rounded-xl text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <Award className="h-4 w-4" />
                Puan Geçmişi
              </TabsTrigger>
              <TabsTrigger 
                value="experience"
                className="flex items-center gap-2 rounded-xl text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <Star className="h-4 w-4" />
                Deneyim
              </TabsTrigger>
              <TabsTrigger 
                value="events"
                className="flex items-center gap-2 rounded-xl text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <Calendar className="h-4 w-4" />
                Etkinlikler
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-700">Toplam Bilge Parası</p>
                      <p className="text-3xl font-bold text-yellow-800">{classReport.totalPoints.toLocaleString()}</p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Ort: {Math.round(classReport.averagePointsPerStudent)} / öğrenci
                      </p>
                    </div>
                    <Award className="h-12 w-12 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Toplam Deneyim</p>
                      <p className="text-3xl font-bold text-blue-800">{classReport.totalExperience.toLocaleString()}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Ort: {Math.round(classReport.averageExperiencePerStudent)} / öğrenci
                      </p>
                    </div>
                    <TrendingUp className="h-12 w-12 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Öğrenci Sayısı</p>
                      <p className="text-3xl font-bold text-green-800">{classReport.totalStudents}</p>
                      <p className="text-xs text-green-600 mt-1">Aktif öğrenci</p>
                    </div>
                    <Users className="h-12 w-12 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Kazanılan Puanlar</p>
                      <p className="text-3xl font-bold text-purple-800">{classReport.totalPointsEarned.toLocaleString()}</p>
                      <p className="text-xs text-purple-600 mt-1">Toplam kazanılan</p>
                    </div>
                    <Target className="h-12 w-12 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Distribution */}
            {classReport.activityDistribution.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Aktivite Dağılımı</CardTitle>
                      <CardDescription>
                        Sınıftaki öğrencilerin farklı aktivite türlerine göre puan dağılımı
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classReport.activityDistribution.map((activity, index) => (
                      <Card key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-800">{activity.name}</h3>
                            <Badge variant="outline" className="bg-white border-gray-300">
                              {activity.percentage}%
                            </Badge>
                          </div>
                          <div className="text-2xl font-bold text-indigo-600 mb-1">{activity.value}</div>
                          <p className="text-sm text-gray-600">
                            {activity.count} aktivite
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Students List */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Sınıftaki Öğrenciler</CardTitle>
                    <CardDescription>
                      Sınıftaki tüm öğrencilerin puan ve deneyim durumları
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto pr-2">
                  {classReport.students.map((student) => (
                    <Card 
                      key={student.id} 
                      className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 bg-white/90 backdrop-blur-sm border-white/30 overflow-hidden"
                      onClick={() => router.push(`/dashboard/part7/admin/reports/students/${student.id}`)}
                    >
                      <div className={`h-2 bg-gradient-to-r ${getStudentLevelColor(student.points)}`} />
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-purple-600 transition-colors">
                              {student.name}
                            </h3>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm font-medium text-gray-700">Bilge Parası</span>
                            </div>
                            <span className="font-bold text-yellow-700">{student.points}</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-700">Deneyim</span>
                            </div>
                            <span className="font-bold text-blue-700">{student.experience}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Points Tab */}
          <TabsContent value="points" className="space-y-8">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg text-white">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Puan Geçmişi</CardTitle>
                    <CardDescription>
                      Sınıftaki öğrencilerin aldığı tüm puanlar
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  {classReport.pointsList && classReport.pointsList.length > 0 ? (
                    classReport.pointsList.map((point, index) => (
                      <Card key={index} className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">{point.reason || 'Puan verme'}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                {new Date(point.date).toLocaleDateString('tr-TR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 font-bold text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full">
                              <Award className="h-4 w-4" />
                              {point.points}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-xl font-medium text-gray-500 mb-2">Henüz puan geçmişi bulunmuyor</p>
                      <p className="text-gray-400">Öğrenciler puan kazandıkça burada görünecek</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Experience Tab */}
          <TabsContent value="experience" className="space-y-8">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg text-white">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Deneyim Geçmişi</CardTitle>
                    <CardDescription>
                      Sınıftaki öğrencilerin kazandığı deneyim puanları
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  {classReport.experienceList && classReport.experienceList.length > 0 ? (
                    classReport.experienceList.map((exp, index) => (
                      <Card key={index} className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">Deneyim Kazanımı</p>
                              <p className="text-sm text-gray-600 mt-1">
                                {new Date(exp.date).toLocaleDateString('tr-TR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                              <TrendingUp className="h-4 w-4" />
                              {exp.amount}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-xl font-medium text-gray-500 mb-2">Henüz deneyim geçmişi bulunmuyor</p>
                      <p className="text-gray-400">Öğrenciler deneyim kazandıkça burada görünecek</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-8">
            {/* Enhanced Event Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Oluşturulan Etkinlikler</p>
                      <p className="text-3xl font-bold text-green-800">
                        {classReport.eventStats?.totalEvents || 0}
                      </p>
                      <p className="text-xs text-green-600 mt-1">Eğitmen tarafından</p>
                    </div>
                    <Calendar className="h-12 w-12 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-sky-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Toplam Katılım</p>
                      <p className="text-3xl font-bold text-blue-800">
                        {classReport.eventStats?.totalAttendances || 0}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">Tüm etkinliklere</p>
                    </div>
                    <Users className="h-12 w-12 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Ortalama Katılım</p>
                      <p className="text-3xl font-bold text-purple-800">
                        {Math.round(classReport.eventStats?.averageAttendancePerEvent || 0)}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">Etkinlik başına</p>
                    </div>
                    <Clock className="h-12 w-12 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Event Summary */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Etkinlik Özeti</CardTitle>
                    <CardDescription>
                      {classReport.classroom.tutor ? getTutorDisplayName(classReport.classroom.tutor) : 'Bu sınıf'} 
                      {' '}tarafından oluşturulan etkinlik bilgileri
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
                    <CardContent className="p-6">
                      <h4 className="font-bold text-lg text-indigo-800 mb-2">Etkinlik Başarı Oranı</h4>
                      <p className="text-4xl font-bold text-indigo-600 mb-2">
                        {classReport.eventStats?.totalEvents > 0 
                          ? Math.round((classReport.eventStats.totalAttendances / (classReport.eventStats.totalEvents * classReport.totalStudents)) * 100)
                          : 0}%
                      </p>
                      <p className="text-sm text-indigo-600">
                        Öğrenci katılım oranı
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
                    <CardContent className="p-6">
                      <h4 className="font-bold text-lg text-emerald-800 mb-2">Sınıf Aktivitesi</h4>
                      <p className="text-4xl font-bold text-emerald-600 mb-2">
                        {classReport.eventStats?.totalEvents > 0 ? 'Aktif' : 'Pasif'}
                      </p>
                      <p className="text-sm text-emerald-600">
                        {classReport.eventStats?.totalEvents > 0 
                          ? 'Düzenli etkinlik yapılıyor' 
                          : 'Henüz etkinlik yapılmadı'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 