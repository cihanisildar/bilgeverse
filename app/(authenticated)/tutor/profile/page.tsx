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
import { Award, BookOpen, CheckCircle, Edit2, Layers, Mail, Phone, User } from 'lucide-react';

type TutorProfile = {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  profileImage?: string;
  specialization?: string;
  joinDate: string;
  subjects?: string[];
  certifications?: {
    id: string;
    name: string;
    issuedBy: string;
    date: string;
  }[];
  education?: {
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    from: string;
    to: string;
  }[];
  stats?: {
    studentsCount: number;
    eventsCount: number;
    pointsAwarded: number;
    completedEvents: number;
  };
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

// Loading state components
function ProfileCardSkeleton() {
  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <div className="relative">
        <Skeleton className="h-32 w-full" />
        <div className="absolute -bottom-16 left-0 w-full flex justify-center">
          <Skeleton className="h-32 w-32 rounded-full ring-4 ring-white" />
        </div>
      </div>
      <div className="pt-20 pb-8 px-6 text-center">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto mt-2" />
        <Skeleton className="h-4 w-40 mx-auto mt-1" />
        <Skeleton className="h-10 w-36 mx-auto mt-6" />
      </div>
      <div className="border-t border-gray-100 px-6 py-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function StatsCardSkeleton() {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={`stat-skeleton-${index}`} className="text-center p-4 rounded-lg bg-gray-50">
              <Skeleton className="h-8 w-12 mx-auto" />
              <Skeleton className="h-4 w-24 mx-auto mt-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EducationSkeleton() {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {[...Array(2)].map((_, index) => (
            <div key={`education-skeleton-${index}`} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
              <Skeleton className="h-5 w-48" />
              <div className="mt-2 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CertificationsSkeleton() {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(2)].map((_, index) => (
            <div key={`cert-skeleton-${index}`} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingProfile() {
  return (
    <div className="space-y-8">
      <HeaderSkeleton />
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/3">
          <ProfileCardSkeleton />
        </div>
        <div className="lg:w-2/3 space-y-6">
          <StatsCardSkeleton />
          <EducationSkeleton />
          <CertificationsSkeleton />
        </div>
      </div>
    </div>
  );
}

// Dynamic Profile Content Component
function ProfileContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<TutorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tutor/profile', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const data = await response.json();
        setProfile({
          id: user?.id || "",
          username: user?.username || "",
          email: user?.email || "",
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          joinDate: user?.createdAt || new Date().toISOString(),
          stats: data.stats || {
            studentsCount: 0,
            eventsCount: 0,
            pointsAwarded: 0,
            completedEvents: 0
          }
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
              <div className="ring-4 ring-white rounded-full overflow-hidden h-32 w-32">
                <img 
                  src={profile.profileImage} 
                  alt={`${profile.firstName} ${profile.lastName}`}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="pt-20 pb-8 px-6 text-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-indigo-600 font-medium">{profile.specialization}</p>
            <p className="text-gray-500 text-sm mt-1">
              Katılım: {formatDate(profile.joinDate)}
            </p>
            
            <Link
              href="/tutor/settings"
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
              {profile.phone && (
                <li className="flex items-center text-gray-600">
                  <Phone className="h-5 w-5 text-gray-400 mr-3" />
                  <span>{profile.phone}</span>
                </li>
              )}
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
                <div className="text-2xl font-bold text-indigo-600">{profile.stats?.studentsCount}</div>
                <div className="text-xs text-indigo-500">Öğrenci</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">{profile.stats?.eventsCount}</div>
                <div className="text-xs text-purple-500">Etkinlik</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{profile.stats?.pointsAwarded}</div>
                <div className="text-xs text-green-500">Puan</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{profile.stats?.completedEvents}</div>
                <div className="text-xs text-blue-500">Tamamlanan</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Column - Content Tabs */}
      <div className="lg:w-2/3">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-100">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("about")}
                className={`py-4 px-6 inline-flex items-center ${
                  activeTab === "about"
                    ? "border-b-2 border-indigo-500 text-indigo-600 font-medium"
                    : "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300"
                }`}
              >
                <User className={`mr-2 h-5 w-5 ${activeTab === "about" ? "text-indigo-500" : "text-gray-400"}`} />
                Hakkımda
              </button>
              <button
                onClick={() => setActiveTab("subjects")}
                className={`py-4 px-6 inline-flex items-center ${
                  activeTab === "subjects"
                    ? "border-b-2 border-indigo-500 text-indigo-600 font-medium"
                    : "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300"
                }`}
              >
                <BookOpen className={`mr-2 h-5 w-5 ${activeTab === "subjects" ? "text-indigo-500" : "text-gray-400"}`} />
                Dersler
              </button>
              <button
                onClick={() => setActiveTab("education")}
                className={`py-4 px-6 inline-flex items-center ${
                  activeTab === "education"
                    ? "border-b-2 border-indigo-500 text-indigo-600 font-medium"
                    : "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300"
                }`}
              >
                <Layers className={`mr-2 h-5 w-5 ${activeTab === "education" ? "text-indigo-500" : "text-gray-400"}`} />
                Eğitim
              </button>
              <button
                onClick={() => setActiveTab("certifications")}
                className={`py-4 px-6 inline-flex items-center ${
                  activeTab === "certifications"
                    ? "border-b-2 border-indigo-500 text-indigo-600 font-medium"
                    : "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300"
                }`}
              >
                <Award className={`mr-2 h-5 w-5 ${activeTab === "certifications" ? "text-indigo-500" : "text-gray-400"}`} />
                Sertifikalar
              </button>
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "about" && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Hakkımda</h2>
                <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
              </div>
            )}
            
            {activeTab === "subjects" && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Verilen Dersler</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.subjects?.map((subject, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === "education" && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Eğitim Geçmişi</h2>
                <div className="space-y-6">
                  {profile.education?.map((edu) => (
                    <div key={edu.id} className="border-l-2 border-indigo-200 pl-4">
                      <h3 className="text-lg font-semibold text-gray-800">{edu.institution}</h3>
                      <p className="text-sm text-gray-600">
                        {edu.degree}, {edu.fieldOfStudy}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(edu.from)} - {formatDate(edu.to)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === "certifications" && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Sertifikalar</h2>
                <div className="space-y-4">
                  {profile.certifications?.map((cert) => (
                    <div key={cert.id} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="p-2 bg-green-50 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-green-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-md font-semibold text-gray-800">{cert.name}</h3>
                          <p className="text-sm text-gray-600">
                            {cert.issuedBy}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(cert.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TutorProfilePage() {
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