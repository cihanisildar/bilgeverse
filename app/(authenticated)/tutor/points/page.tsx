"use client";

import { PointsPageSkeleton } from "@/app/components/ui/PointsPageSkeleton";
import { HeaderSkeleton } from "@/app/components/ui/skeleton-shimmer";
import { useAuth } from "@/app/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AlertCircle, Award, Clock, Search, ArrowLeft, User, UserCheck, MinusCircle, PlusCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

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
  points: number;
  type: string;
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
              <div key={`student-skeleton-${index}`} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
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
            <div key={`transaction-skeleton-${index}`} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
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
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
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

  // Add color theme based on mode
  const getThemeColors = () => {
    return isDecreasing ? {
      primary: 'bg-red-600 hover:bg-red-700',
      secondary: 'bg-red-100 text-red-800',
      border: 'border-red-200',
      highlight: 'bg-red-50 text-red-700',
      accent: 'text-red-700'
    } : {
      primary: 'bg-emerald-600 hover:bg-emerald-700',
      secondary: 'bg-emerald-100 text-emerald-800',
      border: 'border-emerald-200',
      highlight: 'bg-emerald-50 text-emerald-700',
      accent: 'text-emerald-700'
    };
  };

  // Debug current auth state
  useEffect(() => {
    console.log("Current auth state:", { user });
  }, [user]);

  // Fetch students and recent transactions
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch students assigned to this tutor
        console.log("Fetching students...");
        const studentsRes = await fetch("/api/tutor/students", {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        console.log("Students response status:", studentsRes.status);
        const studentsData = await studentsRes.json();
        console.log("Students data:", studentsData);
        
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
          toast.error(`API Hatası: ${studentsData.error}`);
        }
        
        // Fetch recent transactions
        const transactionsRes = await fetch("/api/points", {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        const transactionsData = await transactionsRes.json();
        
        if (transactionsData.transactions) {
          // Ensure each transaction has complete student data
          const transactions = transactionsData.transactions.map((transaction: Transaction) => {
            // If student data is missing or incomplete, create a default student object
            const student = transaction.student || {};
            if (!student.username) {
              console.error('Transaction missing student data:', transaction);
              return {
                ...transaction,
                student: {
                  id: student.id || 'unknown',
                  username: student.username || 'test123',
                  firstName: student.firstName || null,
                  lastName: student.lastName || null
                }
              };
            }
            return transaction;
          });
          setRecentTransactions(transactions.slice(0, 10));
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
    if (selectedStudentIds.size === 0) return;

    setIsSubmitting(true);
    try {
      // Process each selected student
      const updatedStudents = [...students]; // Create a copy of students array
      const newTransactions: Transaction[] = []; // Collect all new transactions with proper typing
      
      for (const studentId of selectedStudentIds) {
        const selectedStudent = students.find(s => s.id === studentId);
        if (!selectedStudent) continue;

        // Handle points modification
        const response = await fetch(`/api/points`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId: studentId,
            points: isDecreasing ? -points : points,
            reason
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to modify points for ${selectedStudent.username}`);
        }

        const data = await response.json();
        
        // Update the student in our copy of the array
        const studentIndex = updatedStudents.findIndex(s => s.id === studentId);
        if (studentIndex !== -1) {
          updatedStudents[studentIndex] = {
            ...updatedStudents[studentIndex],
            points: data.newBalance
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
            }
          };
          newTransactions.push(transactionWithStudent);
        }
      }

      // Update all state at once
      setStudents(updatedStudents);
      setRecentTransactions(prev => [...newTransactions, ...prev]);

      const count = selectedStudentIds.size;
      toast.success(`${isDecreasing ? 'Azaltıldı' : 'Eklendi'} ${count} öğrenci${count > 1 ? 'ye' : 'ye'} ${points} puan ${isDecreasing ? 'dan' : ''}`);

      // Reset form
      setPoints(0);
      setReason("");
      setSelectedStudentIds(new Set());
      setIsDecreasing(false);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('İşlem başarısız oldu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get display name
  const getDisplayName = (student: { firstName?: string | null; lastName?: string | null; username: string } | undefined) => {
    if (!student) return 'Unknown';
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
  const filteredTransactions = recentTransactions.filter(transaction => {
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
    return <PointsPageSkeleton />;
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
                {isDecreasing ? 'Puan düşmek' : 'Puan vermek'} için öğrenci seçin
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
                
                <div className="space-y-2">
                  {filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-all ${
                        selectedStudentIds.has(student.id)
                          ? `${getThemeColors().secondary}`
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">
                            {student.firstName && student.lastName
                              ? `${student.firstName} ${student.lastName}`
                              : student.username}
                          </span>
                          {(student.firstName || student.lastName) && (
                            <p className="text-xs text-gray-500">@{student.username}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`${getThemeColors().highlight} ${getThemeColors().border}`}>
                            {student.points} puan
                          </Badge>
                          {selectedStudentIds.has(student.id) && (
                            <div className={`w-4 h-4 rounded-full ${getThemeColors().primary} flex items-center justify-center`}>
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
            
            <CardContent>
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
                      <Label>{isDecreasing ? 'Azalt' : 'Ekle'}</Label>
                    </div>
                  </div>
                </div>

                {/* Reason Input */}
                <div className="space-y-2">
                  <Label>Sebep</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Puan verme/azaltma sebebi..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={
                    selectedStudentIds.size === 0 ||
                    isSubmitting ||
                    points <= 0 ||
                    !reason.trim()
                  }
                  className={`w-full ${getThemeColors().primary} text-white`}
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

      {/* Recent Transactions - Now full width */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${getThemeColors().accent}`}>
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
                    <p className="font-medium">{getDisplayName(transaction.student)}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {formatDate(transaction.createdAt)}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{transaction.reason}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={transaction.points > 0 ? "default" : "destructive"}>
                      {transaction.points > 0 ? "+" : ""}{transaction.points} puan
                    </Badge>
                  </div>
                </div>
              ))}
              {/* Pagination Controls */}
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <LoadingPoints />
      ) : (
        <div className="space-y-8">
          <PointsHeader />
          <PointsManagement />
        </div>
      )}
    </div>
  );
} 