'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import toast from 'react-hot-toast';

type Wish = {
  id: string;
  studentId: string;
  title: string;
  description: string;
  createdAt: string;
};

export default function StudentWishes() {
  const { user } = useAuth();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  // Fetch wishes on component mount
  useEffect(() => {
    fetchWishes();
  }, []);

  const fetchWishes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wishes');
      if (!response.ok) throw new Error('Failed to fetch wishes');
      const data = await response.json();
      setWishes(data.wishes);
    } catch (error) {
      toast.error('İstekleriniz yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/wishes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to submit wish');

      toast.success('İsteğiniz başarıyla gönderildi');
      setFormData({ title: '', description: '' });
      fetchWishes(); // Refresh the list
    } catch (error) {
      toast.error('İstek gönderilirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 bg-gray-200 rounded-md"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 space-y-4">
                  <div className="h-6 w-3/4 bg-gray-200 rounded-md"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded-md"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            İstek ve Dileklerim
          </h1>
          <p className="mt-2 text-gray-600">
            Yöneticilere iletmek istediğiniz istek ve dileklerinizi buradan gönderebilirsiniz.
          </p>
        </div>

        {/* Submit Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Yeni İstek/Dilek Gönder</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Başlık
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="İsteğinizin kısa başlığı"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={4}
                placeholder="İsteğinizi detaylı bir şekilde açıklayın"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className={`w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-6 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Gönder
                </>
              )}
            </button>
          </form>
        </div>

        {/* Wishes List */}
        <div className="space-y-4">
          {wishes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
              Henüz bir istek/dilek göndermediniz.
            </div>
          ) : (
            wishes.map((wish) => (
              <div key={wish.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{wish.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {new Date(wish.createdAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <p className="mt-4 text-gray-700">{wish.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 