'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { PARTS } from '@/app/lib/parts';
import { getRoleBasedPath } from '@/app/lib/navigation';
import { getAllowedParts } from '@/app/lib/permissions';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import UserSettingsDialog from '@/app/components/UserSettingsDialog';

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isAdmin, isBoardMember, isStudent, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);


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

  if (!user) {
    return null;
  }

  const handlePartClick = (partId: number, partPath: string) => {
    if (partId === 7 && user) {
      // For Part 7 (Bilgeverse), redirect based on role(s)
      const roles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
      router.push(getRoleBasedPath(roles));
    } else {
      router.push(partPath);
    }
  };

  // Filter parts based on user's role permissions
  const roles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
  const allowedPartIds = getAllowedParts(roles);
  const visibleParts = PARTS.filter(part => allowedPartIds.includes(part.id));

  // Only show sidebar on dashboard page
  const isDashboardPage = pathname === '/dashboard';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="flex h-screen">
        {/* Sidebar - Only visible on dashboard page */}
        {isDashboardPage && (
          <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto shadow-sm flex flex-col">
            <div className="p-6 flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    Bölümler
                  </span>
                </h2>
                <button
                  onClick={() => logout()}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                  title="Çıkış Yap"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-2">
                {visibleParts.map((part) => (
                  <div
                    key={part.id}
                    onClick={() => handlePartClick(part.id, part.path)}
                    className="p-4 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:shadow-md border border-transparent hover:border-gray-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn('w-12 h-12 flex items-center justify-center rounded-lg group-hover:scale-110 transition-transform', part.bgColor, part.textColor)}>
                        {part.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                          {part.name}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">{part.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
                {/* Belgeler Link */}
                {(isAdmin || isBoardMember) && (
                  <div
                    onClick={() => router.push('/dashboard/pdfs')}
                    className="p-4 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:shadow-md border border-transparent hover:border-gray-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn('w-12 h-12 flex items-center justify-center rounded-lg group-hover:scale-110 transition-transform', 'bg-purple-50', 'text-purple-600')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                          Belgeler
                        </h3>
                        <p className="text-sm text-gray-500 truncate">Tüm bölümler için belgeler</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Sidebar Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <div
                onClick={() => setProfileOpen(true)}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200 shadow-inner group-hover:scale-110 transition-transform">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                </div>
                <Settings className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 group-hover:rotate-90 transition-all duration-300" />
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  Hoş Geldiniz
                </span>
              </h1>
              <p className="text-gray-600">Bilgeder Yönetim Kurulu sistemine hoş geldiniz</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleParts.map((part) => (
                <Card
                  key={part.id}
                  className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                  onClick={() => handlePartClick(part.id, part.path)}
                >
                  <div className={cn('h-2 bg-gradient-to-r', part.color)}></div>
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className={cn('w-16 h-16 flex items-center justify-center rounded-full', part.bgColor, part.textColor)}>
                        {part.icon}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl">{part.name}</CardTitle>
                        <CardDescription className="mt-1">{part.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm font-medium text-gray-600">
                      Bölüme Git
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>

      <UserSettingsDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}
