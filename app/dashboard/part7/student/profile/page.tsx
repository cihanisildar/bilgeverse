"use client";

import { ProfileSkeleton } from "@/app/components/ui/ProfileSkeleton";
import { HeaderSkeleton, SkeletonShimmer } from "@/app/components/ui/skeleton-shimmer";
import { useAuth } from "@/app/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from '@/app/hooks/use-toast';
import { Award, BookOpen, CheckCircle, Edit2, Layers, Mail, Phone, User, Star, Trophy } from 'lucide-react';

type StudentProfile = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  points: number;
  rank: number;
  totalStudents: number;
  tutor?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  stats?: {
    totalPoints: number;
    rank: number;
    completedEvents: number;
    approvedRequests: number;
  };
  joinDate: string;
};

// Static Header Component
function ProfileHeader() {
  return (
    <div className="mb-4 sm:mb-6">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
          Profil
        </span>
      </h1>
      <p className="mt-1 text-sm sm:text-base text-gray-600">Kişisel bilgileriniz ve istatistikleriniz</p>
    </div>
  );
}

// Dynamic Profile Content Component
function ProfileContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        // Get leaderboard to determine rank
        const leaderboardRes = await fetch('/api/leaderboard');
        const leaderboardData = await leaderboardRes.json();
        
        // Find user's rank
        const userRank = leaderboardData.leaderboard.findIndex(
          (student: any) => student.id === user?.id
        ) + 1;

        // Get student's stats
        const statsRes = await fetch('/api/student/stats');
        const statsData = await statsRes.json();

        setProfile({
          id: user?.id || "",
          username: user?.username || "",
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          points: user?.points || 0,
          rank: userRank,
          totalStudents: leaderboardData.leaderboard.length,
          tutor: user?.tutor,
          stats: statsData.stats,
          joinDate: user?.createdAt || new Date().toISOString()
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Profil bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
        {/* Left Column - Profile Card Loading */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            {/* Profile Header Loading */}
            <div className="relative">
              <SkeletonShimmer className="h-24 sm:h-32" />
              <div className="absolute -bottom-12 sm:-bottom-16 left-0 w-full flex justify-center">
                <SkeletonShimmer className="ring-4 ring-white rounded-full h-24 w-24 sm:h-32 sm:w-32" />
              </div>
            </div>
            
            {/* Profile Info Loading */}
            <div className="pt-16 sm:pt-20 pb-6 sm:pb-8 px-4 sm:px-6 text-center space-y-3">
              <SkeletonShimmer className="h-6 sm:h-8 rounded w-32 sm:w-40 mx-auto" />
              <SkeletonShimmer className="h-4 sm:h-5 rounded w-20 mx-auto" />
              <SkeletonShimmer className="h-3 sm:h-4 rounded w-28 mx-auto" />
              <SkeletonShimmer className="h-8 sm:h-10 rounded w-full sm:w-32 mx-auto mt-4 sm:mt-6" />
            </div>
            
            {/* Contact Info Loading */}
            <div className="border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
              <SkeletonShimmer className="h-4 rounded w-24 mb-2 sm:mb-3" />
              <div className="flex items-center space-x-2 sm:space-x-3">
                <SkeletonShimmer className="h-4 w-4 sm:h-5 sm:w-5 rounded" />
                <SkeletonShimmer className="h-4 rounded w-32" />
              </div>
            </div>
            
            {/* Stats Loading */}
            <div className="border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
              <SkeletonShimmer className="h-4 rounded w-20 mb-2 sm:mb-3" />
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center space-y-1">
                  <SkeletonShimmer className="h-6 sm:h-8 rounded" />
                  <SkeletonShimmer className="h-3 rounded" />
                </div>
                <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center space-y-1">
                  <SkeletonShimmer className="h-6 sm:h-8 rounded" />
                  <SkeletonShimmer className="h-3 rounded" />
                </div>
                <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center space-y-1">
                  <SkeletonShimmer className="h-6 sm:h-8 rounded" />
                  <SkeletonShimmer className="h-3 rounded" />
                </div>
                <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center space-y-1">
                  <SkeletonShimmer className="h-6 sm:h-8 rounded" />
                  <SkeletonShimmer className="h-3 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Content Loading */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            {/* Tutor Info Loading */}
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <SkeletonShimmer className="h-5 sm:h-6 rounded w-32 mb-3 sm:mb-4" />
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                <SkeletonShimmer className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex-shrink-0" />
                <div className="text-center sm:text-left space-y-2">
                  <SkeletonShimmer className="h-5 sm:h-6 rounded w-32" />
                  <SkeletonShimmer className="h-4 rounded w-24" />
                </div>
              </div>
            </div>

            {/* Achievement Stats Loading */}
            <div className="p-4 sm:p-6">
              <SkeletonShimmer className="h-5 sm:h-6 rounded w-20 mb-3 sm:mb-4" />
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-3 sm:p-4 rounded-lg border border-amber-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <SkeletonShimmer className="h-5 w-5 sm:h-6 sm:w-6 rounded flex-shrink-0" />
                      <div className="space-y-1">
                        <SkeletonShimmer className="h-4 rounded w-16" />
                        <SkeletonShimmer className="h-3 rounded w-32" />
                      </div>
                    </div>
                    <SkeletonShimmer className="h-6 sm:h-8 rounded w-12" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 sm:p-4 rounded-lg border border-indigo-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <SkeletonShimmer className="h-5 w-5 sm:h-6 sm:w-6 rounded flex-shrink-0" />
                      <div className="space-y-1">
                        <SkeletonShimmer className="h-4 rounded w-20" />
                        <SkeletonShimmer className="h-3 rounded w-40" />
                      </div>
                    </div>
                    <SkeletonShimmer className="h-6 sm:h-8 rounded w-16" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 sm:p-4 rounded-lg border border-green-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <SkeletonShimmer className="h-5 w-5 sm:h-6 sm:w-6 rounded flex-shrink-0" />
                      <div className="space-y-1">
                        <SkeletonShimmer className="h-4 rounded w-32" />
                        <SkeletonShimmer className="h-3 rounded w-44" />
                      </div>
                    </div>
                    <SkeletonShimmer className="h-6 sm:h-8 rounded w-8" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
        {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg shadow-sm">
        Profil bilgisi bulunamadı.
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMMM yyyy", { locale: tr });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
      {/* Left Column - Profile Card */}
      <div className="w-full lg:w-1/3">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          {/* Profile Header */}
          <div className="relative">
            <div className="h-24 sm:h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
            <div className="absolute -bottom-12 sm:-bottom-16 left-0 w-full flex justify-center">
              <div className="ring-4 ring-white rounded-full overflow-hidden h-24 w-24 sm:h-32 sm:w-32 bg-white">
                <div className="h-full w-full flex items-center justify-center text-2xl sm:text-4xl font-bold text-indigo-600">
                  {profile.firstName?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase() || 'Ö'}
                  {profile.lastName?.[0]?.toUpperCase() || (profile.firstName?.[1]?.toUpperCase() && profile.username?.[1]?.toUpperCase()) || ''}
                </div>
              </div>
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="pt-16 sm:pt-20 pb-6 sm:pb-8 px-4 sm:px-6 text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-indigo-600 font-medium text-sm sm:text-base">Öğrenci</p>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              Katılım: {formatDate(profile.joinDate)}
            </p>
            
            <Link
              href="/dashboard/part7/student/settings"
              className="mt-4 sm:mt-6 inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 border border-indigo-300 text-xs sm:text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 transition-colors w-full sm:w-auto"
            >
              <Edit2 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Profili Düzenle
            </Link>
          </div>
          
          {/* Contact Info */}
          <div className="border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">
              İletişim Bilgileri
            </h2>
            <ul className="space-y-2 sm:space-y-3">
              <li className="flex items-center text-gray-600 text-sm sm:text-base">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="truncate">{profile.username}</span>
              </li>
            </ul>
          </div>
          
          {/* Stats */}
          <div className="border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">
              İstatistikler
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="bg-indigo-50 rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-2xl font-bold text-indigo-600">{profile.points}</div>
                <div className="text-xs text-indigo-500">Puan</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-2xl font-bold text-purple-600">#{profile.rank}</div>
                <div className="text-xs text-purple-500">Sıralama</div>
              </div>
              <div className="bg-green-50 rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-2xl font-bold text-green-600">{profile.stats?.completedEvents || 0}</div>
                <div className="text-xs text-green-500">Tamamlanan</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">{profile.stats?.approvedRequests || 0}</div>
                <div className="text-xs text-blue-500">Onaylanan</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Column - Content */}
      <div className="w-full lg:w-2/3">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          {/* Tutor Info */}
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Öğretmen Bilgileri</h2>
            {profile.tutor ? (
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-indigo-100 flex items-center justify-center text-xl sm:text-2xl font-bold text-indigo-600 flex-shrink-0">
                  {profile.tutor.firstName?.[0]?.toUpperCase() || profile.tutor.username?.[0]?.toUpperCase() || 'Ö'}
                  {profile.tutor.lastName?.[0]?.toUpperCase() || (profile.tutor.firstName?.[1]?.toUpperCase() && profile.tutor.username?.[1]?.toUpperCase()) || ''}
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                    {profile.tutor.firstName} {profile.tutor.lastName}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">{profile.tutor.username}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm sm:text-base text-gray-500">Henüz bir öğretmen atanmamış.</p>
            )}
          </div>

          {/* Achievement Stats */}
          <div className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Başarılar</h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-3 sm:p-4 rounded-lg border border-amber-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Sıralama</h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {profile.rank <= 3 ? "🏆 Tebrikler! İlk 3'tesin!" : 
                         profile.rank <= 10 ? "👏 Harika! İlk 10'dasın!" :
                         profile.rank <= Math.ceil(profile.totalStudents * 0.25) ? "💪 İlk %25'tesin!" :
                         "Sıralamada yükselmek için puan topla!"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-amber-600">#{profile.rank}</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 sm:p-4 rounded-lg border border-indigo-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Star className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Toplam Puan</h3>
                      <p className="text-xs sm:text-sm text-gray-600">Şu ana kadar kazandığın puanlar</p>
                    </div>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-indigo-600">{profile.points}</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 sm:p-4 rounded-lg border border-green-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Tamamlanan Etkinlikler</h3>
                      <p className="text-xs sm:text-sm text-gray-600">Başarıyla tamamladığın etkinlikler</p>
                    </div>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-green-600">{profile.stats?.completedEvents || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading state component
function LoadingProfile() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6 sm:space-y-8">
        {/* Header Loading */}
        <div className="mb-4 sm:mb-6">
          <SkeletonShimmer className="h-8 sm:h-10 md:h-12 rounded-lg w-32 sm:w-40 mb-2" />
          <SkeletonShimmer className="h-4 sm:h-5 rounded w-64 sm:w-80" />
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Profile Card Loading */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              {/* Profile Header Loading */}
              <div className="relative">
                <SkeletonShimmer className="h-24 sm:h-32" />
                <div className="absolute -bottom-12 sm:-bottom-16 left-0 w-full flex justify-center">
                  <SkeletonShimmer className="ring-4 ring-white rounded-full h-24 w-24 sm:h-32 sm:w-32" />
                </div>
              </div>
              
              {/* Profile Info Loading */}
              <div className="pt-16 sm:pt-20 pb-6 sm:pb-8 px-4 sm:px-6 text-center space-y-3">
                <SkeletonShimmer className="h-6 sm:h-8 rounded w-32 sm:w-40 mx-auto" />
                <SkeletonShimmer className="h-4 sm:h-5 rounded w-20 mx-auto" />
                <SkeletonShimmer className="h-3 sm:h-4 rounded w-28 mx-auto" />
                <SkeletonShimmer className="h-8 sm:h-10 rounded w-full sm:w-32 mx-auto mt-4 sm:mt-6" />
              </div>
              
              {/* Contact Info Loading */}
              <div className="border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
                <SkeletonShimmer className="h-4 rounded w-24 mb-2 sm:mb-3" />
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <SkeletonShimmer className="h-4 w-4 sm:h-5 sm:w-5 rounded" />
                  <SkeletonShimmer className="h-4 rounded w-32" />
                </div>
              </div>
              
              {/* Stats Loading */}
              <div className="border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
                <SkeletonShimmer className="h-4 rounded w-20 mb-2 sm:mb-3" />
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center space-y-1">
                    <SkeletonShimmer className="h-6 sm:h-8 rounded" />
                    <SkeletonShimmer className="h-3 rounded" />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center space-y-1">
                    <SkeletonShimmer className="h-6 sm:h-8 rounded" />
                    <SkeletonShimmer className="h-3 rounded" />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center space-y-1">
                    <SkeletonShimmer className="h-6 sm:h-8 rounded" />
                    <SkeletonShimmer className="h-3 rounded" />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center space-y-1">
                    <SkeletonShimmer className="h-6 sm:h-8 rounded" />
                    <SkeletonShimmer className="h-3 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Content Loading */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              {/* Tutor Info Loading */}
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <SkeletonShimmer className="h-5 sm:h-6 rounded w-32 mb-3 sm:mb-4" />
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                  <SkeletonShimmer className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex-shrink-0" />
                  <div className="text-center sm:text-left space-y-2">
                    <SkeletonShimmer className="h-5 sm:h-6 rounded w-32" />
                    <SkeletonShimmer className="h-4 rounded w-24" />
                  </div>
                </div>
              </div>

              {/* Achievement Stats Loading */}
              <div className="p-4 sm:p-6">
                <SkeletonShimmer className="h-5 sm:h-6 rounded w-20 mb-3 sm:mb-4" />
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-3 sm:p-4 rounded-lg border border-amber-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <SkeletonShimmer className="h-5 w-5 sm:h-6 sm:w-6 rounded flex-shrink-0" />
                        <div className="space-y-1">
                          <SkeletonShimmer className="h-4 rounded w-16" />
                          <SkeletonShimmer className="h-3 rounded w-32" />
                        </div>
                      </div>
                      <SkeletonShimmer className="h-6 sm:h-8 rounded w-12" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 sm:p-4 rounded-lg border border-indigo-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <SkeletonShimmer className="h-5 w-5 sm:h-6 sm:w-6 rounded flex-shrink-0" />
                        <div className="space-y-1">
                          <SkeletonShimmer className="h-4 rounded w-20" />
                          <SkeletonShimmer className="h-3 rounded w-40" />
                        </div>
                      </div>
                      <SkeletonShimmer className="h-6 sm:h-8 rounded w-16" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 sm:p-4 rounded-lg border border-green-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <SkeletonShimmer className="h-5 w-5 sm:h-6 sm:w-6 rounded flex-shrink-0" />
                        <div className="space-y-1">
                          <SkeletonShimmer className="h-4 rounded w-32" />
                          <SkeletonShimmer className="h-3 rounded w-44" />
                        </div>
                      </div>
                      <SkeletonShimmer className="h-6 sm:h-8 rounded w-8" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentProfilePage() {
  const toast = useToast();
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingProfile />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <ProfileHeader />
        <ProfileContent />
      </div>
    </div>
  );
} 