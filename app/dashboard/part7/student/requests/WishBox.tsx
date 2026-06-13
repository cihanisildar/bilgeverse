'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquarePlus, Sparkles, Clock, CheckCircle2, X } from 'lucide-react';

type Wish = {
  id: string;
  studentId: string;
  title: string;
  description: string;
  response?: string;
  respondedAt?: string;
  createdAt: string;
};

export default function WishBox() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const previousWishesRef = useRef<Wish[]>([]);

  useEffect(() => {
    fetchWishes();
  }, []);

  // Notify when a wish gets a new response
  useEffect(() => {
    if (wishes.length > 0 && previousWishesRef.current.length > 0) {
      const newResponses = wishes.filter((wish) => {
        const prev = previousWishesRef.current.find((pw) => pw.id === wish.id);
        return wish.response && (!prev || !prev.response);
      });

      newResponses.forEach((wish) => {
        toast.success(`"${wish.title}" isteğinize yanıt geldi!`, {
          duration: 6000,
          icon: '🎉',
          style: { background: '#10b981', color: '#ffffff' },
        });
      });
    }
    previousWishesRef.current = wishes;
  }, [wishes]);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to submit wish');

      toast.success('İsteğiniz başarıyla gönderildi');
      setFormData({ title: '', description: '' });
      setShowCreateDialog(false);
      fetchWishes();
    } catch (error) {
      toast.error('İstek gönderilirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const respondedWishes = wishes.filter((w) => w.response);
  const pendingWishes = wishes.filter((w) => !w.response);

  return (
    <div className="mt-12">
      {/* Section header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-6 sm:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl flex-shrink-0">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Dilek ve İstek Kutusu</h2>
                <p className="text-white/80 text-sm mt-0.5 max-w-xl">
                  Yönetime doğrudan iletmek istediğiniz dilek ve istekleri buradan gönderin
                  (ör. mağazaya yeni bir ürün eklenmesi, bir konuya Bilge Para verilmesi).
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-purple-700 font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 flex-shrink-0"
            >
              <MessageSquarePlus className="h-5 w-5" />
              Yeni İstek Gönder
            </button>
          </div>

          {/* Stats */}
          {!loading && wishes.length > 0 && (
            <div className="flex gap-3 mt-5">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
                <span className="text-white font-bold text-lg">{wishes.length}</span>
                <span className="text-white/80 text-xs ml-1.5">Toplam</span>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
                <span className="text-amber-200 font-bold text-lg">{pendingWishes.length}</span>
                <span className="text-white/80 text-xs ml-1.5">Bekleyen</span>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
                <span className="text-emerald-200 font-bold text-lg">{respondedWishes.length}</span>
                <span className="text-white/80 text-xs ml-1.5">Yanıtlandı</span>
              </div>
            </div>
          )}
        </div>

        {/* List */}
        <div className="p-6 sm:p-8">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-6 w-48 rounded-md" />
                  <Skeleton className="h-20 w-full rounded-2xl" />
                </div>
              ))}
            </div>
          ) : wishes.length === 0 ? (
            <div className="text-center py-10">
              <div className="bg-gray-100 p-4 rounded-full inline-flex mb-4">
                <MessageSquarePlus className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">Henüz istek göndermediniz</h3>
              <p className="text-gray-500 max-w-md mx-auto text-sm">
                Yönetime iletmek istediğiniz ilk dileğinizi göndermek için
                "Yeni İstek Gönder" butonunu kullanabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {wishes.map((wish) => (
                <div
                  key={wish.id}
                  className="bg-gray-50/70 rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
                      {wish.title}
                    </h3>
                    {wish.response ? (
                      <div className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Yanıtlandı
                      </div>
                    ) : (
                      <div className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        Beklemede
                      </div>
                    )}
                  </div>
                  <div className="bg-white rounded-xl p-4 border-l-4 border-purple-400">
                    <p className="text-gray-700 leading-relaxed text-sm">{wish.description}</p>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(wish.createdAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>

                  {wish.response && (
                    <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                      <h4 className="text-sm font-semibold text-green-800 flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Yönetici Yanıtı
                      </h4>
                      <div className="bg-white rounded-lg p-3 border border-green-100">
                        <p className="text-gray-700 text-sm leading-relaxed">{wish.response}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                  <MessageSquarePlus className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Yeni Dilek ve İstek</h3>
              </div>
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setFormData({ title: '', description: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="wish-title" className="block text-sm font-semibold text-gray-700 mb-2">
                  Başlık
                </label>
                <input
                  type="text"
                  id="wish-title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 focus:bg-white transition-all duration-200"
                  placeholder="İsteğinizin kısa ve açıklayıcı başlığı"
                  required
                />
              </div>

              <div>
                <label htmlFor="wish-description" className="block text-sm font-semibold text-gray-700 mb-2">
                  Detaylı Açıklama
                </label>
                <textarea
                  id="wish-description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 focus:bg-white transition-all duration-200 resize-none"
                  rows={5}
                  placeholder="İsteğinizi mümkün olduğunca detaylı açıklayın (ör. hangi ürün, neden)..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setFormData({ title: '', description: '' });
                  }}
                  disabled={submitting}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg flex items-center gap-2 ${
                    submitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
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
                      <MessageSquarePlus className="h-5 w-5" />
                      İsteği Gönder
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
