'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Plus, FileText } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/app/hooks/use-toast';

type Note = {
  id: string;
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

export default function ViewNotesPage() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get('studentId');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      toast.error('Öğrenci ID\'si bulunamadı');
      return;
    }
    fetchNotes();
  }, [studentId]);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/notes?studentId=${studentId}`);
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();
      setNotes(data.notes);
    } catch (error) {
      toast.error('Notlar yüklenirken bir hata oluştu');
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
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <Button 
          variant="ghost" 
          className="flex items-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200 -ml-3"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          <span>Geri Dön</span>
        </Button>

        <Link href={`/dashboard/part7/tutor/notes/create?studentId=${studentId}`}>
          <Button className="text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Not
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg border-0 ring-1 ring-black/5">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-2xl font-semibold text-gray-800">Öğrenci Notları</CardTitle>
          <CardDescription className="text-gray-600">
            Öğrenci için kaydedilmiş tüm notlar
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-8">
            {notes.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-50/50 rounded-lg">
                <div className="flex flex-col items-center gap-3">
                  <FileText className="h-12 w-12 text-gray-400" />
                  <p>Henüz not eklenmemiş.</p>
                </div>
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="border-b border-gray-100 last:border-0 pb-8 last:pb-0 hover:bg-gray-50/50 transition-colors duration-200 -mx-6 px-6"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                        {note.tutor.firstName?.[0]}{note.tutor.lastName?.[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {note.tutor.firstName} {note.tutor.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(note.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {note.content}
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