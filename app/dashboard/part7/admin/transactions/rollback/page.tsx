"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useToast } from '@/app/hooks/use-toast';

// Types
interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}
interface PointTransaction {
  id: string;
  student: User;
  points: number;
  type: string;
  reason: string;
  createdAt: string;
}
interface ExperienceTransaction {
  id: string;
  student: User;
  amount: number;
  createdAt: string;
}
interface Rollback {
  id: string;
  transactionId: string;
  transactionType: string;
  student: User;
  admin: User;
  reason: string;
  createdAt: string;
}

type RollbackForm = {
  transactionId: string;
  transactionType: "POINTS" | "EXPERIENCE";
  reason: string;
};

export default function AdminTransactionRollbackPage() {
  const toast = useToast();
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [points, setPoints] = useState<PointTransaction[]>([]);
  const [experience, setExperience] = useState<ExperienceTransaction[]>([]);
  const [rollbacks, setRollbacks] = useState<Rollback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rollbackForm, setRollbackForm] = useState<RollbackForm | null>(null);
  const [rollbackReason, setRollbackReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination states
  const PAGE_SIZE = 10;
  const [pointsPage, setPointsPage] = useState(1);
  const [expPage, setExpPage] = useState(1);
  const [rollbackPage, setRollbackPage] = useState(1);

  // Fetch data
  useEffect(() => {
    if (!user || !isAdmin) {
      router.push("/unauthorized");
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pointsRes, expRes, rollbacksRes] = await Promise.all([
          fetch("/api/points", { credentials: "include" }),
          fetch("/api/admin/experience/transactions", { credentials: "include" }),
          fetch("/api/admin/transactions/rollback", { credentials: "include" })
        ]);
        if (!pointsRes.ok) throw new Error("Failed to fetch points transactions");
        if (!expRes.ok) throw new Error("Failed to fetch experience transactions");
        if (!rollbacksRes.ok) throw new Error("Failed to fetch rollback history");
        const pointsData = await pointsRes.json();
        const expData = await expRes.json();
        const rollbacksData = await rollbacksRes.json();
        setPoints(pointsData.transactions || []);
        setExperience(expData.transactions || []);
        setRollbacks(rollbacksData.rollbacks || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, isAdmin, router]);

  // Pagination helpers
  const paginate = (arr: any[], page: number) => arr.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pointsTotalPages = Math.ceil(points.length / PAGE_SIZE);
  const expTotalPages = Math.ceil(experience.length / PAGE_SIZE);
  const rollbackTotalPages = Math.ceil(rollbacks.length / PAGE_SIZE);

  // Rollback handler
  const handleRollback = async () => {
    if (!rollbackForm || !rollbackReason) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/transactions/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          transactionId: rollbackForm.transactionId,
          transactionType: rollbackForm.transactionType,
          reason: rollbackReason
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rollback failed");
      setRollbackForm(null);
      setRollbackReason("");
      toast.success("İşlem başarıyla geri alındı!");
      // Refresh data
      const [pointsRes, expRes, rollbacksRes] = await Promise.all([
        fetch("/api/points", { credentials: "include" }),
        fetch("/api/admin/experience/transactions", { credentials: "include" }),
        fetch("/api/admin/transactions/rollback", { credentials: "include" })
      ]);
      setPoints((await pointsRes.json()).transactions || []);
      setExperience((await expRes.json()).transactions || []);
      setRollbacks((await rollbacksRes.json()).rollbacks || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      <Card className="p-6 mb-8">
        <div className="mb-4"><Skeleton className="h-8 w-64 mb-2" /></div>
        <Skeleton className="h-6 w-full mb-2" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </Card>
      <Card className="p-6 mb-8">
        <div className="mb-4"><Skeleton className="h-8 w-64 mb-2" /></div>
        <Skeleton className="h-6 w-full mb-2" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </Card>
      <Card className="p-6">
        <div className="mb-4"><Skeleton className="h-8 w-64 mb-2" /></div>
        <Skeleton className="h-6 w-full mb-2" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-32" />
          </div>
        ))}
      </Card>
    </div>
  );
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">İşlem Geri Alma (Yönetici)</h1>
      {/* Points Transactions */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">Puan İşlemleri</h2>
        <div className="overflow-x-auto rounded shadow border bg-white">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="p-2 border">Öğrenci</th>
                <th className="p-2 border">Puan</th>
                <th className="p-2 border">Tür</th>
                <th className="p-2 border">Açıklama</th>
                <th className="p-2 border">Tarih</th>
                <th className="p-2 border">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {paginate(points, pointsPage).length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-gray-400">Kayıtlı puan işlemi yok.</td></tr>
              ) : paginate(points, pointsPage).map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition">
                  <td className="p-2 border font-medium">{tx.student.firstName || tx.student.lastName ? `${tx.student.firstName || ''} ${tx.student.lastName || ''}`.trim() : tx.student.username}</td>
                  <td className="p-2 border text-center">{tx.points}</td>
                  <td className="p-2 border text-center">{tx.type === 'AWARD' ? 'Eklendi' : 'Azaltıldı'}</td>
                  <td className="p-2 border">{tx.reason}</td>
                  <td className="p-2 border text-center">{new Date(tx.createdAt).toLocaleString('tr-TR')}</td>
                  <td className="p-2 border text-center">
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50"
                      disabled={rollbacks.some(r => r.transactionId === tx.id && r.transactionType === "POINTS")}
                      onClick={() => {
                        setRollbackForm({ transactionId: tx.id, transactionType: "POINTS", reason: "" });
                        setRollbackReason("");
                      }}
                    >
                      Geri Al
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination Controls */}
          {pointsTotalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-3">
              <button
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                onClick={() => setPointsPage(p => Math.max(1, p - 1))}
                disabled={pointsPage === 1}
              >Önceki</button>
              <span className="mx-2">{pointsPage} / {pointsTotalPages}</span>
              <button
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                onClick={() => setPointsPage(p => Math.min(pointsTotalPages, p + 1))}
                disabled={pointsPage === pointsTotalPages}
              >Sonraki</button>
            </div>
          )}
        </div>
      </section>
      {/* Experience Transactions */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">Tecrübe İşlemleri</h2>
        <div className="overflow-x-auto rounded shadow border bg-white">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="p-2 border">Öğrenci</th>
                <th className="p-2 border">Miktar</th>
                <th className="p-2 border">Tarih</th>
                <th className="p-2 border">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {paginate(experience, expPage).length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-gray-400">Kayıtlı tecrübe işlemi yok.</td></tr>
              ) : paginate(experience, expPage).map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition">
                  <td className="p-2 border font-medium">{tx.student.firstName || tx.student.lastName ? `${tx.student.firstName || ''} ${tx.student.lastName || ''}`.trim() : tx.student.username}</td>
                  <td className="p-2 border text-center">{tx.amount}</td>
                  <td className="p-2 border text-center">{new Date(tx.createdAt).toLocaleString('tr-TR')}</td>
                  <td className="p-2 border text-center">
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50"
                      disabled={rollbacks.some(r => r.transactionId === tx.id && r.transactionType === "EXPERIENCE")}
                      onClick={() => {
                        setRollbackForm({ transactionId: tx.id, transactionType: "EXPERIENCE", reason: "" });
                        setRollbackReason("");
                      }}
                    >
                      Geri Al
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination Controls */}
          {expTotalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-3">
              <button
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                onClick={() => setExpPage(p => Math.max(1, p - 1))}
                disabled={expPage === 1}
              >Önceki</button>
              <span className="mx-2">{expPage} / {expTotalPages}</span>
              <button
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                onClick={() => setExpPage(p => Math.min(expTotalPages, p + 1))}
                disabled={expPage === expTotalPages}
              >Sonraki</button>
            </div>
          )}
        </div>
      </section>
      {/* Rollback Dialog */}
      {rollbackForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Geri Alma Onayı</h3>
            <p className="mb-2">Lütfen bu işlemi neden geri almak istediğinizi belirtin:</p>
            <textarea
              className="w-full border rounded p-2 mb-4"
              rows={3}
              value={rollbackReason}
              onChange={e => setRollbackReason(e.target.value)}
              placeholder="Geri alma sebebiniz..."
            />
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => setRollbackForm(null)}
                disabled={actionLoading}
              >İptal</button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={handleRollback}
                disabled={actionLoading || !rollbackReason.trim()}
              >{actionLoading ? "Geri alınıyor..." : "Geri Almayı Onayla"}</button>
            </div>
          </div>
        </div>
      )}
      {/* Rollback History */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Geri Alma Geçmişi</h2>
        <div className="overflow-x-auto rounded shadow border bg-white">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="p-2 border">Tür</th>
                <th className="p-2 border">Öğrenci</th>
                <th className="p-2 border">Yönetici</th>
                <th className="p-2 border">Sebep</th>
                <th className="p-2 border">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {paginate(rollbacks, rollbackPage).length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-gray-400">Henüz geri alma işlemi yapılmadı.</td></tr>
              ) : paginate(rollbacks, rollbackPage).map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="p-2 border text-center">{r.transactionType === 'POINTS' ? 'Puan' : 'Tecrübe'}</td>
                  <td className="p-2 border font-medium">{r.student.firstName || r.student.lastName ? `${r.student.firstName || ''} ${r.student.lastName || ''}`.trim() : r.student.username}</td>
                  <td className="p-2 border font-medium">{r.admin.firstName || r.admin.lastName ? `${r.admin.firstName || ''} ${r.admin.lastName || ''}`.trim() : r.admin.username}</td>
                  <td className="p-2 border">{r.reason}</td>
                  <td className="p-2 border text-center">{new Date(r.createdAt).toLocaleString('tr-TR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination Controls */}
          {rollbackTotalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-3">
              <button
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                onClick={() => setRollbackPage(p => Math.max(1, p - 1))}
                disabled={rollbackPage === 1}
              >Önceki</button>
              <span className="mx-2">{rollbackPage} / {rollbackTotalPages}</span>
              <button
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                onClick={() => setRollbackPage(p => Math.min(rollbackTotalPages, p + 1))}
                disabled={rollbackPage === rollbackTotalPages}
              >Sonraki</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
} 