'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { getAttendanceSessions, getTutorStudents } from '@/app/actions/attendance-sessions';
import { AlertTriangle, TrendingUp, Users, CalendarX } from 'lucide-react';

type Student = {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
};

type Session = {
  id: string;
  sessionDate: string;
  attendances: { studentId: string }[];
};

type StudentStat = Student & {
  attended: number;
  total: number;
  pct: number;
  /** Number of most-recent consecutive sessions the student missed */
  absenceStreak: number;
};

// Two or more consecutive missed sessions triggers a warning
const ABSENCE_WARNING_THRESHOLD = 2;

function getDisplayName(s: Student) {
  if (s.firstName && s.lastName) return `${s.firstName} ${s.lastName}`;
  if (s.firstName) return s.firstName;
  return s.username;
}

function getInitials(s: Student) {
  if (s.firstName) return s.firstName.charAt(0).toUpperCase();
  return s.username.charAt(0).toUpperCase();
}

function pctColor(pct: number) {
  if (pct >= 75) return 'bg-green-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function ParticipationOverview() {
  const { data: sessionsResult, isLoading: sessionsLoading } = useQuery({
    queryKey: ['attendanceSessions'],
    queryFn: async () => getAttendanceSessions(),
  });

  const { data: studentsResult, isLoading: studentsLoading } = useQuery({
    queryKey: ['tutorStudents'],
    queryFn: async () => getTutorStudents(),
  });

  const isLoading = sessionsLoading || studentsLoading;

  const { stats, totalSessions, average, warningCount } = useMemo(() => {
    const sessions = (sessionsResult?.data as Session[] | null) || [];
    const students = (studentsResult?.data as Student[] | null) || [];

    // Most recent first
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
    );
    const total = sorted.length;

    const computed: StudentStat[] = students.map((st) => {
      let attended = 0;
      let absenceStreak = 0;
      let streakOpen = true;

      for (const s of sorted) {
        const present = s.attendances?.some((a) => a.studentId === st.id);
        if (present) {
          attended++;
          streakOpen = false;
        } else if (streakOpen) {
          // Count only the leading run of absences (most recent sessions)
          absenceStreak++;
        }
      }

      const pct = total > 0 ? Math.round((attended / total) * 100) : 0;
      return { ...st, attended, total, pct, absenceStreak };
    });

    // Warnings on top, then lowest attendance first
    computed.sort((a, b) => {
      const aWarn = a.absenceStreak >= ABSENCE_WARNING_THRESHOLD ? 1 : 0;
      const bWarn = b.absenceStreak >= ABSENCE_WARNING_THRESHOLD ? 1 : 0;
      if (aWarn !== bWarn) return bWarn - aWarn;
      return a.pct - b.pct;
    });

    const avg =
      computed.length > 0
        ? Math.round(computed.reduce((sum, s) => sum + s.pct, 0) / computed.length)
        : 0;
    const warns = computed.filter((s) => s.absenceStreak >= ABSENCE_WARNING_THRESHOLD).length;

    return { stats: computed, totalSessions: total, average: avg, warningCount: warns };
  }, [sessionsResult, studentsResult]);

  return (
    <Card className="border-0 shadow-xl mt-8">
      <CardHeader className="pb-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Katılım Durumu
          </CardTitle>
          {!isLoading && totalSessions > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-gray-600">
                <Users className="h-3.5 w-3.5 mr-1" />
                Ort. %{average}
              </Badge>
              {warningCount > 0 && (
                <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  {warningCount} öğrenci 2+ hafta devamsız
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24 ml-auto" />
              </div>
            ))}
          </div>
        ) : totalSessions === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <CalendarX className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p>Henüz yoklama oturumu yok</p>
            <p className="text-sm text-gray-400 mt-1">
              Yoklama aldıkça öğrencilerin katılım oranları burada görünecek.
            </p>
          </div>
        ) : stats.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p>Henüz öğrenci eklenmemiş</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {stats.map((s) => {
              const isWarning = s.absenceStreak >= ABSENCE_WARNING_THRESHOLD;
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 sm:gap-4 py-3 px-1 rounded-lg ${
                    isWarning ? 'bg-red-50/50' : ''
                  }`}
                >
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarFallback
                      className={`text-sm font-semibold ${
                        isWarning ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {getInitials(s)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-800 truncate">
                        {getDisplayName(s)}
                      </span>
                      {isWarning && (
                        <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100 text-[11px] px-2 py-0">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {s.absenceStreak} hafta üst üste yok
                        </Badge>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[180px]">
                        <div
                          className={`h-full rounded-full ${pctColor(s.pct)}`}
                          style={{ width: `${s.pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className={`text-sm font-bold ${
                      s.pct >= 75 ? 'text-green-600' : s.pct >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      %{s.pct}
                    </div>
                    <div className="text-xs text-gray-400">
                      {s.attended}/{s.total} hafta
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
