"use client";

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
import { Switch } from "@/components/ui/switch";
import { Search, Clock, Plus } from "lucide-react";
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





type PointReason = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
};

type PointTransaction = {
  id: string;
  student: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  points: number;
  type: string;
  reason: string;
  createdAt: string;
};

// Static Header Component
function PointsHeader() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl"></div>
      <div className="relative p-8 text-center">
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
            Puan Yönetimi
          </span>
        </h1>
        <p className="text-gray-600 text-lg">Öğrencilere puan ekleyin ve puan geçmişini yönetin</p>
      </div>
    </div>
  );
}

// Dynamic Points Management Component
function PointsManagement() {
  const { user } = useAuth();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<PointTransaction[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [points, setPoints] = useState<number>(0);
  const [selectedReasonId, setSelectedReasonId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDecreasing, setIsDecreasing] = useState<boolean>(false);
  const [transactionSearchTerm, setTransactionSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pointReasons, setPointReasons] = useState<PointReason[]>([]);
  const [reasonSearchTerm, setReasonSearchTerm] = useState<string>("");
  const [reasonCurrentPage, setReasonCurrentPage] = useState<number>(1);
  const reasonsPerPage = 4;
  const transactionsPerPage = 5;

  // Fetch students, recent transactions, and point reasons
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all students (admin has access to all students)
        const studentsRes = await fetch("/api/admin/students", {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const studentsData = await studentsRes.json();
        
        if (studentsData.students) {
          setStudents(
            studentsData.students.map((user: any) => ({
              id: user.id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              points: user.points || 0,
              experience: user.experience || 0,
            }))
          );
        } else if (studentsData.error) {
          console.error("Error from API:", studentsData.error);
          toast.error(`API Hatası: ${studentsData.error}`);
        }

        // Fetch recent transactions
        const transactionsRes = await fetch("/api/points", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const transactionsData = await transactionsRes.json();

        if (transactionsData.transactions) {
          setRecentTransactions(transactionsData.transactions);
        }

        // Fetch point reasons
        const reasonsRes = await fetch("/api/admin/point-reasons", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const reasonsData = await reasonsRes.json();

        if (reasonsData.reasons) {
          // Only show active reasons
          const activeReasons = reasonsData.reasons.filter((reason: any) => reason.isActive);
          setPointReasons(activeReasons);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Veriler yüklenirken bir hata oluştu");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter students based on search term
  const filteredStudents = students.filter((student) =>
    student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.firstName && student.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.lastName && student.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!selectedStudentIds.size || !points) return;
    if (!isDecreasing && !selectedReasonId) return;

    setIsSubmitting(true);

    try {
      const newTransactions: PointTransaction[] = [];

      for (const studentId of selectedStudentIds) {
        let finalReason = "";
        
        if (isDecreasing) {
          finalReason = "Admin tarafından puan azaltıldı";
        } else {
          const selectedReason = pointReasons.find(r => r.id === selectedReasonId);
          finalReason = selectedReason?.name || "";
        }

        const response = await fetch("/api/points", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId: studentId,
            points: isDecreasing ? -points : points,
            reason: finalReason,
            pointReasonId: selectedReasonId
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update points");
        }

        const data = await response.json();
        
        // Find the student in our local state to get their details
        const student = students.find(s => s.id === studentId);
        
        // Create a complete transaction object with student details
        const completeTransaction = {
          ...data.transaction,
          student: {
            id: student?.id || '',
            username: student?.username || '',
            firstName: student?.firstName || null,
            lastName: student?.lastName || null
          }
        };
        
        newTransactions.push(completeTransaction);

        // Update student points in the local state
        setStudents((prev) =>
          prev.map((student) =>
            student.id === studentId
              ? { ...student, points: data.newBalance || student.points }
              : student
          )
        );
      }

      setRecentTransactions((prev) => [...newTransactions, ...prev]);

      const count = selectedStudentIds.size;
      toast.success(
        `${isDecreasing ? "Azaltıldı" : "Eklendi"} ${count} öğrenci${
          count > 1 ? "ye" : "ye"
        } ${points} puan ${isDecreasing ? "dan" : ""}`
      );

      // Reset form
      setPoints(0);
      setSelectedReasonId("");
      setSelectedStudentIds(new Set());
      setIsDecreasing(false);
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("İşlem başarısız oldu");
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
    const reason = transaction.reason.toLowerCase();
    return studentName.includes(searchLower) || reason.includes(searchLower);
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="p-8 space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl animate-pulse"></div>
            <div className="relative p-8 text-center">
              <div className="h-10 bg-gray-300 rounded-lg w-64 mx-auto mb-4 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded-lg w-96 mx-auto animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
                <div className="h-12 bg-gray-200 rounded-xl mb-6"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-6 animate-pulse">
                <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
                <div className="space-y-6">
                  <div className="h-16 bg-gray-100 rounded-xl"></div>
                  <div className="h-32 bg-gray-100 rounded-xl"></div>
                  <div className="h-14 bg-blue-200 rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Student List */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-blue-700 text-xl">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <Search className="h-5 w-5 text-blue-600" />
                </div>
                Öğrenci Ara
              </CardTitle>
              <CardDescription className="text-gray-600">
                {isDecreasing ? "Puan düşmek" : "Puan vermek"} için öğrenci seçin
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
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white/80"
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => {
                        const newSet = new Set(selectedStudentIds);
                        if (newSet.has(student.id)) {
                          newSet.delete(student.id);
                        } else {
                          newSet.add(student.id);
                        }
                        setSelectedStudentIds(newSet);
                      }}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-md ${
                        selectedStudentIds.has(student.id)
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 shadow-md"
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
                          <p className="text-sm text-gray-500">
                            @{student.username}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant="outline" 
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 px-3 py-1 font-medium"
                          >
                            {student.points} puan
                          </Badge>
                          {selectedStudentIds.has(student.id) && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
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

        {/* Right Column - Points Management Form */}
        <div className="lg:col-span-2">
          <Card className={`border-0 shadow-xl backdrop-blur-sm transition-all duration-300 ${
            isDecreasing 
              ? "bg-gradient-to-br from-red-50 to-pink-50/50" 
              : "bg-gradient-to-br from-white to-blue-50/30"
          }`}>
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold text-gray-800">
                {isDecreasing ? "Puan Azaltma" : "Puan Verme"}
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                {selectedStudentIds.size > 0 
                  ? `${selectedStudentIds.size} öğrenci seçildi` 
                  : "Öğrencilere puan ekleyin veya çıkarın"
                }
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Value Input */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-gray-700">Puan Miktarı</Label>
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        value={points}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setPoints(value);
                        }}
                        className="w-32 text-lg font-bold text-center border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                      />
                    </div>
                    <div className="flex items-center space-x-3 bg-white/80 p-3 rounded-xl border border-gray-200">
                      <Switch
                        checked={isDecreasing}
                        onCheckedChange={setIsDecreasing}
                        className="data-[state=checked]:bg-red-500"
                      />
                      <Label className={`font-medium ${isDecreasing ? 'text-red-600' : 'text-green-600'}`}>
                        {isDecreasing ? "Puan Azalt" : "Puan Ekle"}
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Reason Selection - Only show when not decreasing */}
                {!isDecreasing && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold text-gray-700">Puan Verme Sebebi</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = '/admin/point-reasons'}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300 px-3 py-1 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Sebep Yönetimi
                      </Button>
                    </div>
                    
                    {/* Search Bar for Point Reasons */}
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                      <Input
                        className="pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white/80"
                        placeholder="Sebeplerde ara..."
                        value={reasonSearchTerm}
                        onChange={(e) => {
                          setReasonSearchTerm(e.target.value);
                          setReasonCurrentPage(1); // Reset to first page when searching
                        }}
                      />
                    </div>

                    {/* Predefined Reasons */}
                    {pointReasons.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-600">Hazır Sebepler</Label>
                        <div className="grid grid-cols-1 gap-2">
                          {pointReasons
                            .filter(reason => 
                              reason.name.toLowerCase().includes(reasonSearchTerm.toLowerCase()) ||
                              (reason.description && reason.description.toLowerCase().includes(reasonSearchTerm.toLowerCase()))
                            )
                            .slice(
                              (reasonCurrentPage - 1) * reasonsPerPage,
                              reasonCurrentPage * reasonsPerPage
                            )
                            .map((reason) => (
                              <button
                                key={reason.id}
                                type="button"
                                onClick={() => {
                                  setSelectedReasonId(reason.id);
                                }}
                                className={`w-full text-left p-4 rounded-xl transition-all duration-200 border-2 ${
                                  selectedReasonId === reason.id
                                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-md"
                                    : "hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900 mb-1">{reason.name}</p>
                                    {reason.description && (
                                      <p className="text-sm text-gray-600">{reason.description}</p>
                                    )}
                                  </div>
                                  {selectedReasonId === reason.id && (
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                        </div>

                        {/* Pagination Controls for Point Reasons */}
                        {pointReasons.filter(reason => 
                          reason.name.toLowerCase().includes(reasonSearchTerm.toLowerCase()) ||
                          (reason.description && reason.description.toLowerCase().includes(reasonSearchTerm.toLowerCase()))
                        ).length > reasonsPerPage && (
                          <div className="flex justify-center items-center gap-4 mt-4 p-3 bg-gray-50/50 rounded-xl">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReasonCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={reasonCurrentPage === 1}
                              className="px-3 py-1 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50"
                            >
                              ← Önceki
                            </Button>
                            <div className="flex items-center px-3 py-1 rounded-lg bg-white border-2 border-gray-200 font-semibold text-gray-700">
                              <span className="text-blue-600">{reasonCurrentPage}</span>
                              <span className="mx-2">/</span>
                              <span>{Math.ceil(pointReasons.filter(reason => 
                                reason.name.toLowerCase().includes(reasonSearchTerm.toLowerCase()) ||
                                (reason.description && reason.description.toLowerCase().includes(reasonSearchTerm.toLowerCase()))
                              ).length / reasonsPerPage)}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReasonCurrentPage(prev => 
                                Math.min(Math.ceil(pointReasons.filter(reason => 
                                  reason.name.toLowerCase().includes(reasonSearchTerm.toLowerCase()) ||
                                  (reason.description && reason.description.toLowerCase().includes(reasonSearchTerm.toLowerCase()))
                                ).length / reasonsPerPage), prev + 1)
                              )}
                              disabled={reasonCurrentPage === Math.ceil(pointReasons.filter(reason => 
                                reason.name.toLowerCase().includes(reasonSearchTerm.toLowerCase()) ||
                                (reason.description && reason.description.toLowerCase().includes(reasonSearchTerm.toLowerCase()))
                              ).length / reasonsPerPage)}
                              className="px-3 py-1 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50"
                            >
                              Sonraki →
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    selectedStudentIds.size === 0 ||
                    isSubmitting ||
                    points <= 0 ||
                    (!isDecreasing && !selectedReasonId)
                  }
                  className={`w-full py-4 text-lg font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg ${
                    isDecreasing 
                      ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-red-200" 
                      : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-blue-200"
                  } text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>İşleniyor...</span>
                    </div>
                  ) : (
                    `${selectedStudentIds.size} öğrenciye ${points} puan ${isDecreasing ? "azalt" : "ekle"}`
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions - Now full width */}
      <div className="mt-8">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-blue-700 text-2xl">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              Son İşlemler
            </CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Öğrencilere verilen son puanların detaylı listesi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  className="pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white/80"
                  placeholder="İşlemlerde ara..."
                  value={transactionSearchTerm}
                  onChange={(e) => setTransactionSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-4">
                {currentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-xl border-2 border-gray-100 p-5 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200 transform hover:scale-[1.01] shadow-sm hover:shadow-md"
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
                      <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <p className="text-sm font-medium text-gray-700">
                          {transaction.reason}
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <Badge
                        variant={transaction.type === "AWARD" ? "default" : "destructive"}
                        className={`text-lg font-bold px-4 py-2 ${
                          transaction.type === "AWARD" 
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600" 
                            : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                        } text-white shadow-lg`}
                      >
                        {transaction.type === "AWARD" ? "+" : "-"}{transaction.points} puan
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
                  className="px-4 py-2 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50"
                >
                  ← Önceki
                </Button>
                <div className="flex items-center px-4 py-2 rounded-lg bg-white border-2 border-gray-200 font-semibold text-gray-700">
                  <span className="text-blue-600">{currentPage}</span>
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
                  className="px-4 py-2 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50"
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

export default function PointsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-8 space-y-8">
        <PointsHeader />
        <PointsManagement />
      </div>
    </div>
  );
} 