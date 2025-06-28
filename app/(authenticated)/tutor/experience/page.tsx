"use client";

import { PointsPageSkeleton } from "@/app/components/ui/PointsPageSkeleton";
import { HeaderSkeleton } from "@/app/components/ui/skeleton-shimmer";
import { useAuth } from "@/app/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Clock,
  Search
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// Types
type Student = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  points: number;
  experience: number;
};

interface ExperienceTransaction {
  id: string;
  amount: number;
  createdAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
}

type PointReason = {
  id: string;
  name: string;
  description?: string;
};

// Static Header Component
function ExperienceHeader() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-2xl"></div>
      <div className="relative p-8 text-center">
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
            Tecrübe Yönetimi
          </span>
        </h1>
        <p className="text-gray-600 text-lg">Öğrencilerinize tecrübe verin ve ilerlemeyi takip edin</p>
      </div>
    </div>
  );
}

// Loading state components
function StudentListSkeleton() {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-40" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-full" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-4 mt-4">
            {[...Array(5)].map((_, index) => (
              <div
                key={`student-skeleton-${index}`}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ExperienceFormSkeleton() {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-48" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-full" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionsListSkeleton() {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-40" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-full" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div
              key={`transaction-skeleton-${index}`}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-3 w-24 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingExperience() {
  return (
    <div className="space-y-8">
      <HeaderSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StudentListSkeleton />
        <div className="lg:col-span-2">
          <div className="space-y-6">
            <ExperienceFormSkeleton />
            <TransactionsListSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

// Dynamic Experience Management Component
function ExperienceManagement() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<ExperienceTransaction[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [experience, setExperience] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDecreasing, setIsDecreasing] = useState<boolean>(false);
  const [transactionSearchTerm, setTransactionSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const transactionsPerPage = 5;
  const [pointReasons, setPointReasons] = useState<PointReason[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState<string>("");

  // Add fetchData function outside useEffect so we can reuse it
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch students assigned to this tutor
      const studentsRes = await fetch("/api/tutor/students", {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const studentsData = await studentsRes.json();
      
      if (studentsData.students) {
        setStudents(studentsData.students.map((user: any) => ({
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          points: user.points || 0,
          experience: user.experience || 0
        })));
      } else if (studentsData.error) {
        console.error("Error from API:", studentsData.error);
        toast.error(`API Error: ${studentsData.error}`);
      }

      // Fetch recent experience transactions
      const transactionsRes = await fetch("/api/experience/transactions", {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const transactionsData = await transactionsRes.json();
      
      if (transactionsData.transactions) {
        setRecentTransactions(transactionsData.transactions);
      } else if (transactionsData.error) {
        console.error("Error from API:", transactionsData.error);
        toast.error(`API Error: ${transactionsData.error}`);
      }

      // Fetch point reasons
      const reasonsRes = await fetch("/api/tutor/point-reasons", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const reasonsData = await reasonsRes.json();

      if (reasonsData.reasons) {
        setPointReasons(reasonsData.reasons);
      } else if (reasonsData.error) {
        console.error("Error fetching point reasons:", reasonsData.error);
        // Don't show error toast for point reasons, just log it
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Veriler yüklenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  // Use fetchData in useEffect
  useEffect(() => {
    fetchData();
  }, []);

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (student.firstName && student.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.lastName && student.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle student selection
  const handleSelectStudent = (student: Student) => {
    setSelectedStudentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(student.id)) {
        newSet.delete(student.id);
      } else {
        newSet.add(student.id);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.size === 0 || !selectedReasonId) return;

    setIsSubmitting(true);

    try {
      for (const studentId of selectedStudentIds) {
        const response = await fetch(`/api/users/${studentId}/experience`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: isDecreasing ? -experience : experience,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update experience');
        }
      }

      // Refresh both transactions and students data
      await fetchData();

      const count = selectedStudentIds.size;
      toast.success(
        `${isDecreasing ? "Azaltıldı" : "Eklendi"} ${count} öğrenci${
          count > 1 ? "ye" : "ye"
        } ${experience} tecrübe ${isDecreasing ? "dan" : ""}`
      );

      // Reset form
      setExperience(0);
      setSelectedReasonId("");
      setSelectedStudentIds(new Set());
      setIsDecreasing(false);
    } catch (error) {
      console.error('Error updating experience:', error);
      toast.error('Tecrübe güncellenirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get display name
  const getDisplayName = (
    student:
      | {
          firstName?: string | null;
          lastName?: string | null;
          username: string;
        }
      | undefined
  ) => {
    if (!student) return "Unknown";
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    }
    return student.username;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter transactions based on search term
  const filteredTransactions = recentTransactions.filter((transaction) => {
    const searchLower = transactionSearchTerm.toLowerCase();
    const studentName = getDisplayName(transaction.student).toLowerCase();
    return studentName.includes(searchLower) || formatDate(transaction.createdAt).toLowerCase().includes(searchLower);
  });

  // Calculate pagination
  const totalPages = Math.ceil(
    filteredTransactions.length / transactionsPerPage
  );
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  if (isLoading) {
    return <PointsPageSkeleton />;
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Student List */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-emerald-50/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-emerald-700 text-xl">
                <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                  <Search className="h-5 w-5 text-emerald-600" />
                </div>
                Öğrenci Ara
              </CardTitle>
              <CardDescription className="text-gray-600">
                {isDecreasing ? "Tecrübe düşmek" : "Tecrübe vermek"} için öğrenci seçin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="relative group">
                  <Input
                    type="text"
                    placeholder="İsim veya kullanıcı adı ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-200 bg-white/80"
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-md ${
                        selectedStudentIds.has(student.id)
                          ? "bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 shadow-md"
                          : "hover:bg-gray-50 border-2 border-gray-100 hover:border-gray-200"
                      } border-2`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-1">
                            {student.firstName && student.lastName
                              ? `${student.firstName} ${student.lastName}`
                              : student.username}
                          </p>
                          {(student.firstName || student.lastName) && (
                            <p className="text-sm text-gray-500">
                              @{student.username}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className="bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200 px-3 py-1 font-medium"
                          >
                            {student.experience} XP
                          </Badge>
                          {selectedStudentIds.has(student.id) && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center shadow-lg">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Experience Management Form */}
        <div className="lg:col-span-2">
          <Card className={`border-0 shadow-xl backdrop-blur-sm transition-all duration-300 ${
            isDecreasing 
              ? "bg-gradient-to-br from-red-50 to-pink-50/50" 
              : "bg-gradient-to-br from-white to-emerald-50/30"
          }`}>
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold text-gray-800">
                {isDecreasing ? "Tecrübe Azaltma" : "Tecrübe Verme"}
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                {selectedStudentIds.size > 0 
                  ? `${selectedStudentIds.size} öğrenci seçildi` 
                  : "Öğrencilere tecrübe ekleyin veya çıkarın"
                }
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Value Input */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-gray-700">Tecrübe Miktarı</Label>
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        value={experience}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setExperience(value);
                        }}
                        className="w-32 text-lg font-bold text-center border-2 border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-200"
                      />
                    </div>
                    <div className="flex items-center space-x-3 bg-white/80 p-3 rounded-xl border border-gray-200">
                      <Switch
                        checked={isDecreasing}
                        onCheckedChange={setIsDecreasing}
                        className="data-[state=checked]:bg-red-500"
                      />
                      <Label className={`font-medium ${isDecreasing ? 'text-red-600' : 'text-emerald-600'}`}>
                        {isDecreasing ? "Tecrübe Azalt" : "Tecrübe Ekle"}
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Reason Input */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-700">Sebep Seçin</Label>
                  {pointReasons.length > 0 ? (
                    <RadioGroup
                      value={selectedReasonId}
                      onValueChange={setSelectedReasonId}
                      className="grid grid-cols-1 gap-3"
                    >
                      {pointReasons.map((pointReason) => (
                        <div key={pointReason.id} className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-200 cursor-pointer">
                          <RadioGroupItem value={pointReason.id} id={pointReason.id} className="text-emerald-600" />
                          <Label htmlFor={pointReason.id} className="font-medium text-gray-700 cursor-pointer flex-1">
                            {pointReason.name}
                            {pointReason.description && (
                              <p className="text-sm text-gray-500 mt-1">{pointReason.description}</p>
                            )}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="p-6 text-center bg-gray-50 rounded-xl border-2 border-gray-200">
                      <p className="text-gray-600 mb-2">Henüz tecrübe sebebi tanımlanmamış</p>
                      <p className="text-sm text-gray-500">Lütfen yöneticinizle iletişime geçin</p>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={
                    selectedStudentIds.size === 0 ||
                    isSubmitting ||
                    experience <= 0 ||
                    !selectedReasonId ||
                    pointReasons.length === 0
                  }
                  className={`w-full py-4 text-lg font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg ${
                    isDecreasing 
                      ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-red-200" 
                      : "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-emerald-200"
                  } text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>İşleniyor...</span>
                    </div>
                  ) : (
                    `${selectedStudentIds.size} öğrenciye ${experience} XP ${isDecreasing ? "azalt" : "ekle"}`
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions - Now full width */}
      <div className="mt-8">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-emerald-50/50 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-emerald-700 text-2xl">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Clock className="h-6 w-6 text-emerald-600" />
              </div>
              Son İşlemler
            </CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Öğrencilere verilen son tecrübelerin detaylı listesi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  className="pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-200 bg-white/80"
                  placeholder="İşlemlerde ara..."
                  value={transactionSearchTerm}
                  onChange={(e) => setTransactionSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-4">
                {currentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-xl border-2 border-gray-100 p-5 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-200 transform hover:scale-[1.01] shadow-sm hover:shadow-md"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-lg mb-2">
                        {getDisplayName(transaction.student)}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <div className="p-1 bg-gray-100 rounded-full">
                          <Clock className="h-3 w-3" />
                        </div>
                        <span className="font-medium">{formatDate(transaction.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <Badge
                        variant={transaction.amount >= 0 ? "default" : "destructive"}
                        className={`text-lg font-bold px-4 py-2 ${
                          transaction.amount >= 0
                            ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600" 
                            : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                        } text-white shadow-lg`}
                      >
                        {transaction.amount >= 0 ? "+" : ""}{transaction.amount} XP
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              {/* Pagination Controls */}
              <div className="flex justify-center items-center gap-4 mt-8 p-4 bg-gray-50/50 rounded-xl">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 disabled:opacity-50"
                >
                  ← Önceki
                </Button>
                <div className="flex items-center px-4 py-2 rounded-lg bg-white border-2 border-gray-200 font-semibold text-gray-700">
                  <span className="text-emerald-600">{currentPage}</span>
                  <span className="mx-2">/</span>
                  <span>{totalPages || 1}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-4 py-2 rounded-lg border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 disabled:opacity-50"
                >
                  Sonraki →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ExperiencePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="p-8 space-y-8">
        {loading ? (
          <LoadingExperience />
        ) : (
          <div className="space-y-8">
            <ExperienceHeader />
            <ExperienceManagement />
          </div>
        )}
      </div>
    </div>
  );
} 