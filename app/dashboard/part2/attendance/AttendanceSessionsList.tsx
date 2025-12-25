'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, QrCode, CheckCircle2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

type Session = {
  id: string;
  title: string;
  description: string | null;
  sessionDate: string;
  status: string;
  qrCodeToken: string | null;
  attendances: any[];
};

type AttendanceSessionsListProps = {
  sessions: Session[];
  hasStudents: boolean;
};

const ITEMS_PER_PAGE = 9;

export default function AttendanceSessionsList({ sessions, hasStudents }: AttendanceSessionsListProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PLANNED':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Tamamlandı';
      case 'ACTIVE':
        return 'Aktif';
      case 'PLANNED':
        return 'Planlandı';
      case 'CANCELLED':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(sessions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentSessions = sessions.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <>
      {sessions && sessions.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
            {currentSessions.map((session) => (
              <Card
                key={session.id}
                className="group border-0 shadow-md rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white cursor-pointer"
                onClick={() => router.push(`/dashboard/part2/attendance/${session.id}`)}
              >
                <div className="h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold text-gray-800 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {session.title}
                      </CardTitle>
                      <div className="flex items-center text-sm text-gray-500 mt-2">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(session.sessionDate)}
                      </div>
                    </div>
                  </div>
                  {session.description && (
                    <CardDescription className="mt-2 line-clamp-2 text-sm">
                      {session.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(session.status)}`}>
                      {getStatusText(session.status)}
                    </span>
                    {session.qrCodeToken && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                        <QrCode className="h-3 w-3 mr-1" />
                        QR Aktif
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-1" />
                      <span className="font-semibold">{session.attendances?.length || 0}</span>
                      <span className="ml-1">Katılımcı</span>
                    </div>
                    {session.attendances && session.attendances.length > 0 && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Giriş Yapıldı
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevious}
                disabled={currentPage === 1}
                className="h-9 w-9 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page as number)}
                      className={`h-9 w-9 p-0 ${currentPage === page
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'hover:bg-blue-50'
                        }`}
                    >
                      {page}
                    </Button>
                  )
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                disabled={currentPage === totalPages}
                className="h-9 w-9 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <span className="text-sm text-gray-600 ml-4">
                Sayfa {currentPage} / {totalPages}
              </span>
            </div>
          )}
        </>
      ) : (
        <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
          <CardContent className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 mb-6">
              <Calendar className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Henüz yoklama oluşturulmamış</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              {hasStudents
                ? 'Haftalık devam takibi için yeni bir yoklama oturumu oluşturun.'
                : 'Bir sınıfınız olduğunda yoklama oturumları oluşturabileceksiniz.'}
            </p>
            {hasStudents && (
              <Button
                onClick={() => router.push('/dashboard/part2/attendance/new')}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/50"
              >
                <Plus className="h-4 w-4 mr-2" />
                İlk Yoklamayı Oluştur
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
