"use client";

import { ProfileSkeleton } from "@/app/components/ui/ProfileSkeleton";
import { HeaderSkeleton } from "@/app/components/ui/skeleton-shimmer";
import { useAuth } from "@/app/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from 'react-hot-toast';
import { Award, BookOpen, CheckCircle, Edit2, Layers, Mail, Phone, User, Star, Trophy } from 'lucide-react';

type StudentProfile = {
  id: string;
  username: string;
  email: string;
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
    <div className="mb-6">
      <h1 className="text-3xl font-bold">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
          Profil
        </span>
      </h1>
      <p className="mt-1 text-gray-600">Kişisel bilgileriniz ve istatistikleriniz</p>
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
          email: user?.email || "",
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
    return <ProfileSkeleton />;
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
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Column - Profile Card */}
      <div className="lg:w-1/3">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          {/* Profile Header */}
          <div className="relative">
            <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
            <div className="absolute -bottom-16 left-0 w-full flex justify-center">
              <div className="ring-4 ring-white rounded-full overflow-hidden h-32 w-32 bg-white">
                <div className="h-full w-full flex items-center justify-center text-4xl font-bold text-indigo-600">
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </div>
              </div>
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="pt-20 pb-8 px-6 text-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-indigo-600 font-medium">Öğrenci</p>
            <p className="text-gray-500 text-sm mt-1">
              Katılım: {formatDate(profile.joinDate)}
            </p>
            
            <Link
              href="/student/settings"
              className="mt-6 inline-flex items-center justify-center px-4 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 transition-colors"
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Profili Düzenle
            </Link>
          </div>
          
          {/* Contact Info */}
          <div className="border-t border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              İletişim Bilgileri
            </h2>
            <ul className="space-y-3">
              <li className="flex items-center text-gray-600">
                <Mail className="h-5 w-5 text-gray-400 mr-3" />
                <span>{profile.email}</span>
              </li>
              <li className="flex items-center text-gray-600">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <span>{profile.username}</span>
              </li>
            </ul>
          </div>
          
          {/* Stats */}
          <div className="border-t border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              İstatistikler
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-indigo-600">{profile.points}</div>
                <div className="text-xs text-indigo-500">Puan</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">#{profile.rank}</div>
                <div className="text-xs text-purple-500">Sıralama</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{profile.stats?.completedEvents || 0}</div>
                <div className="text-xs text-green-500">Tamamlanan</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{profile.stats?.approvedRequests || 0}</div>
                <div className="text-xs text-blue-500">Onaylanan</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Column - Content */}
      <div className="lg:w-2/3">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          {/* Tutor Info */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Öğretmen Bilgileri</h2>
            {profile.tutor ? (
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
                  {profile.tutor.firstName?.[0]}{profile.tutor.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {profile.tutor.firstName} {profile.tutor.lastName}
                  </h3>
                  <p className="text-gray-600">{profile.tutor.username}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Henüz bir öğretmen atanmamış.</p>
            )}
          </div>

          {/* Achievement Stats */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Başarılar</h2>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg border border-amber-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Trophy className="h-6 w-6 text-amber-500" />
                    <div>
                      <h3 className="font-semibold text-gray-800">Sıralama</h3>
                      <p className="text-sm text-gray-600">
                        {profile.rank <= 3 ? "🏆 Tebrikler! İlk 3'tesin!" : 
                         profile.rank <= 10 ? "👏 Harika! İlk 10'dasın!" :
                         profile.rank <= Math.ceil(profile.totalStudents * 0.25) ? "💪 İlk %25'tesin!" :
                         "Sıralamada yükselmek için puan topla!"}
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-amber-600">#{profile.rank}</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Star className="h-6 w-6 text-indigo-500" />
                    <div>
                      <h3 className="font-semibold text-gray-800">Toplam Puan</h3>
                      <p className="text-sm text-gray-600">Şu ana kadar kazandığın puanlar</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-indigo-600">{profile.points}</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <h3 className="font-semibold text-gray-800">Tamamlanan Etkinlikler</h3>
                      <p className="text-sm text-gray-600">Başarıyla tamamladığın etkinlikler</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{profile.stats?.completedEvents || 0}</span>
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
    <div className="space-y-8">
      <HeaderSkeleton />
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/3">
          <ProfileSkeleton />
        </div>
        <div className="lg:w-2/3">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function StudentProfilePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <LoadingProfile />
      ) : (
        <div className="space-y-8">
          <ProfileHeader />
          <ProfileContent />
        </div>
      )}
    </div>
  );
} 