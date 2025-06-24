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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="text-center space-y-4">
              <div className="h-10 w-80 bg-gray-200 rounded-lg mx-auto"></div>
              <div className="h-6 w-96 bg-gray-200 rounded-md mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8 space-y-6">
                <div className="h-8 w-64 bg-gray-200 rounded-lg"></div>
                <div className="space-y-4">
                  <div className="h-12 bg-gray-200 rounded-xl"></div>
                  <div className="h-32 bg-gray-200 rounded-xl"></div>
                  <div className="h-12 w-32 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6 space-y-4">
                    <div className="h-6 w-3/4 bg-gray-200 rounded-lg"></div>
                    <div className="h-4 w-1/2 bg-gray-200 rounded-md"></div>
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            İstek ve Dileklerim
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Yöneticilere iletmek istediğiniz istek ve dileklerinizi buradan gönderebilir, 
            tüm taleplerinizi kolayca takip edebilirsiniz.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Submit Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-xl">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Yeni İstek Gönder</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="group">
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Başlık
                  </div>
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 focus:bg-white transition-all duration-200"
                  placeholder="İsteğinizin kısa ve açıklayıcı başlığı"
                  required
                />
              </div>
              
              <div className="group">
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    Detaylı Açıklama
                  </div>
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 focus:bg-white transition-all duration-200 resize-none"
                  rows={5}
                  placeholder="İsteğinizi mümkün olduğunca detaylı bir şekilde açıklayın..."
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={submitting}
                className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3 ${submitting ? 'opacity-70 cursor-not-allowed transform-none' : ''}`}
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
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    İsteği Gönder
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Wishes List */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-2 rounded-xl">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Gönderilen İstekler</h2>
              <div className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                {wishes.length}
              </div>
            </div>

            {wishes.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-12 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-gray-100 p-4 rounded-full">
                    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Henüz İstek Göndermediniz</h3>
                    <p className="text-gray-500 max-w-md">
                      İlk isteğinizi göndermek için sol taraftaki formu kullanabilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                {wishes.map((wish, index) => (
                  <div 
                    key={wish.id} 
                    className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 p-6 group animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity">
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
                            {wish.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 12v-12m-4 4h8" />
                            </svg>
                            {new Date(wish.createdAt).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">
                        Beklemede
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-purple-400">
                      <p className="text-gray-700 leading-relaxed">{wish.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
} 