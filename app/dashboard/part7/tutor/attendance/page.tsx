"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createAttendanceSession, manualCheckInToSession } from "@/app/actions/attendance-sessions";
import {
  CheckCircle,
  ClipboardCheck,
  QrCode,
  Users,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Student {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
}

function getDisplayName(s: Student) {
  if (s.firstName && s.lastName) return `${s.firstName} ${s.lastName}`;
  if (s.firstName) return s.firstName;
  return s.username;
}

function getInitials(s: Student) {
  if (s.firstName) return s.firstName.charAt(0).toUpperCase();
  return s.username.charAt(0).toUpperCase();
}

export default function TutorAttendancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const dateStr = today.toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    fetch("/api/tutor/students", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.students) {
          setStudents(data.students);
        }
      })
      .catch(() => setError("Öğrenciler yüklenemedi"))
      .finally(() => setIsLoading(false));
  }, []);

  const toggleStudent = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === students.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(students.map((s) => s.id)));
    }
  };

  const handleSave = async () => {
    if (selected.size === 0) {
      toast.error("En az bir öğrenci seçin");
      return;
    }
    setIsSaving(true);
    try {
      // Create the attendance session for today
      const sessionResult = await createAttendanceSession({
        title: `Haftalık Yoklama - ${today.toLocaleDateString("tr-TR")}`,
        sessionDate: today.toISOString(),
        generateQR: false,
      });

      if (sessionResult.error || !sessionResult.data) {
        toast.error(sessionResult.error || "Oturum oluşturulamadı");
        return;
      }

      const sessionId = sessionResult.data.id;

      // Mark each selected student
      let successCount = 0;
      const errors: string[] = [];

      for (const studentId of selected) {
        const result = await manualCheckInToSession(sessionId, studentId);
        if (result.error) {
          const student = students.find((s) => s.id === studentId);
          errors.push(`${getDisplayName(student!)} — ${result.error}`);
        } else {
          successCount++;
        }
      }

      if (errors.length > 0) {
        toast.error(`${errors.length} öğrenci için hata oluştu`);
      }

      if (successCount > 0) {
        toast.success(`${successCount} öğrenci yoklaması kaydedildi`);
        setSaved(true);
      }
    } catch {
      toast.error("Yoklama kaydedilirken bir hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-6">
        <Card className="border-0 shadow-xl max-w-md w-full text-center p-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-green-100 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Yoklama Kaydedildi!</h2>
          <p className="text-gray-600 mb-6">
            {selected.size} öğrencinin yoklaması başarıyla alındı.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => router.push("/dashboard/part7/tutor")}>
              Ana Sayfaya Dön
            </Button>
            <Button
              onClick={() => {
                setSaved(false);
                setSelected(new Set());
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Yeni Yoklama Al
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <Link href="/dashboard/part7/tutor">
          <Button variant="ghost" className="mb-6 text-gray-600">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardCheck className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Yoklama Al</h1>
          </div>
          <p className="text-gray-500 ml-14">{dateStr}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl mb-4 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Student List */}
        <Card className="border-0 shadow-xl mb-6">
          <CardHeader className="pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Users className="h-5 w-5 text-blue-600" />
                Öğrenciler
                {!isLoading && (
                  <Badge variant="outline" className="ml-2">
                    {students.length} kişi
                  </Badge>
                )}
              </CardTitle>
              {!isLoading && students.length > 0 && (
                <Button variant="ghost" size="sm" onClick={toggleAll} className="text-blue-600">
                  {selected.size === students.length ? "Tümünü Kaldır" : "Tümünü Seç"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4 divide-y divide-gray-50">
            {isLoading ? (
              <div className="space-y-3 py-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))}
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p>Henüz öğrenci eklenmemiş</p>
                <Link href="/dashboard/part7/tutor/students/new">
                  <Button variant="link" className="text-blue-600 mt-2">
                    Öğrenci Ekle
                  </Button>
                </Link>
              </div>
            ) : (
              students.map((student) => (
                <div
                  key={student.id}
                  className={`flex items-center gap-4 p-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-lg ${
                    selected.has(student.id) ? "bg-blue-50/60" : ""
                  }`}
                  onClick={() => toggleStudent(student.id)}
                >
                  <Checkbox
                    checked={selected.has(student.id)}
                    onCheckedChange={() => toggleStudent(student.id)}
                    className="border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                      {getInitials(student)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-gray-800">{getDisplayName(student)}</span>
                  {selected.has(student.id) && (
                    <CheckCircle className="h-4 w-4 text-blue-500 ml-auto flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {!isLoading && students.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSave}
              disabled={isSaving || selected.size === 0}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-6 text-base shadow-lg shadow-blue-200 disabled:opacity-50"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Kaydediliyor...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  {selected.size > 0
                    ? `${selected.size} Öğrenciyi Kaydet`
                    : "Kaydet"}
                </span>
              )}
            </Button>
            <Link
              href="/dashboard/part2/attendance/new"
              className="flex-none"
            >
              <Button
                variant="outline"
                className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50 py-6 px-6"
              >
                <QrCode className="h-5 w-5 mr-2" />
                QR Kod ile Al
              </Button>
            </Link>
          </div>
        )}

        {selected.size > 0 && !isSaving && (
          <p className="text-center text-sm text-gray-500 mt-3">
            {selected.size} öğrenci işaretlendi
          </p>
        )}
      </div>
    </div>
  );
}
