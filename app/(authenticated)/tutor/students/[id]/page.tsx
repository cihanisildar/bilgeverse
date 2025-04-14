'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Award,
  BookOpen,
  Calendar,
  ChevronLeft,
  FileText,
  Mail,
  TrendingUp,
  Trophy,
  User
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Student = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  points: number;
  rank?: number;
  totalStudents?: number;
  createdAt?: string;
};

type PointHistory = {
  id: string;
  points: number;
  type: string;
  reason: string;
  createdAt: string;
  tutor?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
};

export default function StudentDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const studentId = params.id as string;

  useEffect(() => {
    fetchStudentDetails();
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch student details
      const studentRes = await fetch(`/api/users/${studentId}`);
      if (!studentRes.ok) {
        throw new Error('Failed to fetch student details');
      }
      const studentData = await studentRes.json();
      
      // Fetch student rank
      const rankRes = await fetch(`/api/leaderboard?userId=${studentId}`);
      if (!rankRes.ok) {
        throw new Error('Failed to fetch rank information');
      }
      const rankData = await rankRes.json();
      
      // Fetch point history
      const pointsRes = await fetch(`/api/points?studentId=${studentId}`);
      if (!pointsRes.ok) {
        throw new Error('Failed to fetch points history');
      }
      const pointsData = await pointsRes.json();
      
      setStudent({
        ...studentData.user,
        rank: rankData.rank,
        totalStudents: rankData.totalStudents
      });
      
      setPointHistory(pointsData.transactions || []);
    } catch (err) {
      console.error('Error fetching student details:', err);
      setError('Öğrenci bilgilerini yüklerken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const getFullName = (person: { firstName?: string; lastName?: string; username: string }) => {
    if (person.firstName && person.lastName) {
      return `${person.firstName} ${person.lastName}`;
    } else if (person.firstName) {
      return person.firstName;
    } else if (person.lastName) {
      return person.lastName;
    } else {
      return person.username;
    }
  };

  const getInitials = (person: { firstName?: string; lastName?: string; username: string }) => {
    if (person.firstName && person.lastName) {
      return `${person.firstName[0]}${person.lastName[0]}`.toUpperCase();
    } else if (person.firstName) {
      return person.firstName[0].toUpperCase();
    } else if (person.lastName) {
      return person.lastName[0].toUpperCase();
    } else {
      return person.username[0].toUpperCase();
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg">
          Öğrenci bulunamadı.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Back button and header */}
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          className="flex items-center text-gray-500 hover:text-gray-700 -ml-3"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          <span>Öğrencilere Dön</span>
        </Button>
        
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 flex flex-col justify-center items-center md:items-start">
              <Avatar className="h-24 w-24 mb-4 bg-white shadow-sm">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                  {getInitials(student)}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">{getFullName(student)}</h1>
              <div className="text-sm text-gray-500 mb-4 flex items-center">
                <User className="h-4 w-4 mr-1" />
                {student.username}
              </div>
              
              {student.email && (
                <div className="text-sm text-gray-600 mb-4 flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  {student.email}
                </div>
              )}
              
              {student.createdAt && (
                <div className="text-sm text-gray-600 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Kayıt: {formatDate(student.createdAt)}
                </div>
              )}
            </div>
            
            <div className="md:w-2/3 p-6">
              <div className="flex flex-wrap gap-6">
                <div className="flex-1 min-w-[120px]">
                  <div className="text-sm text-gray-500 mb-1">Toplam Puan</div>
                  <div className="text-3xl font-bold text-blue-600">{student.points}</div>
                </div>
                
                <div className="flex-1 min-w-[120px]">
                  <div className="text-sm text-gray-500 mb-1">Sıralama</div>
                  <div className="flex items-center">
                    <span className="text-3xl font-bold text-indigo-600">{student.rank}</span>
                    <span className="text-gray-400 ml-1">/ {student.totalStudents}</span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-[120px]">
                  <div className="text-sm text-gray-500 mb-1">Son Etkinlik</div>
                  <div className="text-gray-800">
                    {pointHistory.length > 0 ? (
                      <div className="font-medium">{formatDate(pointHistory[0].createdAt)}</div>
                    ) : (
                      'Etkinlik yok'
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href={`/tutor/points/award?studentId=${student.id}`}>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <Award className="h-4 w-4 mr-2" />
                    Puan Ver
                  </Button>
                </Link>
                
                <Button variant="outline" className="border-blue-100">
                  <FileText className="h-4 w-4 mr-2" />
                  Rapor Oluştur
                </Button>
                
                <Button variant="outline" className="border-amber-100 text-amber-600 hover:bg-amber-50">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Not Ekle
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-1">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="points">Puan Geçmişi</TabsTrigger>
            <TabsTrigger value="events">Etkinlikler</TabsTrigger>
          </TabsList>
        </div>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border border-green-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-700">Haftalık İlerleme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-12 w-full bg-gray-100 rounded-md flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                  <span className="ml-2 text-gray-500">Grafik verisi</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Bu Hafta:</span>
                  <span className="font-medium text-green-600">+24 puan</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Geçen Hafta:</span>
                  <span className="font-medium text-gray-600">+18 puan</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-blue-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-700">Katılım Bilgisi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Toplam Etkinlik:</span>
                  <span className="font-medium text-gray-800">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Katıldığı:</span>
                  <span className="font-medium text-green-600">10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Katılmadığı:</span>
                  <span className="font-medium text-red-500">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Katılım Oranı:</span>
                  <span className="font-medium text-blue-600">83%</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-purple-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-700">Başarılar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="rounded-full bg-purple-100 p-1">
                      <Trophy className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="ml-2 text-sm text-gray-700">İlk 100 Puan</span>
                    <Badge className="ml-auto bg-green-100 text-green-700 hover:bg-green-100">Kazanıldı</Badge>
                  </div>
                  <div className="flex items-center">
                    <div className="rounded-full bg-purple-100 p-1">
                      <Activity className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="ml-2 text-sm text-gray-700">5 Etkinlik Katılımı</span>
                    <Badge className="ml-auto bg-green-100 text-green-700 hover:bg-green-100">Kazanıldı</Badge>
                  </div>
                  <div className="flex items-center">
                    <div className="rounded-full bg-gray-100 p-1">
                      <BookOpen className="h-4 w-4 text-gray-500" />
                    </div>
                    <span className="ml-2 text-sm text-gray-700">İlk 500 Puan</span>
                    <Badge className="ml-auto bg-gray-100 text-gray-500 hover:bg-gray-100">Henüz Değil</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-gray-700">Öğrenci Notları</CardTitle>
              <CardDescription>Öğrenci hakkında not bulunmamaktadır.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" size="sm">
                Not Ekle
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Points History Tab */}
        <TabsContent value="points" className="space-y-6">
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-gray-700">Puan Geçmişi</CardTitle>
              <CardDescription>
                Öğrencinin kazandığı ve harcadığı puanların detaylı geçmişi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pointHistory.length > 0 ? (
                <div className="space-y-4">
                  {pointHistory.map((transaction) => (
                    <div key={transaction.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`rounded-full p-2 ${transaction.type === 'award' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                            {transaction.type === 'award' ? (
                              <Trophy className="h-5 w-5" />
                            ) : (
                              <ArrowUpRight className="h-5 w-5" />
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="font-medium text-gray-800">
                              {transaction.type === 'award' ? 'Puan Kazandı' : 'Puan Harcadı'}
                            </div>
                            <div className="text-sm text-gray-500">{transaction.reason}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${transaction.type === 'award' ? 'text-green-600' : 'text-amber-600'}`}>
                            {transaction.type === 'award' ? '+' : '-'}{transaction.points}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(transaction.createdAt)} · {formatTime(transaction.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto rounded-full bg-gray-100 w-12 h-12 flex items-center justify-center mb-3">
                    <Trophy className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-gray-500">Puan geçmişi bulunmamaktadır</h3>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-gray-700">Etkinlik Katılımı</CardTitle>
              <CardDescription>
                Öğrencinin katıldığı ve katılacağı etkinlikler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="mx-auto rounded-full bg-gray-100 w-12 h-12 flex items-center justify-center mb-3">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-gray-500">Henüz etkinlik katılımı bulunmamaktadır</h3>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 