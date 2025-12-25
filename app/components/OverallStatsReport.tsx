'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Palette,
  Star,
  Target,
  Trophy,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/app/hooks/use-toast';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

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

// Default/fallback data structure
const DEFAULT_STATS_DATA: OverallStatsData = {
  totalStudents: 0,
  totalPoints: 0,
  totalExperience: 0,
  totalPointsEarned: 0,
  totalExperienceEarned: 0,
  activityDistribution: [],
  averagePointsPerStudent: 0,
  averageExperiencePerStudent: 0,
  topStudentsByPoints: [],
  topStudentsByExperience: [],
  summary: {
    eventsParticipated: 0,
    totalTransactions: 0,
    averageEventParticipation: 0
  }
};

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0',
  '#87CEEB', '#DDA0DD', '#F0E68C', '#FF6347', '#40E0D0'
];

// Helper function for safe data access with proper fallbacks
// This handles both old and new API response formats
const getSafeStatsData = (data: any): OverallStatsData => {
  if (!data) return DEFAULT_STATS_DATA;

  // Handle backward compatibility - check if summary exists
  const hasSummary = data.summary && typeof data.summary === 'object';
  console.log('Processing data:', { hasSummary, summary: data.summary }); // Debug log

  return {
    totalStudents: data.totalStudents ?? 0,
    totalPoints: data.totalPoints ?? 0,
    totalExperience: data.totalExperience ?? 0,
    totalPointsEarned: data.totalPointsEarned ?? 0,
    totalExperienceEarned: data.totalExperienceEarned ?? 0,
    activityDistribution: Array.isArray(data.activityDistribution) ? data.activityDistribution : [],
    averagePointsPerStudent: data.averagePointsPerStudent ?? 0,
    averageExperiencePerStudent: data.averageExperiencePerStudent ?? 0,
    topStudentsByPoints: Array.isArray(data.topStudentsByPoints) ? data.topStudentsByPoints : [],
    topStudentsByExperience: Array.isArray(data.topStudentsByExperience) ? data.topStudentsByExperience : [],
    summary: {
      eventsParticipated: hasSummary ? (data.summary.eventsParticipated ?? 0) : 0,
      totalTransactions: hasSummary ? (data.summary.totalTransactions ?? 0) : 0,
      averageEventParticipation: hasSummary ? (data.summary.averageEventParticipation ?? 0) : 0
    }
  };
};

export default function OverallStatsReport({ userRole }: OverallStatsReportProps) {
  const toast = useToast();
  const [statsData, setStatsData] = useState<OverallStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  useEffect(() => {
    fetchOverallStats();
  }, []);

  const fetchOverallStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/reports/overall-stats');
      if (!response.ok) throw new Error('Failed to fetch overall stats');

      const data = await response.json();
      console.log('Received API data:', data); // Debug log
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

  // Pagination logic for activities
  const getPaginatedActivities = () => {
    if (!statsData?.activityDistribution || !Array.isArray(statsData.activityDistribution)) return [];

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return statsData.activityDistribution.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    if (!statsData?.activityDistribution || !Array.isArray(statsData.activityDistribution)) return 0;
    return Math.ceil(statsData.activityDistribution.length / itemsPerPage);
  };

  const goToNextPage = () => {
    if (currentPage < getTotalPages()) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Prepare data for pie chart with better organization
  const getChartData = () => {
    if (!statsData?.activityDistribution || !Array.isArray(statsData.activityDistribution)) return [];

    // Sort by percentage descending
    const sortedData = [...statsData.activityDistribution].sort((a, b) => b.percentage - a.percentage);

    // Group small activities (less than 3%) into "Diğer Aktiviteler"
    const threshold = 3; // 3% threshold
    const mainActivities = sortedData.filter(activity => activity.percentage >= threshold);
    const smallActivities = sortedData.filter(activity => activity.percentage < threshold);

    let chartData = mainActivities.map((activity, index) => ({
      ...activity,
      shortName: activity.name.length > 20 ? activity.name.substring(0, 20) + '...' : activity.name,
      color: COLORS[index % COLORS.length]
    }));

    // Add "Other Activities" if there are small activities
    if (smallActivities.length > 0) {
      const otherTotal = smallActivities.reduce((sum, activity) => sum + activity.percentage, 0);
      const otherValue = smallActivities.reduce((sum, activity) => sum + activity.value, 0);
      const otherCount = smallActivities.reduce((sum, activity) => sum + activity.count, 0);

      chartData.push({
        name: 'Diğer Aktiviteler',
        shortName: 'Diğer Aktiviteler',
        value: otherValue,
        percentage: otherTotal,
        count: otherCount,
        color: '#94A3B8' // Gray color for "Other"
      });
    }

    return chartData;
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

  // Use safe data access with proper fallbacks
  const safeStatsData = getSafeStatsData(statsData);
  const chartData = getChartData();
  const paginatedActivities = getPaginatedActivities();
  const totalPages = getTotalPages();

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
            {/* Activity Distribution Horizontal Bar Chart */}
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
                {chartData.length > 0 ? (
                  <div className="space-y-4">
                    {/* Shadcn-style Horizontal Bar Chart */}
                    <div className="space-y-3">
                      {chartData.map((activity, index) => {
                        const maxPercentage = Math.max(...chartData.map(d => d.percentage));
                        const barWidth = (activity.percentage / maxPercentage) * 100;

                        return (
                          <div key={activity.name} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-700 truncate pr-4" title={activity.name}>
                                {activity.name.length > 40 ? activity.name.substring(0, 40) + '...' : activity.name}
                              </span>
                              <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
                                <span className="font-semibold">{activity.percentage}%</span>
                                <span>({activity.value} puan)</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                style={{
                                  width: `${barWidth}%`,
                                  backgroundColor: activity.color
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary Stats */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="font-bold text-blue-700 text-lg">
                            {chartData.reduce((sum, item) => sum + item.count, 0)}
                          </div>
                          <p className="text-blue-600">Toplam Katılım</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="font-bold text-green-700 text-lg">
                            {chartData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                          </div>
                          <p className="text-green-600">Toplam Puan</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-96 flex flex-col items-center justify-center text-gray-500">
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
                      <div className="text-2xl font-bold text-blue-700">{safeStatsData.totalStudents}</div>
                      <p className="text-sm text-blue-600">Aktif Öğrenci</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-700">{safeStatsData.summary.eventsParticipated}</div>
                      <p className="text-sm text-green-600">Etkinlik Katılımı</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-700">{safeStatsData.averagePointsPerStudent}</div>
                      <p className="text-sm text-purple-600">Ortalama Puan</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-700">{safeStatsData.summary.totalTransactions}</div>
                      <p className="text-sm text-orange-600">Toplam İşlem</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Activity Efficiency with Pagination */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800">Aktivite Katılım Oranları</h4>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{currentPage} / {totalPages}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={goToPrevPage}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {paginatedActivities.map((activity, index) => (
                      <div key={activity.name} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getActivityColor(activity.name)}`}>
                            {getActivityIcon(activity.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate" title={activity.name}>
                              {activity.name}
                            </p>
                            <p className="text-xs text-gray-500">{activity.count} katılım</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-gray-800">{activity.percentage}%</div>
                          <p className="text-xs text-gray-500">{activity.value} puan</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {(!statsData.activityDistribution || !Array.isArray(statsData.activityDistribution) || statsData.activityDistribution.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm">Henüz aktivite verisi bulunmuyor</p>
                    </div>
                  )}
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
              {statsData.activityDistribution && Array.isArray(statsData.activityDistribution) && statsData.activityDistribution.length > 0 ? (
                <>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="45%"
                          labelLine={false}
                          label={({ name, percentage }) => {
                            // Only show labels for slices with percentage >= 5%
                            if (percentage >= 5) {
                              return `${percentage}%`;
                            }
                            return '';
                          }}
                          outerRadius={100}
                          innerRadius={30}
                          fill="#8884d8"
                          dataKey="percentage"
                          paddingAngle={2}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, props) => [
                            `${value}% (${props.payload.value} puan)`,
                            props.payload.name
                          ]}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '12px',
                            backdropFilter: 'blur(8px)'
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={80}
                          layout="horizontal"
                          wrapperStyle={{
                            paddingTop: '20px',
                            fontSize: '12px'
                          }}
                          formatter={(value, entry, index) => {
                            const data = chartData[index];
                            return (
                              <span style={{ color: entry.color, fontSize: '11px' }}>
                                {data.shortName}
                              </span>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Detailed Activity Breakdown */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-800 text-sm">Detaylı Aktivite Listesi</h4>
                      <Badge variant="outline" className="text-xs">
                        {statsData.activityDistribution?.length || 0} aktivite
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                      {statsData.activityDistribution
                        ?.sort((a, b) => b.percentage - a.percentage)
                        .map((activity, index) => (
                          <div key={activity.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span className="truncate" title={activity.name}>
                                {activity.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="font-semibold text-gray-700">{activity.percentage}%</span>
                              <span className="text-gray-500">({activity.value})</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-96 flex flex-col items-center justify-center text-gray-500">
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
                  {safeStatsData.topStudentsByPoints.length > 0 ? (
                    safeStatsData.topStudentsByPoints.map((student) => (
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
                  {safeStatsData.topStudentsByExperience.length > 0 ? (
                    safeStatsData.topStudentsByExperience.map((student) => (
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