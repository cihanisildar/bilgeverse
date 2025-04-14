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
import { AlertCircle, Award, Clock, Search } from 'lucide-react';

// Types
type Student = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  points: number;
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
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("award");

  // Fetch students and recent transactions
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch students assigned to this tutor
        const studentsRes = await fetch("/api/users?role=student");
        const studentsData = await studentsRes.json();
        
        if (studentsData.users) {
          setStudents(studentsData.users.map((user: any) => ({
            id: user._id || user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            points: user.points || 0
          })));
        }
        
        // Fetch recent transactions
        const transactionsRes = await fetch("/api/points");
        const transactionsData = await transactionsRes.json();
        
        if (transactionsData.transactions) {
          setRecentTransactions(transactionsData.transactions.slice(0, 10));
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
    setSelectedStudent(student);
    setActiveTab("award");
  };

  // Handle award points submission
  const handleAwardPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      toast.error("Lütfen bir öğrenci seçin");
      return;
    }
    
    if (points <= 0) {
      toast.error("Puan 0'dan büyük olmalıdır");
      return;
    }
    
    if (!reason.trim()) {
      toast.error("Lütfen bir sebep belirtin");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          points,
          reason,
          type: "award",
        }),
      });
      
      if (!response.ok) {
        throw new Error("Puan verme işlemi başarısız oldu");
      }
      
      toast.success(`${points} puan başarıyla verildi`);
      
      // Reset form
      setPoints(0);
      setReason("");
      setSelectedStudent(null);
      
      // Refresh data
      const transactionsRes = await fetch("/api/points");
      const transactionsData = await transactionsRes.json();
      setRecentTransactions(transactionsData.transactions.slice(0, 10));
      
      const studentsRes = await fetch("/api/users?role=student");
      const studentsData = await studentsRes.json();
      setStudents(studentsData.users);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
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

  if (isLoading) {
    return <PointsPageSkeleton />;
  }

  return (
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
              Puan vermek için öğrenci seçin
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
                      selectedStudent?.id === student.id
                        ? "bg-blue-100 text-blue-800"
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
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {student.points} puan
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Award Points Form and History */}
      <div className="lg:col-span-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="award">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-700">
                  {selectedStudent ? (
                    <span>
                      {selectedStudent.firstName && selectedStudent.lastName
                        ? `${selectedStudent.firstName} ${selectedStudent.lastName}`
                        : selectedStudent.username} için Puan Ver
                    </span>
                  ) : (
                    "Puan Ver"
                  )}
                </CardTitle>
                <CardDescription>
                  {selectedStudent 
                    ? `Öğrencinin mevcut puanı: ${selectedStudent.points}`
                    : "Puan vermek için önce bir öğrenci seçin"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedStudent ? (
                  <form onSubmit={handleAwardPoints} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="points">Puan Miktarı</Label>
                      <Input
                        id="points"
                        type="number"
                        min="1"
                        value={points}
                        onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                        required
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reason">Sebep</Label>
                      <Textarea
                        id="reason"
                        placeholder="Puanın neden verildiğini açıklayın..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                        className="w-full min-h-[100px]"
                      />
                    </div>
                    
                    <Button
                      type="submit" 
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      disabled={isSubmitting || !selectedStudent || points <= 0 || !reason.trim()}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                          İşleniyor...
                        </>
                      ) : (
                        <>
                          <Award className="mr-2" /> Puan Ver
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <AlertCircle className="mx-auto mb-2 h-10 w-10 text-gray-400" />
                    <p>Puan vermek için sol taraftan bir öğrenci seçin</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-700">Son Puan İşlemleri</CardTitle>
                <CardDescription>
                  Öğrencilerinize verdiğiniz puanların geçmişi
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {recentTransactions.map((transaction) => (
                      <div 
                        key={transaction.id} 
                        className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-800">
                              {transaction.student.firstName && transaction.student.lastName
                                ? `${transaction.student.firstName} ${transaction.student.lastName}`
                                : transaction.student.username}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(transaction.createdAt)}
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            +{transaction.points} puan
                          </Badge>
                        </div>
                        <p className="mt-2 text-gray-600 text-sm">
                          {transaction.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <Clock className="mx-auto mb-2 h-10 w-10 text-gray-400" />
                    <p>Henüz hiç puan işlemi yok</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  variant="outline" 
                  className="text-blue-600"
                  onClick={() => router.push("/tutor/points/history")}
                >
                  Tüm İşlemleri Görüntüle
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
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