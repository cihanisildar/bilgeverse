'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, LogOut, Settings, User as UserIcon, ChevronRight } from 'lucide-react';
import { PARTS } from '@/app/lib/parts';
import { getRoleBasedPath } from '@/app/lib/navigation';
import { getAllowedParts } from '@/app/lib/permissions';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import UserSettingsDialog from '@/app/components/UserSettingsDialog';

interface SubPage {
  label: string;
  path: string;
}

function getSubPages(partId: number, roles: string[]): SubPage[] {
  const isAdmin = roles.includes('ADMIN');
  const isTutor = roles.includes('TUTOR') || roles.includes('ASISTAN');
  const isStudent = roles.includes('STUDENT');
  const isBoardMember = roles.includes('BOARD_MEMBER');

  switch (partId) {
    case 1:
      return [
        { label: 'Toplantılar', path: '/dashboard/part1' },
        { label: 'Yönetim Kurulu Üyeleri', path: '/dashboard/part1/board-members' },
      ];
    case 2:
      return [
        { label: 'Gruplar', path: '/dashboard/part2' },
        { label: 'Sosyometrik Analiz', path: '/dashboard/part2/sociometric' },
        { label: 'Buluşma İçeriği', path: '/dashboard/part2/syllabus' },
      ];
    case 4:
      return [
        { label: 'Atölyeler', path: '/dashboard/part4' },
      ];
    case 7:
      if (isAdmin) return [
        { label: 'Yönetici Paneli', path: '/dashboard/part7/admin' },
        { label: 'Kullanıcı Yönetimi', path: '/dashboard/part7/admin/users' },
        { label: 'Puan Yönetimi', path: '/dashboard/part7/admin/points' },
        { label: 'Liderlik Tablosu', path: '/dashboard/part7/admin/leaderboard' },
      ];
      if (isTutor) return [
        { label: 'Rehber Paneli', path: '/dashboard/part7/tutor' },
        { label: 'Grubum', path: '/dashboard/part7/tutor/students' },
        { label: 'Yoklama Al', path: '/dashboard/part7/tutor/attendance' },
        { label: 'Bilge Para Ver', path: '/dashboard/part7/tutor/points' },
      ];
      if (isStudent) return [
        { label: 'Öğrenci Paneli', path: '/dashboard/part7/student' },
        { label: 'Liderlik Tablosu', path: '/dashboard/part7/student/leaderboard' },
        { label: 'Mağaza', path: '/dashboard/part7/student/store' },
        { label: 'Atölyeler', path: '/dashboard/part7/student/workshops' },
      ];
      return [];
    case 11:
      return [
        { label: 'Akademi', path: '/dashboard/part11' },
      ];
    default:
      return [];
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, isAdmin, isBoardMember, isStudent, isInAcademy, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user && isStudent && !isAdmin) {
      router.replace('/dashboard/part7/student');
    }
  }, [loading, user, isStudent, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">Bilgeder</div>
          <div className="w-full flex items-center justify-center">
            <div className="loader"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handlePartClick = (partId: number, partPath: string) => {
    if (partId === 7 && user) {
      const roles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
      router.push(getRoleBasedPath(roles));
    } else {
      router.push(partPath);
    }
  };

  const roles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
  const allowedPartIds = getAllowedParts(roles);
  const visibleParts = PARTS.filter(part => allowedPartIds.includes(part.id) || (part.id === 1 && isBoardMember))
    .filter(part => !(isStudent && !isAdmin && (part.id === 4 || part.id === 11)))
    .filter(part => part.id !== 11 || isInAcademy || isAdmin || isBoardMember);

  const getPartDestination = (partId: number, partPath: string) => {
    if (partId === 7 && user) {
      return getRoleBasedPath(roles);
    }
    return partPath;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Top header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Bilgeder
            </h1>
            <p className="text-xs text-gray-500">Yönetim Sistemi</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-none">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-500">@{user.username}</p>
              </div>
              <Settings className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 group-hover:rotate-90 transition-all duration-300 hidden sm:block" />
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Çıkış Yap</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-1">
            Hoş Geldiniz, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">{user.firstName}</span>
          </h2>
          <p className="text-gray-500">Erişiminiz olan bölümler aşağıda listelenmektedir.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleParts.map((part) => {
            const subPages = getSubPages(part.id, roles as string[]);
            const destination = getPartDestination(part.id, part.path);

            return (
              <Card
                key={part.id}
                className="border-0 shadow-md rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
              >
                <div className={cn('h-1.5 bg-gradient-to-r', part.color)} />
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-12 h-12 flex items-center justify-center rounded-xl flex-shrink-0', part.bgColor, part.textColor)}>
                      {part.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base leading-tight">{part.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5 line-clamp-2">{part.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                {subPages.length > 0 && (
                  <CardContent className="pt-0 pb-3 flex-1">
                    <div className="border-t border-gray-100 pt-3 space-y-1">
                      {subPages.map((sub) => (
                        <button
                          key={sub.path}
                          onClick={() => router.push(sub.path)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors text-left group"
                        >
                          <ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-indigo-500 flex-shrink-0" />
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                )}

                <CardContent className={cn('pt-0', subPages.length > 0 ? '' : 'flex-1 flex items-end')}>
                  <button
                    onClick={() => router.push(destination)}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                      'bg-gradient-to-r text-white hover:opacity-90',
                      part.color
                    )}
                  >
                    Bölüme Git
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
            );
          })}

          {/* Belgeler card for admin/board member */}
          {(isAdmin || isBoardMember) && (
            <Card className="border-0 shadow-md rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col">
              <div className="h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-purple-50 text-purple-600 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base leading-tight">Belgeler</CardTitle>
                    <CardDescription className="text-xs mt-0.5">Tüm bölümler için belgeler</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex-1 flex items-end">
                <button
                  onClick={() => router.push('/dashboard/pdfs')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-all"
                >
                  Belgelere Git
                  <ArrowRight className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <UserSettingsDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}
