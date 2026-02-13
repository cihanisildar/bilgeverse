'use client';

import { HeaderSkeleton, StatsCardSkeleton } from '@/app/components/ui/skeleton-shimmer';
import { useAuth } from '@/app/contexts/AuthContext';
import { LevelBadge } from "@/components/LevelBadge";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpDown, Award, BarChart2, Crown, Download, Filter, Medal, Search, Trophy, User, Users, Calendar, Zap, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  roles: string[];
}

interface Tutor extends User {
  role: 'TUTOR';
}

interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  experience: number;
  tutor: Tutor | null;
}

interface WeeklyTopEarner {
  rank: number;
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  weeklyPoints: number;
  weeklyExperience: number;
  totalExperience: number;
  tutor: Tutor | null;
}

const isTutor = (user: User): user is Tutor => {
  return (user.roles && user.roles.includes('TUTOR')) || user.role === 'TUTOR';
};

export default function AdminLeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [filteredLeaderboard, setFilteredLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [weeklyTopEarners, setWeeklyTopEarners] = useState<WeeklyTopEarner[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTutor, setSelectedTutor] = useState<string>('all');
  const [displayLimit, setDisplayLimit] = useState(1000);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all students for the leaderboard
        const leaderboardResponse = await fetch('/api/leaderboard?limit=1000');
        if (!leaderboardResponse.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }
        const leaderboardData = await leaderboardResponse.json();
        setLeaderboard(leaderboardData.leaderboard);
        setFilteredLeaderboard(leaderboardData.leaderboard);

        // Fetch weekly top earners
        const weeklyResponse = await fetch('/api/leaderboard/weekly-top-earners');
        if (weeklyResponse.ok) {
          const weeklyData = await weeklyResponse.json();
          setWeeklyTopEarners(weeklyData.weeklyLeaderboard);
        }

        // Fetch tutors for filtering
        const tutorsResponse = await fetch('/api/users?role=tutor');
        if (!tutorsResponse.ok) {
          throw new Error('Failed to fetch tutors');
        }
        const tutorsData = await tutorsResponse.json();
        setTutors(tutorsData.users.filter(isTutor));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  // Apply filters when search term or selected tutor changes
  useEffect(() => {
    let filtered = [...leaderboard];

    // Filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.username.toLowerCase().includes(lowerSearchTerm) ||
        (entry.firstName && entry.firstName.toLowerCase().includes(lowerSearchTerm)) ||
        (entry.lastName && entry.lastName.toLowerCase().includes(lowerSearchTerm))
      );
    }

    // Filter by selected tutor
    if (selectedTutor && selectedTutor !== 'all') {
      filtered = filtered.filter(entry => entry.tutor && entry.tutor.id === selectedTutor);
    }

    // Apply sort
    filtered = sortStudents(filtered, sortDirection);

    // Update ranks
    filtered = filtered.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    setFilteredLeaderboard(filtered);
  }, [searchTerm, selectedTutor, leaderboard, sortDirection]);

  // Function to sort students
  const sortStudents = (students: LeaderboardEntry[], direction: 'asc' | 'desc') => {
    return [...students].sort((a, b) => {
      return direction === 'desc' ? b.experience - a.experience : a.experience - b.experience;
    });
  };

  // Function to toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
  };

  // Function to get rank icon based on position
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <Award className="h-5 w-5 text-indigo-400" />;
    }
  };

  // Function to get the display name of a user
  const getDisplayName = (entry: { firstName: string | null; lastName: string | null; username: string }) => {
    if (entry.firstName && entry.lastName) {
      return `${entry.firstName} ${entry.lastName}`;
    }
    return entry.username;
  };

  // Function to export leaderboard as Excel-compatible CSV
  const exportToCSV = () => {
    // Helper function to properly escape CSV values for Excel
    const escapeCSV = (value: string | number) => {
      const stringValue = String(value);
      // Always wrap values in quotes to ensure proper separation
      return `"${stringValue.replace(/"/g, '""')}"`;
    };

    // Create CSV content with Turkish headers - using semicolon as delimiter for better Excel compatibility
    const csvData = [
      ['Sıra', 'Kullanıcı Adı', 'Ad Soyad', 'Deneyim Puanı', 'Öğretmen'],
      ...filteredLeaderboard.map(entry => [
        entry.rank.toString(),
        entry.username,
        `${entry.firstName || ''} ${entry.lastName || ''}`.trim() || entry.username,
        entry.experience.toString(),
        entry.tutor ? getDisplayName(entry.tutor) : 'Atanmamış'
      ])
    ];

    // Use semicolon separator for Turkish Excel compatibility and wrap all values in quotes
    const csvContent = csvData
      .map(row => row.map(cell => escapeCSV(cell)).join(';'))
      .join('\r\n');

    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    // Create blob with proper MIME type for Excel
    const blob = new Blob([csvWithBOM], {
      type: 'text/csv;charset=utf-8;'
    });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);

    // Generate Turkish filename with current date
    const currentDate = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
    link.setAttribute('download', `liderlik-tablosu-${currentDate}.csv`);

    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  };

  // Calculate statistics
  const calculateStats = () => {
    if (!filteredLeaderboard.length) return { avg: 0, max: 0, min: 0, median: 0 };

    const sortedExperience = [...filteredLeaderboard].map(entry => entry.experience).sort((a, b) => a - b);
    const sum = sortedExperience.reduce((acc, exp) => acc + exp, 0);

    return {
      avg: Math.round(sum / sortedExperience.length),
      max: sortedExperience[sortedExperience.length - 1],
      min: sortedExperience[0],
      median: sortedExperience.length % 2 === 0
        ? (sortedExperience[sortedExperience.length / 2 - 1] + sortedExperience[sortedExperience.length / 2]) / 2
        : sortedExperience[Math.floor(sortedExperience.length / 2)]
    };
  };

  // Function to group students by tutor
  const getStudentsByTutor = () => {
    const tutorMap: Record<string, { tutor: Tutor, count: number, totalExperience: number }> = {};

    filteredLeaderboard.forEach(entry => {
      if (entry.tutor) {
        const tutorId = entry.tutor.id;
        if (!tutorMap[tutorId]) {
          tutorMap[tutorId] = {
            tutor: entry.tutor,
            count: 0,
            totalExperience: 0
          };
        }
        tutorMap[tutorId].count += 1;
        tutorMap[tutorId].totalExperience += entry.experience;
      }
    });

    return Object.values(tutorMap).sort((a, b) => b.count - a.count);
  };

  // Function to group students by experience ranges
  const getPointsDistribution = () => {
    const experienceRanges: Record<string, number> = {};
    const rangeSize = 50;

    filteredLeaderboard.forEach(entry => {
      const rangeStart = Math.floor(entry.experience / rangeSize) * rangeSize;
      const rangeKey = `${rangeStart}-${rangeStart + rangeSize - 1}`;

      experienceRanges[rangeKey] = (experienceRanges[rangeKey] || 0) + 1;
    });

    return Object.entries(experienceRanges)
      .map(([range, count]) => ({ range, count }))
      .sort((a, b) => {
        const aStart = parseInt(a.range.split('-')[0]);
        const bStart = parseInt(b.range.split('-')[0]);
        return bStart - aStart;
      });
  };

  const stats = calculateStats();
  const tutorStats = getStudentsByTutor();
  const pointsDistribution = getPointsDistribution();

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <HeaderSkeleton />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>

        {/* Leaderboard Table Skeleton */}
        <Card className="border-0 shadow-lg">
          <div className="overflow-hidden">
            <div className="min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      Sıra
                    </th>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Öğrenci
                    </th>
                    <th scope="col" className="hidden md:table-cell px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Öğretmen
                    </th>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deneyim
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-3 py-2 sm:px-6 sm:py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Skeleton className="h-5 w-6 sm:h-6 sm:w-8" />
                          <Skeleton className="h-4 w-4 sm:h-5 sm:w-5 rounded-full" />
                        </div>
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <Skeleton className="h-8 w-8 rounded-full mr-2 sm:mr-3 hidden sm:block" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24 sm:w-32" />
                            <Skeleton className="h-3 w-20 sm:w-24" />
                            <Skeleton className="h-3 w-16 sm:w-20 md:hidden" />
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-3 py-2 sm:px-6 sm:py-3 whitespace-nowrap">
                        <Skeleton className="h-4 w-24 sm:w-32" />
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-3 whitespace-nowrap text-right">
                        <Skeleton className="h-5 w-12 sm:h-6 sm:w-16 rounded-full ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="space-y-4 sm:space-y-6">
        {/* Header with Gradient Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Liderlik Tablosu
              </span>
            </h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">Öğrencilerin deneyim sıralamasını ve performansını görüntüleyin</p>
          </div>

          <Button
            onClick={exportToCSV}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex items-center gap-2 shadow-md"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Excel Dosyası Olarak İndir</span>
            <span className="sm:hidden">İndir</span>
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg rounded-xl overflow-hidden bg-white">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-medium text-gray-800 flex items-center gap-2">
              <Filter className="h-5 w-5 text-indigo-500" />
              Filtreler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Öğrenci Ara</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="İsim veya kullanıcı adı..."
                    className="pl-8 border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="w-full">
                <label className="text-sm font-medium mb-1 block text-gray-700">Öğretmen Filtresi</label>
                <Select defaultValue="all" onValueChange={setSelectedTutor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tüm Öğretmenler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Öğretmenler</SelectItem>
                    {tutors.map(tutor => (
                      <SelectItem key={tutor.id} value={tutor.id}>
                        {getDisplayName(tutor)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block text-gray-700">Gösterilen Öğrenci Sayısı</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={displayLimit}
                  onChange={(e) => setDisplayLimit(Number(e.target.value))}
                >
                  <option value={20}>20 Öğrenci</option>
                  <option value={50}>50 Öğrenci</option>
                  <option value={100}>100 Öğrenci</option>
                  <option value={1000} selected>Tümünü Göster</option>
                </select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t px-4 sm:px-6">
            <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
              <div className="text-sm text-gray-600">
                Toplam <span className="font-medium">{filteredLeaderboard.length}</span> öğrenci gösteriliyor
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto border-gray-200 hover:bg-gray-100 hover:text-gray-700 text-gray-600"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTutor('all');
                }}
              >
                Filtreleri Sıfırla
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Toplam Öğrenci</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{filteredLeaderboard.length}</h3>
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Ortalama Deneyim</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.avg}</h3>
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <BarChart2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
            <div className="h-1 bg-gradient-to-r from-yellow-400 to-amber-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">En Yüksek Deneyim</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.max}</h3>
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                  <Trophy className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
            <div className="h-1 bg-gradient-to-r from-green-500 to-teal-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Medyan Deneyim</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.median}</h3>
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Award className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Weekly Top Earners Section - Top 5 Podium Design */}
        {weeklyTopEarners.length > 0 && (
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-gradient-to-br from-yellow-50/50 via-orange-50/50 to-red-50/50 backdrop-blur-lg">
            <div className="h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>
            <CardHeader className="pb-8 bg-gradient-to-r from-yellow-50/30 via-orange-50/30 to-red-50/30">
              <div className="text-center">
                <CardTitle className="text-4xl font-black flex items-center justify-center gap-4 mb-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-xl animate-pulse">
                    <Trophy className="h-10 w-10" />
                  </div>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600">
                    Bu Haftanın Şampiyonları
                  </span>
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl animate-pulse delay-1000">
                    <Crown className="h-10 w-10" />
                  </div>
                </CardTitle>
                <CardDescription className="text-xl text-orange-700 font-semibold flex items-center justify-center gap-3">
                  <Calendar className="h-6 w-6" />
                  Bu hafta en çok puan ve deneyim kazanan öğrenciler
                  <Zap className="h-6 w-6" />
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Top 5 Enhanced Podium */}
              <div className="relative px-4 sm:px-8 pb-12 pt-8">
                {/* Background decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-0 left-1/4 w-64 h-64 bg-gradient-to-r from-yellow-200/20 to-orange-200/20 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-r from-orange-200/20 to-red-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                {/* Main Podium - Top 3 */}
                <div className="relative mb-16">
                  <h3 className="text-2xl font-bold text-center mb-8 text-gray-800">🏆 Podyum 🏆</h3>
                  <div className="flex justify-center items-end gap-6 lg:gap-12 max-w-6xl mx-auto">

                    {/* 2nd Place */}
                    {weeklyTopEarners[1] && (
                      <div className="flex flex-col items-center relative">
                        {/* Floating effects */}
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                          <Medal className="h-8 w-8 text-gray-500" />
                        </div>

                        {/* Student Card */}
                        <div className="relative mb-6 transform hover:scale-110 transition-all duration-500">
                          <div className="w-36 bg-gradient-to-br from-gray-50 to-slate-100 border-4 border-gray-300 rounded-2xl p-4 shadow-2xl hover:shadow-gray-500/50">
                            <div className="text-center">
                              <Avatar className="h-20 w-20 mx-auto mb-3 ring-4 ring-gray-300 shadow-xl">
                                <AvatarFallback className="bg-gradient-to-br from-gray-200 to-gray-400 text-gray-800 text-2xl font-black">
                                  {getDisplayName(weeklyTopEarners[1]).charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <h3 className="font-black text-gray-900 text-lg mb-1 truncate">
                                {getDisplayName(weeklyTopEarners[1])}
                              </h3>
                              <p className="text-sm text-gray-600 mb-3 truncate">@{weeklyTopEarners[1].username}</p>
                              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-xl text-sm font-bold mb-2">
                                {weeklyTopEarners[1].weeklyExperience} XP
                              </div>
                              <div className="text-sm text-gray-600 font-semibold">
                                {weeklyTopEarners[1].weeklyPoints} puan
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Podium Base */}
                        <div className="relative">
                          <div className="w-32 h-24 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-2xl shadow-2xl flex items-center justify-center border-t-4 border-gray-200">
                            <div className="text-center">
                              <div className="text-3xl font-black text-gray-800 drop-shadow-lg">2</div>
                              <div className="text-sm font-bold text-gray-700">İKİNCİ</div>
                            </div>
                          </div>
                          {/* Shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-t-2xl animate-pulse"></div>
                        </div>
                      </div>
                    )}

                    {/* 1st Place */}
                    {weeklyTopEarners[0] && (
                      <div className="flex flex-col items-center relative z-10">
                        {/* Floating crown */}
                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 animate-bounce">
                          <Crown className="h-12 w-12 text-yellow-500" />
                        </div>

                        {/* Sparkles around winner */}
                        <div className="absolute -top-4 -left-4 animate-pulse">
                          <Zap className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div className="absolute -top-4 -right-4 animate-pulse delay-500">
                          <Zap className="h-6 w-6 text-orange-400" />
                        </div>

                        {/* Student Card */}
                        <div className="relative mb-8 transform hover:scale-115 transition-all duration-500">
                          <div className="w-44 bg-gradient-to-br from-yellow-50 to-orange-100 border-4 border-yellow-400 rounded-2xl p-6 shadow-2xl hover:shadow-yellow-500/50">
                            <div className="text-center">
                              <div className="relative">
                                <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-yellow-400 shadow-2xl">
                                  <AvatarFallback className="bg-gradient-to-br from-yellow-300 to-orange-400 text-yellow-900 text-3xl font-black">
                                    {getDisplayName(weeklyTopEarners[0]).charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                  <Crown className="h-5 w-5 text-white" />
                                </div>
                              </div>
                              <h3 className="font-black text-gray-900 text-xl mb-2 truncate">
                                {getDisplayName(weeklyTopEarners[0])}
                              </h3>
                              <p className="text-base text-gray-700 mb-4 truncate">@{weeklyTopEarners[0].username}</p>
                              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl text-lg font-bold mb-3 shadow-lg">
                                {weeklyTopEarners[0].weeklyExperience} XP
                              </div>
                              <div className="text-lg text-orange-600 font-black mb-2">
                                {weeklyTopEarners[0].weeklyPoints} puan
                              </div>
                              <div className="text-sm text-gray-600 font-semibold">
                                Toplam: {weeklyTopEarners[0].totalExperience}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Winner Podium Base */}
                        <div className="relative">
                          <div className="w-40 h-32 bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t-2xl shadow-2xl flex items-center justify-center border-t-4 border-yellow-200">
                            <div className="text-center">
                              <div className="text-4xl font-black text-yellow-900 drop-shadow-lg">1</div>
                              <div className="text-lg font-bold text-yellow-800">ŞAMPIYON</div>
                            </div>
                          </div>
                          {/* Golden shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/50 to-transparent rounded-t-2xl animate-pulse"></div>
                        </div>
                      </div>
                    )}

                    {/* 3rd Place */}
                    {weeklyTopEarners[2] && (
                      <div className="flex flex-col items-center relative">
                        {/* Floating medal */}
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-bounce delay-500">
                          <Medal className="h-8 w-8 text-amber-600" />
                        </div>

                        {/* Student Card */}
                        <div className="relative mb-6 transform hover:scale-110 transition-all duration-500">
                          <div className="w-36 bg-gradient-to-br from-amber-50 to-yellow-100 border-4 border-amber-400 rounded-2xl p-4 shadow-2xl hover:shadow-amber-500/50">
                            <div className="text-center">
                              <Avatar className="h-20 w-20 mx-auto mb-3 ring-4 ring-amber-400 shadow-xl">
                                <AvatarFallback className="bg-gradient-to-br from-amber-200 to-amber-400 text-amber-900 text-2xl font-black">
                                  {getDisplayName(weeklyTopEarners[2]).charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <h3 className="font-black text-gray-900 text-lg mb-1 truncate">
                                {getDisplayName(weeklyTopEarners[2])}
                              </h3>
                              <p className="text-sm text-gray-600 mb-3 truncate">@{weeklyTopEarners[2].username}</p>
                              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-xl text-sm font-bold mb-2">
                                {weeklyTopEarners[2].weeklyExperience} XP
                              </div>
                              <div className="text-sm text-gray-600 font-semibold">
                                {weeklyTopEarners[2].weeklyPoints} puan
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bronze Podium Base */}
                        <div className="relative">
                          <div className="w-32 h-20 bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-2xl shadow-2xl flex items-center justify-center border-t-4 border-amber-200">
                            <div className="text-center">
                              <div className="text-3xl font-black text-amber-900 drop-shadow-lg">3</div>
                              <div className="text-sm font-bold text-amber-800">ÜÇÜNCÜ</div>
                            </div>
                          </div>
                          {/* Bronze shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/40 to-transparent rounded-t-2xl animate-pulse"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top 5 - 4th and 5th Place */}
                {weeklyTopEarners.length > 3 && (
                  <div className="mt-12">
                    <h4 className="text-2xl font-bold text-center mb-8 text-gray-800">⭐ En İyi 5 ⭐</h4>
                    <div className="flex justify-center gap-8 max-w-4xl mx-auto">
                      {weeklyTopEarners.slice(3, 5).map((earner, index) => (
                        <div key={earner.id} className="flex flex-col items-center relative transform hover:scale-105 transition-all duration-500">
                          {/* Floating star */}
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 animate-bounce" style={{ animationDelay: `${index * 200}ms` }}>
                            <Award className="h-6 w-6 text-indigo-500" />
                          </div>

                          {/* Student Card */}
                          <div className="w-32 bg-gradient-to-br from-indigo-50 to-purple-100 border-3 border-indigo-300 rounded-xl p-4 shadow-xl hover:shadow-indigo-500/30">
                            <div className="text-center">
                              <div className="w-8 h-8 mx-auto mb-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-sm">{index + 4}</span>
                              </div>
                              <Avatar className="h-16 w-16 mx-auto mb-2 ring-3 ring-indigo-300 shadow-lg">
                                <AvatarFallback className="bg-gradient-to-br from-indigo-200 to-purple-300 text-indigo-900 text-lg font-bold">
                                  {getDisplayName(earner).charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">
                                {getDisplayName(earner)}
                              </h3>
                              <p className="text-xs text-gray-600 mb-2 truncate">@{earner.username}</p>
                              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-lg text-xs font-bold mb-1">
                                {earner.weeklyExperience} XP
                              </div>
                              <div className="text-xs text-gray-600 font-semibold">
                                {earner.weeklyPoints} puan
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Remaining Top Earners */}
                {weeklyTopEarners.length > 5 && (
                  <div className="mt-12">
                    <h4 className="text-xl font-semibold text-center mb-6 text-gray-700">🌟 Diğer Başarılı Öğrenciler 🌟</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 max-w-6xl mx-auto">
                      {weeklyTopEarners.slice(5, 11).map((earner, index) => (
                        <div
                          key={earner.id}
                          className="bg-gradient-to-br from-slate-50 to-gray-100 border-2 border-slate-200 rounded-xl p-3 hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-slate-300"
                        >
                          <div className="text-center">
                            <div className="w-6 h-6 mx-auto mb-2 bg-gradient-to-r from-slate-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                              {index + 6}
                            </div>
                            <Avatar className="h-10 w-10 mx-auto mb-2">
                              <AvatarFallback className="bg-slate-200 text-slate-800 text-sm font-bold">
                                {getDisplayName(earner).charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <h3 className="font-semibold text-gray-900 text-xs mb-1 truncate">
                              {getDisplayName(earner)}
                            </h3>
                            <div className="text-xs font-bold text-green-600 mb-1">
                              {earner.weeklyExperience} XP
                            </div>
                            <div className="text-xs text-gray-500">
                              {earner.weeklyPoints} puan
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {weeklyTopEarners.length > 11 && (
                      <div className="text-center mt-6">
                        <div className="text-lg text-gray-600 font-semibold bg-gray-100 rounded-full px-6 py-2 inline-block">
                          ve {weeklyTopEarners.length - 11} öğrenci daha... 🎯
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Two columns for data visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Point Distribution Card */}
          {filteredLeaderboard.length > 0 && (
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-indigo-500" />
                  Deneyim Dağılımı
                </CardTitle>
                <CardDescription>Öğrencilerin deneyim aralıklarına göre dağılımı</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pointsDistribution.map((item) => (
                    <div key={item.range} className="flex items-center">
                      <div className="w-24 text-sm font-medium text-gray-700">{item.range}</div>
                      <div className="flex-1 mx-2">
                        <div
                          className="h-2 bg-indigo-100 rounded-full overflow-hidden"
                        >
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                            style={{ width: `${(item.count / filteredLeaderboard.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-10 text-sm text-gray-500 text-right">{item.count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tutor Stats Card */}
          {tutorStats.length > 0 && (
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-500 to-teal-500"></div>
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" />
                  Öğretmen İstatistikleri
                </CardTitle>
                <CardDescription>Öğretmenlere göre öğrenci dağılımı ve ortalama deneyim</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tutorStats.map((item, index) => (
                    <div key={item.tutor.id || `tutor-${index}`} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center mb-2">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                            {getDisplayName(item.tutor).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-gray-800">{getDisplayName(item.tutor)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Öğrenci Sayısı: <strong>{item.count}</strong></span>
                        <span className="text-gray-600">Ort. Deneyim: <strong>{Math.round(item.totalExperience / item.count)}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Leaderboard Table */}
        <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg font-medium flex items-center gap-2">
              <Trophy className="h-5 w-5 text-indigo-500" />
              Öğrenci Sıralaması
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <div className="min-w-full align-middle">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th scope="col" className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        Sıra
                      </th>
                      <th scope="col" className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Öğrenci
                      </th>
                      <th scope="col" className="hidden md:table-cell px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Öğretmen
                      </th>
                      <th scope="col" className="px-3 py-2 sm:px-4 sm:py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-20 sm:w-24 text-right">
                        <button
                          onClick={toggleSortDirection}
                          className="flex items-center justify-end w-full"
                        >
                          <span className="hidden sm:inline">Deneyim</span>
                          <span className="sm:hidden">XP</span>
                          <ArrowUpDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredLeaderboard.slice(0, displayLimit).map((entry) => {
                      return (
                        <tr
                          key={entry.id}
                          className={`
                            ${entry.rank <= 3 ?
                              entry.rank === 1 ? 'bg-yellow-50' :
                                entry.rank === 2 ? 'bg-gray-50' :
                                  'bg-amber-50' : ''}
                            hover:bg-gray-50 transition-colors
                          `}
                        >
                          <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span className={`text-sm sm:text-base
                                ${entry.rank <= 3 ? 'font-bold' : ''}
                                ${entry.rank === 1 ? 'text-yellow-500' : ''}
                                ${entry.rank === 2 ? 'text-gray-500' : ''}
                                ${entry.rank === 3 ? 'text-amber-600' : ''}
                              `}>
                                #{entry.rank}
                              </span>
                              <div className="flex-shrink-0">
                                {getRankIcon(entry.rank)}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                            <div className="flex items-center min-w-0">
                              <Avatar className="h-7 w-7 sm:h-8 sm:w-8 mr-2 sm:mr-3 flex-shrink-0 hidden sm:block">
                                <AvatarFallback className={`text-xs sm:text-sm
                                  ${entry.rank === 1 ? 'bg-yellow-100 text-yellow-800' : ''}
                                  ${entry.rank === 2 ? 'bg-gray-100 text-gray-800' : ''}
                                  ${entry.rank === 3 ? 'bg-amber-100 text-amber-800' : ''}
                                  ${entry.rank > 3 ? 'bg-indigo-100 text-indigo-800' : ''}
                                `}>
                                  {getDisplayName(entry).charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  {getDisplayName(entry)}
                                </span>
                                <LevelBadge
                                  points={entry.experience}
                                  className="mt-0.5 sm:mt-1"
                                />
                                <span className="text-xs text-gray-500 md:hidden truncate">
                                  {entry.tutor && `Öğretmen: ${entry.tutor.firstName || entry.tutor.username}`}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap hidden md:table-cell">
                            {entry.tutor && (
                              <span className="text-sm text-gray-700 truncate block max-w-[200px]">
                                {entry.tutor.firstName && entry.tutor.lastName
                                  ? `${entry.tutor.firstName} ${entry.tutor.lastName}`
                                  : entry.tutor.username}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-right">
                            <div className="flex items-center gap-1 sm:gap-2 justify-end">
                              <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm">
                                {entry.experience}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t py-2 sm:py-3">
            <div className="w-full text-center text-xs sm:text-sm text-gray-500">
              Gösterilen: {Math.min(displayLimit, filteredLeaderboard.length)} / {filteredLeaderboard.length} öğrenci
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8 text-xs text-gray-500">
          © {new Date().getFullYear()} Öğrenci Takip Sistemi. Tüm hakları saklıdır.
        </div>
      </div>
    </div>
  );
} 