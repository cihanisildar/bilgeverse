'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Plus, FileText } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/app/hooks/use-toast';

type Report = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tutor: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
};

export default function ViewReportsPage() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get('studentId');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      toast.error('Öğrenci ID\'si bulunamadı');
      return;
    }
    fetchReports();
  }, [studentId]);

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/reports?studentId=${studentId}`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      setReports(data.reports);
    } catch (error) {
      toast.error('Raporlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <Button 
          variant="ghost" 
          className="flex items-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200 -ml-3"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          <span>Geri Dön</span>
        </Button>

        <Link href={`/dashboard/part7/tutor/reports/create?studentId=${studentId}`}>
          <Button className="text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Rapor
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg border-0 ring-1 ring-black/5">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50/50 border-b border-gray-100">
          <CardTitle className="text-2xl font-semibold text-gray-800">Öğrenci Raporları</CardTitle>
          <CardDescription className="text-gray-600">
            Öğrenci için oluşturulmuş tüm raporlar
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-8">
            {reports.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-50/50 rounded-lg">
                <div className="flex flex-col items-center gap-3">
                  <FileText className="h-12 w-12 text-gray-400" />
                  <p>Henüz rapor oluşturulmamış.</p>
                </div>
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="group relative border border-gray-100 rounded-lg p-6 hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-purple-50/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-indigo-700 transition-colors duration-200">
                        {report.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(report.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                        {report.tutor.firstName?.[0]}{report.tutor.lastName?.[0]}
                      </div>
                      <span className="text-sm text-gray-600">
                        {report.tutor.firstName} {report.tutor.lastName}
                      </span>
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {report.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 