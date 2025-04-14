'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Trophy, Award, Medal, Crown, BarChart2, Filter, User, Users, Search, Download, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { HeaderSkeleton, StatsCardSkeleton, LeaderboardEntrySkeleton } from '@/app/components/ui/skeleton-shimmer';

interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  currentPoints: number;
  totalEarnedPoints: number;
  tutor: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface Tutor {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
}

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
        if (tutorsResponse.ok) {
          const tutorsData = await tutorsResponse.json();
          setTutors(tutorsData.users);
        }
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
      return direction === 'desc' ? b.totalEarnedPoints - a.totalEarnedPoints : a.totalEarnedPoints - b.totalEarnedPoints;
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

  // Function to export leaderboard as CSV
  const exportToCSV = () => {
    const csvContent = [
      ['Rank', 'Username', 'Name', 'Points', 'Tutor'],
      ...filteredLeaderboard.map(entry => [
        entry.rank,
        entry.username,
        `${entry.firstName || ''} ${entry.lastName || ''}`.trim(),
        entry.totalEarnedPoints,
        entry.tutor ? getDisplayName(entry.tutor) : ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'leaderboard.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate statistics
  const calculateStats = () => {
    if (!filteredLeaderboard.length) return { avg: 0, max: 0, min: 0, median: 0 };
    
    const sortedPoints = [...filteredLeaderboard].map(entry => entry.totalEarnedPoints).sort((a, b) => a - b);
    const sum = sortedPoints.reduce((acc, points) => acc + points, 0);
    
    return {
      avg: Math.round(sum / sortedPoints.length),
      max: sortedPoints[sortedPoints.length - 1],
      min: sortedPoints[0],
      median: sortedPoints.length % 2 === 0 
        ? (sortedPoints[sortedPoints.length / 2 - 1] + sortedPoints[sortedPoints.length / 2]) / 2
        : sortedPoints[Math.floor(sortedPoints.length / 2)]
    };
  };

  // Function to group students by tutor
  const getStudentsByTutor = () => {
    const tutorMap: Record<string, { tutor: Tutor, count: number, totalPoints: number }> = {};
    
    filteredLeaderboard.forEach(entry => {
      if (entry.tutor) {
        const tutorId = entry.tutor.id;
        if (!tutorMap[tutorId]) {
          tutorMap[tutorId] = {
            tutor: entry.tutor,
            count: 0,
            totalPoints: 0
          };
        }
        tutorMap[tutorId].count += 1;
        tutorMap[tutorId].totalPoints += entry.totalEarnedPoints;
      }
    });
    
    return Object.values(tutorMap).sort((a, b) => b.count - a.count);
  };

  // Function to group students by point ranges
  const getPointsDistribution = () => {
    const pointRanges: Record<string, number> = {};
    const rangeSize = 50;
    
    filteredLeaderboard.forEach(entry => {
      const rangeStart = Math.floor(entry.totalEarnedPoints / rangeSize) * rangeSize;
      const rangeKey = `${rangeStart}-${rangeStart + rangeSize - 1}`;
      
      pointRanges[rangeKey] = (pointRanges[rangeKey] || 0) + 1;
    });
    
    return Object.entries(pointRanges)
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
      <div className="space-y-6 max-w-7xl mx-auto py-8">
        <HeaderSkeleton />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>

        {/* Leaderboard Table */}
        <Card className="border-0 shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sıralama
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Öğrenci
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Öğretmen
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[1, 2, 3, 4, 5].map((i) => (
                  <LeaderboardEntrySkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Gradient Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Liderlik Tablosu
              </span>
            </h1>
            <p className="mt-1 text-gray-600">Öğrencilerin puan sıralamasını ve performansını görüntüleyin</p>
          </div>
          
          <Button 
            onClick={exportToCSV} 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex items-center gap-2 shadow-md"
          >
            <Download className="h-4 w-4" />
            CSV Olarak İndir
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg rounded-xl overflow-hidden bg-white">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-800 flex items-center gap-2">
              <Filter className="h-5 w-5 text-indigo-500" />
              Filtreler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              
              <div className="w-full md:w-64">
                <label className="text-sm font-medium mb-1 block text-gray-700">Öğretmen Filtresi</label>
                <Select defaultValue={selectedTutor} onValueChange={setSelectedTutor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tüm Öğretmenler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Öğretmenler</SelectItem>
                    {tutors?.map(tutor => (
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
          <CardFooter className="bg-gray-50 border-t">
            <div className="w-full flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Toplam <span className="font-medium">{filteredLeaderboard.length}</span> öğrenci gösteriliyor
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-gray-200 hover:bg-gray-100 hover:text-gray-700 text-gray-600"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <p className="text-sm font-medium text-gray-500">Ortalama Puan</p>
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
                  <p className="text-sm font-medium text-gray-500">En Yüksek Puan</p>
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
                  <p className="text-sm font-medium text-gray-500">Medyan Puan</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Point Distribution Card */}
          {filteredLeaderboard.length > 0 && (
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-indigo-500" />
                  Puan Dağılımı
                </CardTitle>
                <CardDescription>Öğrencilerin puan aralıklarına göre dağılımı</CardDescription>
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
                <CardDescription>Öğretmenlere göre öğrenci dağılımı ve ortalama puan</CardDescription>
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
                        <span className="text-gray-600">Ort. Puan: <strong>{Math.round(item.totalPoints / item.count)}</strong></span>
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
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Trophy className="h-5 w-5 text-indigo-500" />
              Öğrenci Sıralaması
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Sıra</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Öğrenci</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Öğretmen</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-24 text-right">
                      <button 
                        onClick={toggleSortDirection}
                        className="flex items-center justify-end w-full"
                      >
                        Puan
                        <ArrowUpDown className="ml-1 h-4 w-4" />
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
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`
                              ${entry.rank <= 3 ? 'font-bold' : ''}
                              ${entry.rank === 1 ? 'text-yellow-500' : ''}
                              ${entry.rank === 2 ? 'text-gray-500' : ''}
                              ${entry.rank === 3 ? 'text-amber-600' : ''}
                            `}>
                              #{entry.rank}
                            </span>
                            {getRankIcon(entry.rank)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarFallback className={`
                                ${entry.rank === 1 ? 'bg-yellow-100 text-yellow-800' : ''}
                                ${entry.rank === 2 ? 'bg-gray-100 text-gray-800' : ''}
                                ${entry.rank === 3 ? 'bg-amber-100 text-amber-800' : ''}
                                ${entry.rank > 3 ? 'bg-indigo-100 text-indigo-800' : ''}
                              `}>
                                {getDisplayName(entry).charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">
                                {getDisplayName(entry)}
                              </span>
                              <span className="text-xs text-gray-500 md:hidden">
                                {entry.tutor && `Öğretmen: ${entry.tutor.firstName || entry.tutor.username}`}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                          {entry.tutor && (
                            <span className="text-sm text-gray-700">
                              {entry.tutor.firstName && entry.tutor.lastName 
                                ? `${entry.tutor.firstName} ${entry.tutor.lastName}` 
                                : entry.tutor.username}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 font-medium">Kazanılan:</span>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm">
                                {entry.totalEarnedPoints}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 font-medium">Mevcut:</span>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm">
                                {entry.currentPoints}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t py-3">
            <div className="w-full text-center text-sm text-gray-500">
              Gösterilen: {Math.min(displayLimit, filteredLeaderboard.length)} / {filteredLeaderboard.length} öğrenci
            </div>
          </CardFooter>
        </Card>
        
        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-500">
          © {new Date().getFullYear()} Öğrenci Takip Sistemi. Tüm hakları saklıdır.
        </div>
      </div>
    </div>
  );
} 