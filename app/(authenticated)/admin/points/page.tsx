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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Search, Clock } from "lucide-react";
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

type PointTransaction = {
  id: string;
  student: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  points: number;
  reason: string;
  createdAt: string;
};

// Static Header Component
function PointsHeader() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
        <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
          Puan Yönetimi
        </span>
      </h1>
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
  const [reason, setReason] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDecreasing, setIsDecreasing] = useState<boolean>(false);
  const [transactionSearchTerm, setTransactionSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const transactionsPerPage = 5;

  // Fetch students and recent transactions
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
    if (!selectedStudentIds.size || !points || (!isDecreasing && !reason.trim())) return;

    setIsSubmitting(true);

    try {
      const newTransactions: PointTransaction[] = [];

      for (const studentId of selectedStudentIds) {
        const response = await fetch(`/api/users/${studentId}/points`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            points: points,
            reason: isDecreasing ? "Points subtracted by admin" : reason,
            action: isDecreasing ? 'subtract' : 'add'
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
          points: isDecreasing ? -points : points,
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
              ? { ...student, points: student.points + (isDecreasing ? -points : points) }
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
      setReason("");
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Student List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700">
                <Search className="mr-2" />
                Öğrenci Ara
              </CardTitle>
              <CardDescription>
                {isDecreasing ? "Puan düşmek" : "Puan vermek"} için öğrenci
                seçin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="İsim veya kullanıcı adı ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
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
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedStudentIds.has(student.id)
                          ? "bg-blue-50 border-blue-200"
                          : "hover:bg-gray-50"
                      } border ${
                        selectedStudentIds.has(student.id)
                          ? "border-blue-200"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.firstName && student.lastName
                              ? `${student.firstName} ${student.lastName}`
                              : student.username}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{student.username}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {student.points} puan
                          </Badge>
                          {selectedStudentIds.has(student.id) && (
                            <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                              <svg
                                className="w-3 h-3 text-white"
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
          <Card>
            <CardHeader>
              <CardTitle>Puan Yönetimi</CardTitle>
              <CardDescription>
                Öğrencilere puan ekleyin veya çıkarın
              </CardDescription>
            </CardHeader>

            <CardContent className={isDecreasing ? "bg-red-50" : ""}>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Value Input */}
                <div className="space-y-2">
                  <Label>Puan Miktarı</Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      type="number"
                      min="0"
                      value={points}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setPoints(value);
                      }}
                      className="w-32"
                    />
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={isDecreasing}
                        onCheckedChange={setIsDecreasing}
                      />
                      <Label>{isDecreasing ? "Azalt" : "Ekle"}</Label>
                    </div>
                  </div>
                </div>

                {/* Reason Input - Only show when not decreasing */}
                {!isDecreasing && (
                  <div className="space-y-2">
                    <Label>Sebep</Label>
                    <RadioGroup
                      value={reason}
                      onValueChange={setReason}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Karakter Eğitimi" id="karakter" />
                        <Label htmlFor="karakter">Karakter Eğitimi</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Atölye Faaliyeti" id="atolye" />
                        <Label htmlFor="atolye">Atölye Faaliyeti</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    selectedStudentIds.size === 0 ||
                    isSubmitting ||
                    points <= 0 ||
                    (!isDecreasing && !reason.trim())
                  }
                  className={`w-full ${
                    isDecreasing 
                      ? "bg-red-600 hover:bg-red-700" 
                      : "bg-blue-600 hover:bg-blue-700"
                  } text-white`}
                >
                  {isSubmitting
                    ? "İşleniyor..."
                    : `${selectedStudentIds.size} öğrenciye ${
                        isDecreasing ? "Azalt" : "Ekle"
                      }`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions - Now full width */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Clock className="h-5 w-5" />
              Son İşlemler
            </CardTitle>
            <CardDescription>
              Öğrencilere verilen son puanların listesi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  className="pl-9"
                  placeholder="İşlemlerde ara..."
                  value={transactionSearchTerm}
                  onChange={(e) => setTransactionSearchTerm(e.target.value)}
                />
              </div>
              {currentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">
                      {getDisplayName(transaction.student)}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {formatDate(transaction.createdAt)}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {transaction.reason}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        transaction.points > 0 ? "default" : "destructive"
                      }
                    >
                      {transaction.points > 0 ? "+" : ""}
                      {transaction.points} puan
                    </Badge>
                  </div>
                </div>
              ))}
              {/* Pagination Controls */}
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Önceki
                </Button>
                <span className="flex items-center px-3 py-1 rounded-md bg-gray-100">
                  {currentPage} / {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Sonraki
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
    <div className="container mx-auto py-6 space-y-6">
      <PointsHeader />
      <PointsManagement />
    </div>
  );
} 