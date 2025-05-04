'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateNotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get('studentId');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast.error('Öğrenci ID\'si bulunamadı');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, content }),
      });

      if (!response.ok) throw new Error('Failed to create note');
      
      toast.success('Not başarıyla eklendi');
      router.push(`/tutor/students/${studentId}`);
    } catch (error) {
      toast.error('Not eklenirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Button 
        variant="ghost" 
        className="flex items-center text-gray-500 hover:text-gray-700 -ml-3"
        onClick={() => router.back()}
      >
        <ChevronLeft className="h-5 w-5 mr-1" />
        <span>Geri Dön</span>
      </Button>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Yeni Not Ekle</CardTitle>
            <CardDescription>
              Öğrenci için yeni bir not ekleyin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="content" className="text-sm font-medium">
                  Not İçeriği
                </label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Not içeriğini buraya yazın..."
                  className="min-h-[200px]"
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 