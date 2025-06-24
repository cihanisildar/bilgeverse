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
import { ArrowUpDown, Award, BarChart2, Crown, Download, Filter, Medal, Search, Trophy, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
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

// Function to check if a user is a tutor
const isTutor = (user: User): user is Tutor => {
  return user.role === 'TUTOR';
};

export default function AdminLeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [filteredLeaderboard, setFilteredLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTutor, setSelectedTutor] = useState<string>('all');
  const [displayLimit, setDisplayLimit] = useState(20);
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
                  <option value={1000}>Tümünü Göster</option>
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