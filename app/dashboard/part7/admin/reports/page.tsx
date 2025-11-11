'use client';

import OverallStatsReport from '@/app/components/OverallStatsReport';
import { useAuth } from '@/app/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Award,
  BookOpen,
  Calendar,
  ChevronRight,
  FileText,
  GraduationCap,
  PieChart,
  School,
  Search,
  Star,
  TrendingUp,
  Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type Student = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  points: number;
  experience: number;
};

type Tutor = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  classroom?: { id: string; name: string; description?: string };
  students: { id: string; username: string; firstName?: string; lastName?: string; points: number }[];
};

export default function AdminReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [filteredTutors, setFilteredTutors] = useState<Tutor[]>([]);
  const [tutorSearchTerm, setTutorSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
    fetchTutors();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, studentSearchTerm]);

  useEffect(() => {
    filterTutors();
  }, [tutors, tutorSearchTerm]);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/students');
      if (!response.ok) throw new Error('Failed to fetch students');
      
      const data = await response.json();
      if (data.students) {
        setStudents(data.students);
        setFilteredStudents(data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Öğrenciler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    if (!studentSearchTerm.trim()) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(student => {
      const searchLower = studentSearchTerm.toLowerCase();
      const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
      const username = student.username.toLowerCase();
      
      return fullName.includes(searchLower) || username.includes(searchLower);
    });

    setFilteredStudents(filtered);
  };

  const filterTutors = () => {
    if (!tutorSearchTerm.trim()) {
      setFilteredTutors(tutors);
      return;
    }

    const filtered = tutors.filter(tutor => {
      const searchLower = tutorSearchTerm.toLowerCase();
      let tutorName = '';
      
      if (tutor.firstName || tutor.lastName) {
        tutorName = `${tutor.firstName || ''} ${tutor.lastName || ''}`.toLowerCase();
      } else {
        tutorName = tutor.username.toLowerCase();
      }
      
      return tutorName.includes(searchLower);
    });

    setFilteredTutors(filtered);
  };

  const getStudentDisplayName = (student: Student) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    }
    return student.username;
  };

  const getTutorDisplayName = (tutor: any) => {
    if (tutor.firstName && tutor.lastName) {
      return `${tutor.firstName} ${tutor.lastName}`;
    }
    return tutor.username;
  };

  const fetchTutors = async () => {
    try {
      const res = await fetch('/api/admin/tutors');
      if (!res.ok) throw new Error('Failed to fetch tutors');
      const data = await res.json();
      setTutors(data.tutors || []);
      setFilteredTutors(data.tutors || []);
    } catch (error) {
      toast.error('Eğitmenler yüklenirken bir hata oluştu');
    }
  };

  const getStudentLevelColor = (points: number) => {
    if (points >= 1000) return 'from-purple-500 to-purple-600';
    if (points >= 500) return 'from-blue-500 to-blue-600';
    if (points >= 200) return 'from-green-500 to-green-600';
    if (points >= 50) return 'from-yellow-500 to-yellow-600';
    return 'from-gray-400 to-gray-500';
  };

  const getClassroomHealthColor = (studentCount: number) => {
    if (studentCount === 0) return 'bg-red-50 border-red-200 text-red-800';
    if (studentCount <= 5) return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    if (studentCount <= 15) return 'bg-green-50 border-green-200 text-green-800';
    return 'bg-blue-50 border-blue-200 text-blue-800';
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
        </div>
        <p className="text-gray-600 font-medium">Raporlar yükleniyor...</p>
      </div>
    );
  }

  const totalPoints = students.length > 0 ? students.reduce((sum, student) => sum + student.points, 0) : 0;
  const totalExperience = students.length > 0 ? students.reduce((sum, student) => sum + student.experience, 0) : 0;
  const activeClassrooms = tutors.length > 0 ? tutors.filter(tutor => tutor.students && tutor.students.length > 0).length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-5 rounded-2xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl text-white shadow-lg w-fit">
                    <PieChart className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Admin Raporları
                    </h1>
                    <p className="text-gray-600 text-base sm:text-lg">
                      Öğrenci ve eğitmen performanslarını detaylıca inceleyin
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <Button
                  onClick={() => router.push('/dashboard/part7/admin/reports/period')}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                >
                  <School className="h-4 w-4 mr-2" />
                  Dönem Raporu
                </Button>
                <Badge className="bg-indigo-100 text-indigo-800 text-sm sm:text-base px-3 sm:px-4 py-2 border border-indigo-200">
                  <FileText className="h-4 w-4 mr-2" />
                  Analiz Merkezi
                </Badge>
              </div>
            </div>
          </div>
        </div>



        {/* Enhanced Tabs */}
        <Tabs defaultValue="overview" className="space-y-6 sm:space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-2xl grid-cols-3 h-12 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg rounded-xl p-1">
              <TabsTrigger 
                value="overview" 
                className="flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-100 data-[state=active]:hover:bg-blue-600"
              >
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Genel Bakış</span>
                <span className="sm:hidden">Genel</span>
              </TabsTrigger>
              <TabsTrigger 
                value="individual"
                className="flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-100 data-[state=active]:hover:bg-green-600"
              >
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Öğrenci Raporları</span>
                <span className="sm:hidden">Öğrenci</span>
              </TabsTrigger>
              <TabsTrigger 
                value="class"
                className="flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200 data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-100 data-[state=active]:hover:bg-purple-600"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Sınıf Raporları</span>
                <span className="sm:hidden">Sınıf</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 sm:space-y-8">
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-blue-600">Toplam Bilge Parası</p>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-800">{totalPoints.toLocaleString()}</p>
                    </div>
                    <Award className="h-8 w-8 sm:h-12 sm:w-12 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-green-600">Toplam Deneyim</p>
                      <p className="text-2xl sm:text-3xl font-bold text-green-800">{totalExperience.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 sm:col-span-2 lg:col-span-1">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-purple-600">Aktif Sınıf</p>
                      <p className="text-2xl sm:text-3xl font-bold text-purple-800">{activeClassrooms}</p>
                    </div>
                    <Users className="h-8 w-8 sm:h-12 sm:w-12 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <OverallStatsReport userRole="ADMIN" />
          </TabsContent>

          {/* Individual Reports Tab */}
          <TabsContent value="individual" className="space-y-6 sm:space-y-8">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="pb-4 sm:pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white">
                      <GraduationCap className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg sm:text-2xl">Öğrenci Performans Raporları</CardTitle>
                      <CardDescription className="text-sm sm:text-base">
                        Detaylı analiz ve bireysel gelişim takibi
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-sm sm:text-base px-3 sm:px-4 py-1 sm:py-2 w-fit">
                    {filteredStudents.length} / {students.length} Öğrenci
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {/* Enhanced Search */}
                <div className="relative">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                  <Input
                    placeholder="Öğrenci adı veya kullanıcı adı ile ara..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="pl-10 sm:pl-12 h-10 sm:h-12 bg-white/70 backdrop-blur-sm border-white/20 rounded-xl text-sm sm:text-base"
                  />
                </div>

                {/* Enhanced Student Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 max-h-[50vh] sm:max-h-[70vh] overflow-y-auto pr-2">
                  {filteredStudents.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                      <GraduationCap className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-lg font-medium">Henüz öğrenci bulunmuyor</p>
                      <p className="text-sm text-gray-400">Öğrenciler kayıt oldukça burada görünecek</p>
                    </div>
                  ) : (
                    filteredStudents.map((student) => (
                    <Card 
                      key={student.id} 
                      className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 sm:hover:-translate-y-2 bg-white/90 backdrop-blur-sm border-white/30 overflow-hidden"
                      onClick={() => router.push(`/dashboard/part7/admin/reports/students/${student.id}`)}
                    >
                      <div className={`h-1 sm:h-2 bg-gradient-to-r ${getStudentLevelColor(student.points)}`} />
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base sm:text-lg text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                              {getStudentDisplayName(student)}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">@{student.username}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2" />
                        </div>
                        
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex items-center justify-between p-2 sm:p-3 bg-yellow-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Award className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
                              <span className="text-xs sm:text-sm font-medium text-gray-700">Bilge Parası</span>
                            </div>
                            <span className="font-bold text-yellow-700 text-sm sm:text-base">{student.points}</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                              <span className="text-xs sm:text-sm font-medium text-gray-700">Deneyim</span>
                            </div>
                            <span className="font-bold text-blue-700 text-sm sm:text-base">{student.experience}</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-center text-xs sm:text-sm text-gray-500 group-hover:text-blue-500 transition-colors">
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            Detaylı raporu görüntüle
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Class Reports Tab */}
          <TabsContent value="class" className="space-y-8">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg text-white">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Sınıf Performans Analizi</CardTitle>
                      <CardDescription className="text-base">
                        Eğitmen bazlı sınıf raporları ve grup dinamikleri
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-base px-4 py-2">
                    {filteredTutors.length} / {tutors.length} Eğitmen
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enhanced Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Eğitmen adı ile ara..."
                    value={tutorSearchTerm}
                    onChange={(e) => setTutorSearchTerm(e.target.value)}
                    className="pl-12 h-12 bg-white/70 backdrop-blur-sm border-white/20 rounded-xl text-base"
                  />
                </div>

                {/* Enhanced Tutor Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto pr-2">
                  {filteredTutors.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                      <BookOpen className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-lg font-medium">Henüz eğitmen bulunmuyor</p>
                      <p className="text-sm text-gray-400">Eğitmenler kayıt oldukça burada görünecek</p>
                    </div>
                  ) : (
                    filteredTutors.map((tutor) => {
                    const studentCount = tutor.students?.length || 0;
                    const totalClassPoints = tutor.students?.reduce((acc: number, s: any) => acc + s.points, 0) || 0;
                    const hasClassroom = tutor.classroom && tutor.classroom.id;
                    
                    return (
                      <Card 
                        key={tutor.id} 
                        className={`group transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 bg-white/90 backdrop-blur-sm border-white/30 overflow-hidden ${
                          hasClassroom ? 'cursor-pointer' : 'opacity-75'
                        }`}
                        onClick={() => {
                          if (hasClassroom && tutor.classroom) {
                            router.push(`/dashboard/part7/admin/reports/classrooms/${tutor.classroom.id}`);
                          } else {
                            toast.error('Bu eğitmenin henüz bir sınıfı bulunmuyor');
                          }
                        }}
                      >
                        <div className={`h-2 ${hasClassroom ? 'bg-gradient-to-r from-purple-500 to-violet-500' : 'bg-gray-300'}`} />
                        
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-gray-900 group-hover:text-purple-600 transition-colors">
                                {getTutorDisplayName(tutor)}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">@{tutor.username}</p>
                              <p className="text-sm font-medium text-purple-600 mt-2">
                                {tutor.classroom?.name || 'Sınıf oluşturuluyor...'}
                              </p>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              <Badge 
                                className={`${getClassroomHealthColor(studentCount)} border font-semibold shadow-sm`}
                              >
                                <Users className="h-3 w-3 mr-1" />
                                {studentCount}
                              </Badge>
                              {hasClassroom && (
                                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-amber-600" />
                                <span className="text-sm font-medium text-gray-700">Sınıf Toplamı</span>
                              </div>
                              <span className="font-bold text-amber-700">{totalClassPoints}</span>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-700">Ortalama</span>
                              </div>
                              <span className="font-bold text-blue-700">
                                {studentCount > 0 ? Math.round(totalClassPoints / studentCount) : 0}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            {hasClassroom ? (
                              <div className="flex items-center justify-center text-sm text-gray-500 group-hover:text-purple-500 transition-colors">
                                <PieChart className="h-4 w-4 mr-1" />
                                Sınıf raporunu görüntüle
                              </div>
                            ) : (
                              <div className="flex items-center justify-center text-sm text-amber-600">
                                <Calendar className="h-4 w-4 mr-1" />
                                Sınıf otomatik oluşturulacak
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 