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

type ExperienceTransaction = {
  id: string;
  student: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  amount: number;
  createdAt: string;
};

// Static Header Component
function ExperienceHeader() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
        <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Tecrübe Yönetimi
        </span>
      </h1>
    </div>
  );
}

// Dynamic Experience Management Component
function ExperienceManagement() {
  const { user } = useAuth();
  
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

  // Fetch students and recent transactions
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all students (admin has access to all students)
        const studentsRes = await fetch("/api/admin/students", {
          method: 'GET',
          credentials: 'same-origin',
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

        // Fetch recent experience transactions
        const transactionsRes = await fetch("/api/admin/experience/transactions", {
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
    if (!selectedStudentIds.size || !experience) return;

    setIsSubmitting(true);

    try {
      const newTransactions: ExperienceTransaction[] = [];

      for (const studentId of selectedStudentIds) {
        const response = await fetch(`/api/users/${studentId}/experience`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: isDecreasing ? -experience : experience,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update experience");
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

        // Update student experience in the local state
        setStudents((prev) =>
          prev.map((student) =>
            student.id === studentId
              ? { ...student, experience: student.experience + (isDecreasing ? -experience : experience) }
              : student
          )
        );
      }

      setRecentTransactions((prev) => [...newTransactions, ...prev]);

      const count = selectedStudentIds.size;
      toast.success(
        `${isDecreasing ? "Azaltıldı" : "Eklendi"} ${count} öğrenci${
          count > 1 ? "ye" : "ye"
        } ${experience} XP ${isDecreasing ? "den" : ""}`
      );

      // Reset form
      setExperience(0);
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
    return studentName.includes(searchLower);
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
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
              <CardTitle className="flex items-center text-green-700">
                <Search className="mr-2" />
                Öğrenci Ara
              </CardTitle>
              <CardDescription>
                {isDecreasing ? "Tecrübe düşmek" : "Tecrübe vermek"} için öğrenci
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
                          ? "bg-green-50 border-green-200"
                          : "hover:bg-gray-50"
                      } border ${
                        selectedStudentIds.has(student.id)
                          ? "border-green-200"
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
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {student.experience} XP
                          </Badge>
                          {selectedStudentIds.has(student.id) && (
                            <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center">
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

        {/* Right Column - Experience Management Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Tecrübe Yönetimi</CardTitle>
              <CardDescription>
                Öğrencilere tecrübe ekleyin veya çıkarın
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Value Input */}
                <div className="space-y-2">
                  <Label>Tecrübe Miktarı</Label>
                  <div className={`flex items-center space-x-4 p-4 rounded-lg transition-colors ${isDecreasing ? 'bg-red-50' : 'bg-green-50'}`}>
                    <Input
                      type="number"
                      id="experience"
                      value={experience}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setExperience(value);
                      }}
                      className={`w-32 ${isDecreasing ? 'border-red-200 focus:ring-red-500' : 'border-green-200 focus:ring-green-500'}`}
                    />
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={isDecreasing}
                        onCheckedChange={setIsDecreasing}
                        className={`${isDecreasing ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                      />
                      <Label className={`${isDecreasing ? 'text-red-700' : 'text-green-700'} font-medium`}>
                        {isDecreasing ? 'Azalt' : 'Ekle'}
                      </Label>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={
                    selectedStudentIds.size === 0 ||
                    isSubmitting ||
                    experience <= 0
                  }
                  className={`w-full text-white ${
                    isDecreasing 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isSubmitting ? (
                    "İşleniyor..."
                  ) : (
                    `${selectedStudentIds.size} öğrenciye ${isDecreasing ? 'Azalt' : 'Ekle'}`
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Son İşlemler</CardTitle>
          <CardDescription>Öğrencilere verilen son tecrübe puanları</CardDescription>
          <div className="mt-4">
            <Input
              type="text"
              placeholder="İşlem ara..."
              value={transactionSearchTerm}
              onChange={(e) => setTransactionSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {getDisplayName(transaction.student)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(transaction.createdAt)}
                  </p>
                </div>
                <Badge
                  variant={transaction.amount >= 0 ? "default" : "destructive"}
                  className={`ml-auto ${
                    transaction.amount >= 0 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {transaction.amount >= 0 ? '+' : ''}{transaction.amount} XP
                </Badge>
              </div>
            ))}
            {currentTransactions.length === 0 && (
              <p className="text-center text-gray-500">
                {transactionSearchTerm ? 'Arama kriterlerine uygun işlem bulunamadı' : 'Henüz işlem yapılmamış'}
              </p>
            )}

            {/* Pagination Controls */}
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
  );
}

export default function ExperiencePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <ExperienceHeader />
      <ExperienceManagement />
    </div>
  );
} 