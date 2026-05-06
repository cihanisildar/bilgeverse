"use client";

import { useAuth } from "@/app/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Award,
  Bell,
  Calendar,
  ClipboardCheck,
  Plus,
  Search,
  UserPlus,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RecentTransaction {
  id: string;
  type: "AWARD" | "REDEEM";
  points: number;
  reason: string;
  createdAt: string;
  student: {
    firstName: string;
    username: string;
  };
  tutor: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

function LoadingTransactions() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

function RecentTransactions() {
  const { isTutor } = useAuth();
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;

  useEffect(() => {
    if (!isTutor) return;
    fetch("/api/points", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.transactions) {
          const sorted = [...data.transactions].sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setTransactions(sorted);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [isTutor]);

  const filtered = transactions.filter(
    (t) =>
      t.student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.student.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const current = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-800">Son Puan İşlemleri</h2>
          <Link
            href="/dashboard/part7/tutor/points"
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            Puan Yönetimi <ArrowRight className="ml-1" size={14} />
          </Link>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              className="pl-9"
              placeholder="İşlemlerde ara..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {isLoading ? (
          <LoadingTransactions />
        ) : current.length > 0 ? (
          <>
            <div className="space-y-3">
              {current.map((t) => (
                <div
                  key={t.id}
                  className={`rounded-lg p-4 ${
                    t.type === "AWARD"
                      ? "bg-green-50 border border-green-100"
                      : "bg-red-50 border border-red-100"
                  }`}
                >
                  <div className="flex justify-between">
                    <div className="font-medium text-gray-900">
                      {t.student.firstName || t.student.username}
                    </div>
                    <div className={`font-bold ${t.type === "AWARD" ? "text-green-600" : "text-red-600"}`}>
                      {t.type === "AWARD" ? "+" : "-"}{Math.abs(t.points)} puan
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{t.reason}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(t.createdAt).toLocaleString("tr-TR")}
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Önceki
                </Button>
                <span className="flex items-center px-3 py-1 rounded-md bg-gray-100 text-sm">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sonraki
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <Award className="text-gray-400 mx-auto mb-3" size={24} />
            <p className="text-gray-600">
              {searchTerm ? "Aramanızla eşleşen işlem bulunamadı" : "Henüz işlem yok"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const quickActions = [
  {
    label: "Yoklama Al",
    description: "Öğrenci katılımını kaydet",
    href: "/dashboard/part7/tutor/attendance",
    icon: ClipboardCheck,
    gradient: "from-blue-500 to-cyan-500",
    bg: "from-blue-50 to-cyan-50",
    border: "border-blue-100",
    text: "text-blue-700",
    subtext: "text-blue-600",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    label: "Bilge Para Ver",
    description: "Öğrencilere puan ekle",
    href: "/dashboard/part7/tutor/points",
    icon: Award,
    gradient: "from-emerald-500 to-green-500",
    bg: "from-emerald-50 to-green-50",
    border: "border-emerald-100",
    text: "text-emerald-700",
    subtext: "text-emerald-600",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    label: "Öğrenci Ekle",
    description: "Gruba yeni öğrenci ekle",
    href: "/dashboard/part7/tutor/students/new",
    icon: UserPlus,
    gradient: "from-indigo-500 to-purple-500",
    bg: "from-indigo-50 to-purple-50",
    border: "border-indigo-100",
    text: "text-indigo-700",
    subtext: "text-indigo-600",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  {
    label: "Etkinlikler",
    description: "Etkinlikleri görüntüle",
    href: "/dashboard/part7/tutor/events",
    icon: Calendar,
    gradient: "from-orange-500 to-amber-500",
    bg: "from-orange-50 to-amber-50",
    border: "border-orange-100",
    text: "text-orange-700",
    subtext: "text-orange-600",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    label: "Etkinlik Oluştur",
    description: "Yeni etkinlik planla",
    href: "/dashboard/part7/tutor/events/new",
    icon: Plus,
    gradient: "from-pink-500 to-rose-500",
    bg: "from-pink-50 to-rose-50",
    border: "border-pink-100",
    text: "text-pink-700",
    subtext: "text-pink-600",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
  },
  {
    label: "Duyurular",
    description: "Duyuruları görüntüle",
    href: "/dashboard/part7/tutor/announcements",
    icon: Bell,
    gradient: "from-violet-500 to-purple-500",
    bg: "from-violet-50 to-purple-50",
    border: "border-violet-100",
    text: "text-violet-700",
    subtext: "text-violet-600",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
];

export default function TutorDashboard() {
  const { user } = useAuth();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Günaydın";
    if (hour < 18) return "İyi günler";
    return "İyi akşamlar";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white">
      <div className="px-4 py-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {greeting()}, {user?.firstName || user?.username}
            </span>
          </h1>
          <p className="text-gray-500 mt-1">Rehber Panelinize hoş geldiniz</p>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`flex flex-col items-start p-5 bg-gradient-to-br ${action.bg} rounded-xl border ${action.border} hover:shadow-md transition-all group`}
              >
                <div className={`p-2 rounded-lg ${action.iconBg} ${action.iconColor} mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon size={22} />
                </div>
                <span className={`font-semibold ${action.text} text-sm`}>
                  {action.label}
                </span>
                <span className={`text-xs ${action.subtext} mt-0.5`}>
                  {action.description}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Recent Transactions */}
        <RecentTransactions />
      </div>
    </div>
  );
}
