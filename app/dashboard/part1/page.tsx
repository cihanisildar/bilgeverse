'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, FileText, Calendar, ExternalLink, Power, Users, CheckCircle2, Clock, ListTodo } from 'lucide-react';
import { PARTS } from '@/app/lib/parts';
import { getRoleBasedPath } from '@/app/lib/navigation';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Loading from '@/app/components/Loading';
import toast from 'react-hot-toast';
import { getDecisionStatistics } from '@/app/actions/meetings/decisions';

type PartPdf = {
  id: string;
  partId: number;
  title: string;
  description: string | null;
  driveLink: string;
  contentType: string | null;
  isActive: boolean;
  createdAt: string;
  uploadedBy: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  };
};

export default function Part1Page() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isAdmin } = useAuth();
  const [pdfs, setPdfs] = useState<PartPdf[]>([]);
  const [loadingPdfs, setLoadingPdfs] = useState(true);
  const [decisionStats, setDecisionStats] = useState<{ total: number; completed: number; pending: number } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Redirect non-admin users to part 7
  useEffect(() => {
    if (!loading && user && !isAdmin) {
      router.replace(getRoleBasedPath(user.role));
    }
  }, [loading, user, isAdmin, router]);

  useEffect(() => {
    if (user) {
      fetchPdfs();
      fetchDecisionStats();
    }
  }, [user]);

  const fetchPdfs = async () => {
    try {
      setLoadingPdfs(true);
      const response = await fetch('/api/admin/pdfs?partId=0');
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data: PartPdf[] = await response.json();
      setPdfs(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Belgeleri yüklerken bir hata oluştu');
    } finally {
      setLoadingPdfs(false);
    }
  };

  const fetchDecisionStats = async () => {
    try {
      setLoadingStats(true);
      const result = await getDecisionStatistics();
      if (result.error) {
        throw new Error(result.error);
      }
      setDecisionStats(result.data);
    } catch (error) {
      console.error('Error fetching decision statistics:', error);
      toast.error('Karar istatistikleri yüklenirken bir hata oluştu');
    } finally {
      setLoadingStats(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
      // For Part 7 (Bilgeverse), redirect based on role
      router.push(getRoleBasedPath(user.role));
    } else {
      // For other parts, only allow admin users
      if (isAdmin) {
        router.push(partPath);
      } else {
        // Non-admin users should be redirected to part 7
        router.push(getRoleBasedPath(user.role));
      }
    }
  };

  // Filter parts to only show part 7 for non-admin users
  const visibleParts = isAdmin ? PARTS : PARTS.filter(part => part.id === 7);

  // Show sidebar on part1 page
  const isDashboardPage = pathname === '/dashboard/part1';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        {isDashboardPage && (
          <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto shadow-sm">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  Bölümler
                </span>
              </h2>
              <div className="space-y-2">
                {visibleParts.map((part) => (
                  <div
                    key={part.id}
                    onClick={() => handlePartClick(part.id, part.path)}
                    className="p-4 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:shadow-md border border-transparent hover:border-gray-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 flex items-center justify-center rounded-lg ${part.bgColor} ${part.textColor} group-hover:scale-110 transition-transform`}>
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
                  Bilgeder Yönetim Kurulu
                </span>
              </h1>
              <p className="text-gray-600">Yönetim kurulu toplantılarını yönetin ve katılım takibi yapın</p>
            </div>

            {/* Decision Summary Cards */}
            {loadingStats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-0 shadow-md rounded-xl overflow-hidden bg-white">
                    <div className="h-1.5 bg-gradient-to-r from-gray-200 to-gray-300"></div>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-3" />
                          <Skeleton className="h-9 w-16" />
                        </div>
                        <Skeleton className="w-12 h-12 rounded-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : decisionStats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card
                  className="border-0 shadow-md rounded-xl overflow-hidden bg-white cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
                  onClick={() => router.push('/dashboard/part1/decisions?status=all')}
                >
                  <div className="h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Toplam Kararlar</p>
                        <p className="text-3xl font-bold text-gray-800 mt-2">{decisionStats.total}</p>
                      </div>
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <ListTodo className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="border-0 shadow-md rounded-xl overflow-hidden bg-white cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
                  onClick={() => router.push('/dashboard/part1/decisions?status=completed')}
                >
                  <div className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tamamlanan Kararlar</p>
                        <p className="text-3xl font-bold text-gray-800 mt-2">{decisionStats.completed}</p>
                      </div>
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="border-0 shadow-md rounded-xl overflow-hidden bg-white cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
                  onClick={() => router.push('/dashboard/part1/decisions?status=pending')}
                >
                  <div className="h-1.5 bg-gradient-to-r from-orange-500 to-amber-500"></div>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Bekleyen Kararlar</p>
                        <p className="text-3xl font-bold text-gray-800 mt-2">{decisionStats.pending}</p>
                      </div>
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-orange-100 text-orange-600">
                        <Clock className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Meetings Card */}
              {isAdmin && (
                <Card
                  className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-indigo-50 to-purple-50"
                  onClick={() => router.push('/dashboard/part1/meetings')}
                >
                  <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                        <Calendar className="h-8 w-8" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Toplantılar</CardTitle>
                        <CardDescription className="mt-1">Yönetim kurulu toplantılarını yönetin ve katılım takibi yapın</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm font-medium text-gray-600">
                      Toplantılara Git
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Board Members Card */}
              {isAdmin && (
                <Card
                  className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-purple-50 to-pink-50"
                  onClick={() => router.push('/dashboard/part1/board-members')}
                >
                  <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">
                        <Users className="h-8 w-8" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Yönetim Kurulu Üyeleri</CardTitle>
                        <CardDescription className="mt-1">Yönetim kurulu üyelerini tanımlayın ve yönetin</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm font-medium text-gray-600">
                      Üyelere Git
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Yönetim Kurulu Belgeleri Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">Yönetim Kurulu Belgeleri</h2>
                  <p className="text-gray-600">Yönetim kurulu için paylaşılan belgeler ve klasörler</p>
                </div>
                {isAdmin && (
                  <Button
                    onClick={() => router.push('/dashboard/part10')}
                    variant="outline"
                    className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Belge Ekle
                  </Button>
                )}
              </div>

              {loadingPdfs ? (
                <Loading message="Belgeler yükleniyor..." />
              ) : pdfs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {pdfs.map((pdf) => (
                    <Card
                      key={pdf.id}
                      className="group border-0 shadow-md rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white"
                    >
                      <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md group-hover:scale-110 transition-transform shrink-0">
                              <FileText className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg font-bold text-gray-800 mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                {pdf.title}
                              </CardTitle>
                            </div>
                          </div>
                        </div>
                        {pdf.description && (
                          <CardDescription className="mt-2 line-clamp-2 text-sm">
                            {pdf.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-2 mb-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${pdf.isActive
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-600'
                            }`}>
                            <Power className={`h-3 w-3 mr-1 ${pdf.isActive ? 'text-white' : 'text-gray-500'}`} />
                            {pdf.isActive ? 'Aktif' : 'Pasif'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1.5 mb-4 pb-4 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Yükleyen:</span>
                            <span className="font-semibold text-gray-700">{pdf.uploadedBy.username}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Tarih:</span>
                            <span className="font-semibold text-gray-700">{formatDate(pdf.createdAt)}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => window.open(pdf.driveLink, '_blank')}
                          disabled={!pdf.isActive}
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {pdf.isActive ? 'Drive\'a Git' : 'Pasif'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                  <CardContent className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-6">
                      <FileText className="h-10 w-10 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Henüz belge eklenmemiş</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                      Yönetim kurulu için henüz belge paylaşılmamış. Yöneticiler belge ekleyebilir.
                    </p>
                    {isAdmin && (
                      <Button
                        onClick={() => router.push('/dashboard/part10')}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/50"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        İlk Belge'yi Ekle
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

