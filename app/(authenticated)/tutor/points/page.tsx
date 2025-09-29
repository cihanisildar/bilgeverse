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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Award,
  Clock,
  Search,
  ArrowLeft,
  User,
  UserCheck,
  MinusCircle,
  PlusCircle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Types
type Student = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  points: number;
  experience: number;
};

type Transaction = {
  id: string;
  student: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  tutor: {
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

type PointReason = {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
};

// Static Header Component
function PointsHeader() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-2xl"></div>
      <div className="relative p-8 text-center">
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
            Puan Yönetimi
          </span>
        </h1>
        <p className="text-gray-600 text-lg">Öğrencilerinize puan verin ve ilerlemeyi takip edin</p>
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

function PointsFormSkeleton() {
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

function LoadingPoints() {
  return (
    <div className="space-y-8">
      <HeaderSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StudentListSkeleton />
        <div className="lg:col-span-2">
          <div className="space-y-6">
            <PointsFormSkeleton />
            <TransactionsListSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

// Dynamic Points Management Component
function PointsManagement() {
  const { user } = useAuth();
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set()
  );
  const [points, setPoints] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDecreasing, setIsDecreasing] = useState<boolean>(false);
  const [transactionSearchTerm, setTransactionSearchTerm] =
    useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const transactionsPerPage = 5;
  const [pointReasons, setPointReasons] = useState<PointReason[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState<string>("");
  const [reasonSearchTerm, setReasonSearchTerm] = useState<string>("");
  const [reasonCurrentPage, setReasonCurrentPage] = useState<number>(1);
  const reasonsPerPage = 5;

  // Add color theme based on mode
  const getThemeColors = () => {
    return isDecreasing
      ? {
          primary: "bg-red-600 hover:bg-red-700",
          secondary: "bg-red-100 text-red-800",
          border: "border-red-200",
          highlight: "bg-red-50 text-red-700",
          accent: "text-red-700",
        }
      : {
          primary: "bg-emerald-600 hover:bg-emerald-700",
          secondary: "bg-emerald-100 text-emerald-800",
          border: "border-emerald-200",
          highlight: "bg-emerald-50 text-emerald-700",
          accent: "text-emerald-700",
        };
  };

  // Debug current auth state
  useEffect(() => {
    console.log("Current auth state:", { user });
  }, [user]);

  // Fetch students, recent transactions, and point reasons
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch students assigned to this tutor
        console.log("Fetching students...");
        const studentsRes = await fetch("/api/tutor/students", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("Students response status:", studentsRes.status);
        const studentsData = await studentsRes.json();
        console.log("Students data:", studentsData);

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
          // Ensure each transaction has complete student and tutor data
          const transactions = transactionsData.transactions.map(
            (transaction: Transaction) => {
              // If student data is missing or incomplete, create a default student object
              const student = transaction.student || {};
              if (!student.username) {
                console.error("Transaction missing student data:", transaction);
                return {
                  ...transaction,
                  student: {
                    id: student.id || "unknown",
                    username: student.username || "test123",
                    firstName: student.firstName || null,
                    lastName: student.lastName || null,
                  },
                };
              }

              // If tutor data is missing or incomplete, create a default tutor object
              const tutor = transaction.tutor || {};
              if (!tutor.username) {
                console.error("Transaction missing tutor data:", transaction);
                return {
                  ...transaction,
                  tutor: {
                    id: tutor.id || "unknown",
                    username: tutor.username || "Bilinmeyen",
                    firstName: tutor.firstName || null,
                    lastName: tutor.lastName || null,
                  },
                };
              }

              return transaction;
            }
          );
          setRecentTransactions(transactions.slice(0, 10));
        }

        // Fetch point reasons
        console.log("Fetching point reasons...");
        const reasonsRes = await fetch("/api/tutor/point-reasons", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        });
        console.log("Point reasons response status:", reasonsRes.status);
        const reasonsData = await reasonsRes.json();
        console.log("Point reasons data:", reasonsData);

        if (reasonsData.reasons && Array.isArray(reasonsData.reasons)) {
          setPointReasons(reasonsData.reasons);
        } else if (reasonsData.error) {
          console.error("Error fetching point reasons:", reasonsData.error);
          toast.error(`Puan sebepleri yüklenirken hata oluştu: ${reasonsData.error}`);
          setPointReasons([]); // Ensure it's always an array
        } else {
          // If no reasons or reasons is not an array, set empty array
          setPointReasons([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Veriler yüklenirken bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter students based on search term
  const filteredStudents = students.filter(
    (student) =>
      student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.firstName &&
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.lastName &&
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle student selection
  const handleSelectStudent = (student: Student) => {
    setSelectedStudentIds((prev) => {
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
      // Process each selected student
      const updatedStudents = [...students]; // Create a copy of students array
      const newTransactions: Transaction[] = []; // Collect all new transactions with proper typing

      for (const studentId of selectedStudentIds) {
        const selectedStudent = students.find((s) => s.id === studentId);
        if (!selectedStudent) continue;

        // Handle points modification
        const selectedReason = pointReasons.find(r => r.id === selectedReasonId);
        const finalReason = selectedReason?.name || "";
        
        const response = await fetch(`/api/points`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId: studentId,
            points: isDecreasing ? -points : points,
            reason: finalReason,
            pointReasonId: selectedReasonId,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to modify points for ${selectedStudent.username}`
          );
        }

        const data = await response.json();

        // Update the student in our copy of the array
        const studentIndex = updatedStudents.findIndex(
          (s) => s.id === studentId
        );
        if (studentIndex !== -1) {
          updatedStudents[studentIndex] = {
            ...updatedStudents[studentIndex],
            points: data.newBalance,
          };
        }

        // Add transaction to our collection
        if (data.transaction) {
          // Ensure the new transaction has complete student information
          const transactionWithStudent = {
            ...data.transaction,
            student: {
              ...data.transaction.student,
              ...selectedStudent, // Include complete student info from our students array
            },
          };
          newTransactions.push(transactionWithStudent);
        }
      }

      // Update all state at once
      setStudents(updatedStudents);
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
                            {student.points} puan
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

        {/* Right Column - Points Management Form */}
        <div className="lg:col-span-2">
          <Card className={`border-0 shadow-xl backdrop-blur-sm transition-all duration-300 ${
            isDecreasing 
              ? "bg-gradient-to-br from-red-50 to-pink-50/50" 
              : "bg-gradient-to-br from-white to-emerald-50/30"
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
                        {isDecreasing ? "Puan Azalt" : "Puan Ekle"}
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Reason Input */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-700">Sebep Seçin</Label>
                  <div className="relative group mb-4">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-500 transition-colors" />
                    <Input
                      className="pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-200 bg-white/80"
                      placeholder="Sebeplerde ara..."
                      value={reasonSearchTerm}
                      onChange={(e) => {
                        setReasonSearchTerm(e.target.value);
                        setReasonCurrentPage(1); // Reset to first page when searching
                      }}
                    />
                  </div>
                  {pointReasons && Array.isArray(pointReasons) && pointReasons.length > 0 ? (
                    <>
                      <RadioGroup
                        value={selectedReasonId}
                        onValueChange={setSelectedReasonId}
                        className="grid grid-cols-1 gap-3"
                      >
                        {pointReasons
                          .filter(reason => 
                            reason.name.toLowerCase().includes(reasonSearchTerm.toLowerCase()) ||
                            (reason.description && reason.description.toLowerCase().includes(reasonSearchTerm.toLowerCase()))
                          )
                          .slice((reasonCurrentPage - 1) * reasonsPerPage, reasonCurrentPage * reasonsPerPage)
                          .map((pointReason) => (
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
                      
                      {/* Point Reasons Pagination Controls */}
                      <div className="flex justify-center items-center gap-4 mt-6 p-4 bg-gray-50/50 rounded-xl">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReasonCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={reasonCurrentPage === 1}
                          className="px-4 py-2 rounded-lg border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 disabled:opacity-50"
                        >
                          ← Önceki
                        </Button>
                        <div className="flex items-center px-4 py-2 rounded-lg bg-white border-2 border-gray-200 font-semibold text-gray-700">
                          <span className="text-emerald-600">{reasonCurrentPage}</span>
                          <span className="mx-2">/</span>
                          <span>{Math.ceil(pointReasons.filter(reason => 
                            reason.name.toLowerCase().includes(reasonSearchTerm.toLowerCase()) ||
                            (reason.description && reason.description.toLowerCase().includes(reasonSearchTerm.toLowerCase()))
                          ).length / reasonsPerPage) || 1}</span>
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
                          className="px-4 py-2 rounded-lg border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 disabled:opacity-50"
                        >
                          Sonraki →
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center bg-gray-50 rounded-xl border-2 border-gray-200">
                      <p className="text-gray-600 mb-2">Henüz puan sebebi tanımlanmamış</p>
                      <p className="text-sm text-gray-500">Lütfen yöneticinizle iletişime geçin</p>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={
                    selectedStudentIds.size === 0 ||
                    isSubmitting ||
                    points <= 0 ||
                    !selectedReasonId ||
                    !pointReasons || !Array.isArray(pointReasons) || pointReasons.length === 0
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
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-emerald-50/50 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-emerald-700 text-2xl">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Clock className="h-6 w-6 text-emerald-600" />
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
                      <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <p className="text-sm font-medium text-gray-700">
                          {transaction.reason}
                        </p>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Puan veren: {transaction.tutor?.firstName || transaction.tutor?.username || "Bilinmeyen"}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <Badge
                        variant={transaction.type === "AWARD" ? "default" : "destructive"}
                        className={`text-lg font-bold px-4 py-2 ${
                          transaction.type === "AWARD" 
                            ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600" 
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

export default function PointsPage() {
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
          <LoadingPoints />
        ) : (
          <div className="space-y-8">
            <PointsHeader />
            <PointsManagement />
          </div>
        )}
      </div>
    </div>
  );
}
