import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Calendar, Users, QrCode, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { getAttendanceSessions } from '@/app/actions/attendance-sessions';
import AttendanceSessionsList from './AttendanceSessionsList';

export default async function AttendancePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const isAdmin = session.user.role === 'ADMIN';
  const isTutor = session.user.role === 'TUTOR';
  const canManage = isAdmin || isTutor;

  if (!canManage) {
    redirect('/dashboard/part7/student');
  }

  const result = await getAttendanceSessions();
  const sessions = result.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/dashboard/part2">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
        </Link>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
                Haftalık Yoklama Yönetimi
              </span>
            </h1>
            <p className="text-gray-600">QR kod ile öğrenci devam takibi yapın</p>
          </div>
          {canManage && (
            <div className="flex gap-3">
              <AttendanceSessionsList sessions={sessions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
