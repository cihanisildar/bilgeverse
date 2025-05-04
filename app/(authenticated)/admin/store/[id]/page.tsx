'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import Image from 'next/image';
import toast from 'react-hot-toast';

type StoreItem = {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  availableQuantity: number;
  imageUrl?: string;
  tutor: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
};

export default function EditStoreItem({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [item, setItem] = useState<StoreItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/store/${params.id}`);
        
        if (!res.ok) {
          if (res.status === 403) {
            toast.error('Yetkiniz yok');
            return;
          }
          const errorData = await res.json();
          throw new Error(errorData.error || 'Ürün yüklenemedi');
        }
        
        const data = await res.json();
        setItem(data.item);
      } catch (err) {
        console.error('Ürün getirme hatası:', err);
        toast.error('Ürün yüklenemedi. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchItem();
    }
  }, [isAdmin, params.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!item) return;
    
    const { name, value } = e.target;
    
    if (name === 'imageUrl') {
      setImageError(false);
      setIsImageLoading(true);
    }
    
    setItem({
      ...item,
      [name]: name === 'pointsRequired' || name === 'availableQuantity'
        ? parseInt(value) || 0
        : value
    });
  };

  const handleImageError = () => {
    setImageError(true);
    setIsImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageError(false);
    setIsImageLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    
    const toastId = toast.loading('Değişiklikler kaydediliyor...');
    
    try {
      setSaving(true);
      
      // Validate inputs
      if (!item.name.trim()) {
        throw new Error('Ürün adı zorunludur');
      }
      
      if (!item.description.trim()) {
        throw new Error('Ürün açıklaması zorunludur');
      }
      
      if (item.pointsRequired <= 0) {
        throw new Error('Gerekli puan sıfırdan büyük olmalıdır');
      }
      
      if (item.availableQuantity < 0) {
        throw new Error('Mevcut miktar negatif olamaz');
      }
      
      const res = await fetch(`/api/admin/store/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: item.name,
          description: item.description,
          pointsRequired: item.pointsRequired,
          availableQuantity: item.availableQuantity,
          imageUrl: item.imageUrl
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Ürün güncellenemedi');
      }
      
      toast.success('Ürün başarıyla güncellendi!', { id: toastId });
      
      // Redirect after 1 second
      setTimeout(() => {
        router.push('/admin/store');
      }, 1000);
    } catch (err: any) {
      console.error('Ürün güncelleme hatası:', err);
      toast.error(err.message || 'Ürün güncellenemedi. Lütfen tekrar deneyin.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Ürün bulunamadı</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-3 sm:p-4 border-b border-gray-100">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold leading-6 text-gray-900">
                Ürün Düzenle
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                {item.tutor.firstName && item.tutor.lastName 
                  ? `${item.tutor.firstName} ${item.tutor.lastName}`
                  : item.tutor.username} öğretmeninin mağaza ürünü
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Ürün Adı *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={item.name}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded py-1.5 px-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Açıklama *
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={item.description}
                onChange={handleInputChange}
                className="block w-full border border-gray-300 rounded py-1.5 px-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label htmlFor="pointsRequired" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Gerekli Puan *
                </label>
                <input
                  type="number"
                  name="pointsRequired"
                  id="pointsRequired"
                  min="1"
                  value={item.pointsRequired}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded py-1.5 px-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="availableQuantity" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Mevcut Miktar *
                </label>
                <input
                  type="number"
                  name="availableQuantity"
                  id="availableQuantity"
                  min="0"
                  value={item.availableQuantity}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded py-1.5 px-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="imageUrl" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Görsel URL (İsteğe Bağlı)
              </label>
              <input
                type="url"
                name="imageUrl"
                id="imageUrl"
                value={item.imageUrl || ''}
                onChange={handleInputChange}
                className={`block w-full border rounded py-1.5 px-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  imageError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              
              {item.imageUrl && (
                <div className="mt-2 relative rounded overflow-hidden border border-gray-200">
                  {isImageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
                    </div>
                  )}
                  <div className="relative aspect-[3/2] w-full">
                    <Image
                      src={item.imageUrl}
                      alt="Ürün önizleme"
                      fill
                      className="object-cover"
                      onError={handleImageError}
                      onLoad={handleImageLoad}
                    />
                  </div>
                  {imageError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-90">
                      <div className="text-center text-red-500 p-3">
                        <svg className="mx-auto h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="mt-1 text-xs">Görsel yüklenemedi. Lütfen URL'yi kontrol edin.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => router.push('/admin/store')}
                className="w-full sm:w-auto inline-flex justify-center items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`w-full sm:w-auto inline-flex justify-center items-center px-3 py-1.5 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  saving ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Kaydediliyor...
                  </>
                ) : (
                  'Değişiklikleri Kaydet'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 