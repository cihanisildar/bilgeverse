"use client";

import { StudentListSkeleton } from "@/app/components/ui/StudentListSkeleton";
import { HeaderSkeleton } from "@/app/components/ui/skeleton-shimmer";
import { useAuth } from "@/app/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUpDown,
  CheckCircle,
  Filter,
  GraduationCap,
  GripHorizontal,
  Plus,
  Search,
  Trophy
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Student = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  points: number;
};

type PaginationInfo = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// Static Header Component
function StudentsHeader() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <GraduationCap className="mr-2 h-8 w-8 text-blue-600" />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Öğrencilerim
          </span>
        </h1>
        <p className="text-gray-500 mt-1">
          Öğrencilerinizi yönetin, puanlarını görüntüleyin ve ilerleme durumlarını takip edin.
        </p>
      </div>
      <div className="mt-4 sm:mt-0 flex gap-2">
        <Link href="/tutor/students/new">
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <Plus className="h-4 w-4 mr-1" />
            <span>Öğrenci Ekle</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Static Filter Component
function StudentsFilter({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  activeTab,
  setActiveTab,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: "points" | "name";
  setSortBy: (sort: "points" | "name") => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (order: "asc" | "desc") => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Öğrenci ara..."
            className="pl-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-1"
            onClick={() => setSortBy(sortBy === "points" ? "name" : "points")}
          >
            <GripHorizontal className="h-4 w-4" />
            <span>{sortBy === "points" ? "Puana Göre" : "İsme Göre"}</span>
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-1"
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          >
            <ArrowUpDown className="h-4 w-4" />
            <span>{sortOrder === "desc" ? "Azalan" : "Artan"}</span>
          </Button>

          <Button variant="outline" className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            <span>Filtrele</span>
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="all">Tüm Öğrenciler</TabsTrigger>
            <TabsTrigger value="active">Aktif</TabsTrigger>
            <TabsTrigger value="inactive">İnaktif</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}

// Loading state components
function StudentsFilterSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      <div className="mt-4">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

function StudentCardSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingStudents() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[...Array(6)].map((_, index) => (
        <StudentCardSkeleton key={`student-skeleton-${index}`} />
      ))}
    </div>
  );
}

// Dynamic Students List Component
function StudentsList() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"points" | "name">("points");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activeTab, setActiveTab] = useState("all");
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [students, searchQuery, sortBy, sortOrder, activeTab]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tutor/students`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch students');
      }
      
      const data = await response.json();
      setStudents(data.students || []);
      setPagination({
        total: data.total || 0,
        page: data.page || 1,
        limit: data.limit || 10,
        totalPages: data.totalPages || 0
      });
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setError(err.message || 'Öğrenci bilgilerini yüklerken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...students];
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(student => 
        student.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.firstName && student.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (student.lastName && student.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply tab filter (future implementation for active/inactive students)
    if (activeTab === 'active') {
      // Filter for active students (if we had such status)
      // result = result.filter(student => student.status === 'active');
    } else if (activeTab === 'inactive') {
      // Filter for inactive students
      // result = result.filter(student => student.status === 'inactive');
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'points') {
        return sortOrder === 'asc' ? a.points - b.points : b.points - a.points;
      } else {
        // Sort by name
        const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.username;
        const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim() || b.username;
        return sortOrder === 'asc'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }
    });
    
    setFilteredStudents(result);
  };

  const getFullName = (student: Student) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    } else if (student.firstName) {
      return student.firstName;
    } else if (student.lastName) {
      return student.lastName;
    } else {
      return student.username;
    }
  };

  const getInitials = (student: Student) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
    } else if (student.firstName) {
      return student.firstName[0].toUpperCase();
    } else if (student.lastName) {
      return student.lastName[0].toUpperCase();
    } else {
      return student.username[0].toUpperCase();
    }
  };

  if (loading) {
    return <StudentListSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StudentsFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-gray-700">Toplam Öğrenci</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-blue-600 mr-3" />
              <span className="text-3xl font-bold text-gray-800">{students.length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-green-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-gray-700">Ortalama Puan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-green-600 mr-3" />
              <span className="text-3xl font-bold text-gray-800">
                {students.length ? Math.round(students.reduce((acc, student) => acc + student.points, 0) / students.length) : 0}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-gray-700">En Yüksek Puan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-600 mr-3" />
              <span className="text-3xl font-bold text-gray-800">
                {students.length ? Math.max(...students.map(s => s.points)) : 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {filteredStudents.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredStudents.map((student) => (
              <div key={student.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-4 border border-blue-100">
                      <AvatarFallback className="bg-blue-50 text-blue-600">
                        {getInitials(student)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-800 mb-0.5">{getFullName(student)}</div>
                      <div className="text-sm text-gray-500">{student.username}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Puan</div>
                      <div className="font-bold text-2xl text-gray-800">{student.points}</div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link href={`/tutor/students/${student.id}`}>
                        <Button variant="outline" size="sm" className="border-blue-100 text-blue-600 hover:bg-blue-50">
                          Detaylar
                        </Button>
                      </Link>
                      <Link href={`/tutor/points/award?studentId=${student.id}`}>
                        <Button size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                          Puan Ver
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto rounded-full bg-blue-50 w-16 h-16 flex items-center justify-center mb-4">
              <GraduationCap className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">Öğrenci Bulunamadı</h3>
            <p className="text-gray-500 mb-4">Arama kriterlerinize uygun öğrenci bulunamadı.</p>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Tüm Öğrencileri Göster
            </Button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredStudents.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Toplam <span className="font-medium">{filteredStudents.length}</span> öğrenci gösteriliyor
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              disabled={pagination.page <= 1}
              onClick={() => {
                if (pagination.page > 1) {
                  //setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                  //fetchStudents();
                }
              }}
            >
              Önceki
            </Button>
            <Button 
              variant="outline"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => {
                if (pagination.page < pagination.totalPages) {
                  //setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                  //fetchStudents();
                }
              }}
            >
              Sonraki
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TutorStudentsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <div className="space-y-8">
          <HeaderSkeleton />
          <StudentsFilterSkeleton />
          <LoadingStudents />
        </div>
      ) : (
        <div className="space-y-8">
          <StudentsHeader />
          <StudentsList />
        </div>
      )}
    </div>
  );
} 