'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { 
  Activity, 
  Award, 
  Calendar, 
  TrendingUp, 
  Users, 
  BookOpen, 
  MessageCircle, 
  Palette,
  Trophy,
  Star,
  Target
} from 'lucide-react';
import toast from 'react-hot-toast';

type OverallStatsReportProps = {
  userRole: 'ADMIN' | 'TUTOR';
};

type ActivityDistribution = {
  name: string;
  value: number;
  percentage: number;
  count: number;
};

type TopStudent = {
  rank: number;
  id: string;
  name: string;
  points: number;
  experience: number;
};

type OverallStatsData = {
  totalStudents: number;
  totalPoints: number;
  totalExperience: number;
  totalPointsEarned: number;
  totalExperienceEarned: number;
  activityDistribution: ActivityDistribution[];
  averagePointsPerStudent: number;
  averageExperiencePerStudent: number;
  topStudentsByPoints: TopStudent[];
  topStudentsByExperience: TopStudent[];
  summary: {
    eventsParticipated: number;
    totalTransactions: number;
    averageEventParticipation: number;
  };
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function OverallStatsReport({ userRole }: OverallStatsReportProps) {
  const [statsData, setStatsData] = useState<OverallStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchOverallStats();
  }, []);

  const fetchOverallStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/reports/overall-stats');
      if (!response.ok) throw new Error('Failed to fetch overall stats');
      
      const data = await response.json();
      setStatsData(data);
    } catch (error) {
      console.error('Error fetching overall stats:', error);
      toast.error('Genel istatistikler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activityName: string) => {
    switch (activityName) {
      case 'Sohbet (Karakter Eğitimi)':
        return <MessageCircle className="h-4 w-4" />;
      case 'Atölye Faaliyetleri':
        return <Palette className="h-4 w-4" />;
      case 'Kitap Okuma':
        return <BookOpen className="h-4 w-4" />;
      case 'Etkinlik Katılımı':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (activityName: string) => {
    switch (activityName) {
      case 'Sohbet (Karakter Eğitimi)':
        return 'bg-blue-100 text-blue-800';
      case 'Atölye Faaliyetleri':
        return 'bg-green-100 text-green-800';
      case 'Kitap Okuma':
        return 'bg-purple-100 text-purple-800';
      case 'Etkinlik Katılımı':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!statsData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Genel istatistikler yüklenemedi</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Modern Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex justify-center">
          <TabsList className="grid w-full max-w-xl grid-cols-3 h-12 bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg rounded-xl p-1">
            <TabsTrigger 
              value="overview"
              className="flex items-center gap-2 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <Activity className="h-4 w-4" />
              Genel Bakış
            </TabsTrigger>
            <TabsTrigger 
              value="distribution"
              className="flex items-center gap-2 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <Target className="h-4 w-4" />
              Dağılım
            </TabsTrigger>
            <TabsTrigger 
              value="leaderboard"
              className="flex items-center gap-2 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <Trophy className="h-4 w-4" />
              Liderlik
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Distribution Pie Chart */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg text-white">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Genel Aktivite Dağılımı</CardTitle>
                    <CardDescription>
                      Tüm öğrencilerin aktivite bazlı bilge para dağılımı
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {statsData.activityDistribution.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statsData.activityDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name}: ${percentage}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statsData.activityDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`${value} puan`, 'Toplam']}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '12px',
                            backdropFilter: 'blur(8px)'
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex flex-col items-center justify-center text-gray-500">
                    <Activity className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-lg font-medium">Henüz aktivite verisi bulunmuyor</p>
                    <p className="text-sm text-gray-400">Öğrenciler aktivitelere katıldıkça burada görünecek</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Platform Overview */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Platform Genel Durumu</CardTitle>
                    <CardDescription>
                      Öğrenci katılımı ve genel aktivite metrikleri
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enhanced Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-700">{statsData.totalStudents}</div>
                      <p className="text-sm text-blue-600">Aktif Öğrenci</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-700">{statsData.summary.eventsParticipated}</div>
                      <p className="text-sm text-green-600">Etkinlik Katılımı</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-700">{statsData.averagePointsPerStudent}</div>
                      <p className="text-sm text-purple-600">Ortalama Puan</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-700">{statsData.summary.totalTransactions}</div>
                      <p className="text-sm text-orange-600">Toplam İşlem</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Activity Efficiency */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800">Aktivite Katılım Oranları</h4>
                  {statsData.activityDistribution.map((activity, index) => (
                    <div key={activity.name} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getActivityColor(activity.name)}`}>
                          {getActivityIcon(activity.name)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{activity.name}</p>
                          <p className="text-xs text-gray-500">{activity.count} katılım</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-800">{activity.percentage}%</div>
                        <p className="text-xs text-gray-500">{activity.value} puan</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Enhanced Distribution Tab */}
        <TabsContent value="distribution" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Aktivite Karşılaştırması</CardTitle>
                  <CardDescription>
                    Farklı aktivite türlerinden kazanılan toplam puanların detaylı analizi
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {statsData.activityDistribution.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData.activityDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        label={{ value: 'Aktivite Türü', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Puan', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value} puan`, 'Toplam Puan']}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px',
                          backdropFilter: 'blur(8px)'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="url(#gradient)" 
                        radius={[4, 4, 0, 0]}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#059669" stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-gray-500">
                  <Target className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-lg font-medium">Henüz aktivite verisi bulunmuyor</p>
                  <p className="text-sm text-gray-400">Aktiviteler başladıkça burada görünecek</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhanced Top Students by Points */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-white">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Bilge Para Liderleri</CardTitle>
                    <CardDescription>
                      En yüksek bilge para bakiyesine sahip öğrenciler
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {statsData.topStudentsByPoints.length > 0 ? (
                    statsData.topStudentsByPoints.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {student.rank}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-800">{student.name}</p>
                            <p className="text-xs text-gray-500">{student.experience} deneyim</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-yellow-500 text-white font-semibold px-3 py-1">
                            {student.points} puan
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium">Henüz öğrenci verisi bulunmuyor</p>
                      <p className="text-sm text-gray-400">İlk aktiviteler sonrası burada görünecek</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Top Students by Experience */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Deneyim Liderleri</CardTitle>
                    <CardDescription>
                      En yüksek deneyim puanına sahip öğrenciler
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {statsData.topStudentsByExperience.length > 0 ? (
                    statsData.topStudentsByExperience.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {student.rank}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-800">{student.name}</p>
                            <p className="text-xs text-gray-500">{student.points} bilge parası</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-blue-500 text-white font-semibold px-3 py-1">
                            {student.experience} deneyim
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium">Henüz öğrenci verisi bulunmuyor</p>
                      <p className="text-sm text-gray-400">İlk aktiviteler sonrası burada görünecek</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 