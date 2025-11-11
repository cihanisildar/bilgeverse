"use client";

import StudentReport from "@/app/components/StudentReport";
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
import {
  ArrowLeft,
  Award,
  TrendingUp,
  User,
  GraduationCap,
  Star,
  Calendar,
  Mail,
  UserCheck,
  Activity,
  Target,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type Student = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  points: number;
  experience: number;
  email?: string;
  createdAt?: string;
};

export default function StudentReportPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const studentId = params.id as string;

  useEffect(() => {
    if (studentId) {
      fetchStudent();
    }
  }, [studentId]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/students`);
      if (!response.ok) throw new Error("Failed to fetch students");

      const data = await response.json();
      if (data.students) {
        const foundStudent = data.students.find(
          (s: Student) => s.id === studentId
        );
        if (foundStudent) {
          setStudent(foundStudent);
        } else {
          toast.error("Öğrenci bulunamadı");
          router.push("/dashboard/part7/admin/reports");
        }
      }
    } catch (error) {
      console.error("Error fetching student:", error);
      toast.error("Öğrenci bilgileri yüklenirken bir hata oluştu");
      router.push("/dashboard/part7/admin/reports");
    } finally {
      setLoading(false);
    }
  };

  const getStudentDisplayName = (student: Student) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    }
    return student.username;
  };

  const getStudentLevelColor = (points: number) => {
    if (points >= 1000) return "from-purple-500 to-purple-600";
    if (points >= 500) return "from-blue-500 to-blue-600";
    if (points >= 200) return "from-green-500 to-green-600";
    if (points >= 50) return "from-yellow-500 to-yellow-600";
    return "from-gray-400 to-gray-500";
  };

  const getStudentLevel = (points: number) => {
    if (points >= 1000) return { name: "Uzman", color: "text-purple-700" };
    if (points >= 500) return { name: "İleri", color: "text-blue-700" };
    if (points >= 200) return { name: "Orta", color: "text-green-700" };
    if (points >= 50) return { name: "Başlangıç", color: "text-yellow-700" };
    return { name: "Yeni", color: "text-gray-700" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-blue-50 flex flex-col justify-center items-center space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-600 absolute top-0 left-0"></div>
        </div>
        <p className="text-gray-600 font-medium">
          Öğrenci raporu yükleniyor...
        </p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-blue-50 flex justify-center items-center">
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl p-8">
          <div className="text-center space-y-4">
            <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Öğrenci Bulunamadı
            </h2>
            <p className="text-gray-600">
              Aradığınız öğrenci raporu bulunamadı veya erişim izniniz yok.
            </p>
            <Button
              onClick={() => router.push("/dashboard/part7/admin/reports")}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Raporlara Dön
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const level = getStudentLevel(student.points);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-blue-50">
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Back Button */}
        <div className="flex items-center justify-start">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/part7/admin/reports")}
            className="flex items-center gap-2 bg-white/70 backdrop-blur-sm border-white/20 hover:bg-white/90 transition-all duration-200 shadow-sm text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Geri Dön</span>
            <span className="sm:hidden">Geri</span>
          </Button>
        </div>

        {/* Enhanced Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-blue-600 to-indigo-600 opacity-5 rounded-2xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl text-white shadow-lg w-fit">
                    <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {getStudentDisplayName(student)}
                    </h1>
                    <p className="text-gray-600 text-base sm:text-lg">
                      Öğrenci Performans Raporu
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2">
                      <p className="text-sm text-gray-500">
                        @{student.username}
                      </p>
                      <Badge className={`${level.color} bg-white border-2 w-fit`}>
                        <Star className="h-3 w-3 mr-1" />
                        {level.name} Seviye
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Badge className="bg-green-100 text-green-800 text-sm sm:text-base px-3 sm:px-4 py-2 border border-green-200">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Öğrenci
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Report - Let it show its own stats */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-1 sm:p-2">
          <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 shadow-sm">
            <StudentReport
              studentId={student.id}
              studentName={getStudentDisplayName(student)}
            />
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-6">
              <h3 className="font-semibold text-gray-800 text-base sm:text-lg">Seviye İlerlemesi</h3>
              <Badge variant="outline" className="bg-white px-3 sm:px-4 py-2 w-fit">
                <span className="text-xs sm:text-sm">
                  {Math.round((student.points % 200) / 2)}% - Sonraki seviyeye
                </span>
              </Badge>
            </div>
            <div className="relative space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4">
                <div
                  className={`h-3 sm:h-4 rounded-full bg-gradient-to-r ${getStudentLevelColor(
                    student.points
                  )} transition-all duration-500 shadow-sm`}
                  style={{
                    width: `${Math.min((student.points % 200) / 2, 100)}%`,
                  }}
                ></div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0 mt-3 text-xs sm:text-sm text-gray-600">
                <span className="font-medium">Mevcut Seviye: {level.name}</span>
                <span className="font-medium">{student.points % 200}/200 puan</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
