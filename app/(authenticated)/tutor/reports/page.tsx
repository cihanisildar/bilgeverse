'use client';

import OverallStatsReport from '@/app/components/OverallStatsReport';
import { useAuth } from '@/app/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Award,
  BookOpen,
  ChevronRight,
  FileText,
  GraduationCap,
  PieChart,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Activity,
  Home
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
  createdAt: string;
};

type Classroom = {
  id: string;
  name: string;
  description?: string;
};

export default function TutorReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassroomData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, studentSearchTerm]);

  const fetchClassroomData = async () => {
    try {
      const response = await fetch('/api/tutor/students');
      if (!response.ok) throw new Error('Failed to fetch classroom data');
      
      const data = await response.json();
      if (data.students && data.classroom) {
        setStudents(data.students);
        setFilteredStudents(data.students);
        setClassroom(data.classroom);
      }
    } catch (error) {
      console.error('Error fetching classroom data:', error);
      toast.error('Sınıf verileri yüklenirken bir hata oluştu');
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

  const getStudentDisplayName = (student: Student) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    }
    return student.username;
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
      <div className="flex flex-col justify-center items-center min-h-[60vh] space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
        </div>
        <p className="text-gray-600 font-medium">Sınıf raporları yükleniyor...</p>
      </div>
    );
  }

  const totalPoints = students.reduce((sum, student) => sum + student.points, 0);
  const totalExperience = students.reduce((sum, student) => sum + student.experience, 0);
  const averagePoints = students.length > 0 ? Math.round(totalPoints / students.length) : 0;
  const averageExperience = students.length > 0 ? Math.round(totalExperience / students.length) : 0;

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
                      Sınıf Raporları
                    </h1>
                    <p className="text-gray-600 text-base sm:text-lg">
                      {classroom?.name || 'Sınıfınızın'} performansını detaylıca inceleyin
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <Badge className="bg-indigo-100 text-indigo-800 text-sm sm:text-base px-3 sm:px-4 py-2 border border-indigo-200">
                  <Home className="h-4 w-4 mr-2" />
                  {classroom?.name || 'Sınıfım'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <Tabs defaultValue="overview" className="space-y-6 sm:space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-xl grid-cols-2 h-12 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg rounded-xl p-1">
              <TabsTrigger 
                value="overview" 
                className="flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-100 data-[state=active]:hover:bg-blue-600"
              >
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Genel Bakış</span>
                <span className="sm:hidden">Genel</span>
              </TabsTrigger>
              <TabsTrigger 
                value="students"
                className="flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-100 data-[state=active]:hover:bg-green-600"
              >
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Öğrenci Detayları</span>
                <span className="sm:hidden">Öğrenci</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 sm:space-y-8">
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-green-600">Toplam Öğrenci</p>
                      <p className="text-2xl sm:text-3xl font-bold text-green-700">{students.length}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-green-500 rounded-lg">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-blue-600">Toplam Bilge Para</p>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-700">{totalPoints.toLocaleString()}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-blue-500 rounded-lg">
                      <Award className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-purple-600">Ortalama Puan</p>
                      <p className="text-2xl sm:text-3xl font-bold text-purple-700">{averagePoints}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-purple-500 rounded-lg">
                      <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-orange-600">Ortalama Deneyim</p>
                      <p className="text-2xl sm:text-3xl font-bold text-orange-700">{averageExperience}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-orange-500 rounded-lg">
                      <Star className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Section */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="pb-4 sm:pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white">
                      <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg sm:text-xl">Sınıf Analitikleri</CardTitle>
                      <CardDescription className="text-sm">
                        Sınıfınızın detaylı performans analizi ve istatistikleri
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-white px-3 sm:px-4 py-1 sm:py-2 w-fit">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">Canlı Veriler</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <OverallStatsReport userRole="TUTOR" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6 sm:space-y-8">
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
                        Sınıfınızdaki öğrencilerin detaylı performans analizi
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
                  {filteredStudents.map((student) => (
                    <Card 
                      key={student.id} 
                      className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 sm:hover:-translate-y-2 bg-white/90 backdrop-blur-sm border-white/30 overflow-hidden"
                      onClick={() => router.push(`/tutor/students/${student.id}`)}
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
                            Öğrenci detaylarını görüntüle
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredStudents.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Arama kriterlerinize uygun öğrenci bulunamadı.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </div>
    </div>
  );
} 