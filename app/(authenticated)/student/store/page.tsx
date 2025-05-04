'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { Skeleton } from "@/components/ui/skeleton";
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type StoreItem = {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  availableQuantity: number;
  imageUrl?: string;
};

export default function StudentStore() {
  const { user, isStudent } = useAuth();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestInProgress, setRequestInProgress] = useState(false);
  const [requestNote, setRequestNote] = useState('');
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [useFallback, setUseFallback] = useState(false);

  // Mock data to use as fallback
  const MOCK_ITEMS: StoreItem[] = [
    {
      id: 'mock-1',
      name: 'Sample Item 1',
      description: 'This is a placeholder item shown when the server is unavailable.',
      pointsRequired: 100,
      availableQuantity: 5,
      imageUrl: 'https://via.placeholder.com/300'
    },
    {
      id: 'mock-2',
      name: 'Sample Item 2',
      description: 'Server connection issues occurred. These are example items only.',
      pointsRequired: 200,
      availableQuantity: 3
    }
  ];

  useEffect(() => {
    const fetchStoreItems = async () => {
      try {
        setLoading(true);
        setError('');
        setUseFallback(false);
        
        // Add cache-busting and timeout
        const res = await fetch(`/api/store?t=${new Date().getTime()}`, {
          signal: AbortSignal.timeout(15000),
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        // Handle database connectivity issues
        if (res.status === 503) {
          console.error('Database connection issue detected');
          setUseFallback(true);
          setItems(MOCK_ITEMS);
          setError('Veritabanı bağlantı sorunu. Örnek veriler gösteriliyor.');
          setLoading(false);
          return;
        }
        
        // Handle server errors
        if (res.status >= 500) {
          console.error(`Server error: ${res.status}`);
          setUseFallback(true);
          setItems(MOCK_ITEMS);
          setError(`Sunucu şu anda kullanılamıyor. Örnek veriler gösteriliyor. (${res.status}).`);
          setLoading(false);
          return;
        }
        
        if (!res.ok) {
          const errorData = await res.json();
          if (errorData.error === 'No tutor assigned') {
            setError('Henüz size atanmış bir öğretmen bulunmamaktadır. Lütfen yöneticinizle iletişime geçin.');
            setItems([]);
            setLoading(false);
            return;
          }
          throw new Error(`Failed to fetch store items: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        
        if (!data || !data.items) {
          setItems([]);
        } else {
          setItems(data.items);
        }
      } catch (err: any) {
        console.error('Error fetching store items:', err);
        
        // Handle timeout specially
        if (err.name === 'AbortError' || err.name === 'TimeoutError') {
          setUseFallback(true);
          setItems(MOCK_ITEMS);
          setError('Sunucu bağlantı zaman aşımı. Örnek veriler gösteriliyor.');
        } else {
          setError(`${err.message || 'Failed to load store items. Please try again.'}`);
          
          // For critical errors, use fallback data
          if (err.message.includes('MongoDB') || 
              err.message.includes('database') ||
              err.message.includes('connection') ||
              err.message.includes('Server error')) {
            setUseFallback(true);
            setItems(MOCK_ITEMS);
            setError('Veritabanı veya sunucu sorunu. Örnek veriler gösteriliyor.');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    if (isStudent) {
      fetchStoreItems();
    }
  }, [isStudent]);

  const openRequestModal = (item: StoreItem) => {
    setSelectedItem(item);
    setRequestNote('');
    setShowRequestModal(true);
  };

  const closeModal = () => {
    setShowRequestModal(false);
    setSelectedItem(null);
    setRequestNote('');
  };

  const handleRequestSubmit = async () => {
    if (!selectedItem) return;
    
    try {
      setRequestInProgress(true);
      
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: selectedItem.id,
          note: requestNote,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit request');
      }
      
      setSuccessMessage(`Talebiniz ${selectedItem.name} başarıyla gönderildi!`);
      closeModal();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err: any) {
      console.error('Error submitting request:', err);
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setRequestInProgress(false);
    }
  };

  const canAfford = (item: StoreItem) => {
    return (user?.points || 0) >= item.pointsRequired;
  };

  if (loading) {
    return <LoadingStore error={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Öğrenci Mağazası
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Puanlarınızı harika ödüllerle değerlendirin!</p>
          </div>
          <Link
            href="/student/requests"
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 sm:py-2.5 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <span>İsteklerim</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
        
        <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Puanlarınız</h2>
              <div className="mt-1 sm:mt-2 flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {user?.points || 0}
                </span>
                <span className="text-sm sm:text-base text-gray-500 font-medium">puan mevcut</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="p-2 sm:p-3 bg-indigo-50 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm sm:text-base text-gray-600 bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-100">
            Mağazadan ürün talep etmek için puanlarınızı kullanabilirsiniz. Tüm talepler öğretmeniniz tarafından onaylanmalıdır.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 sm:px-6 py-3 sm:py-4 rounded-xl mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 sm:px-6 py-3 sm:py-4 rounded-xl mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMessage}
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {items.map((item) => (
            <StoreItemCard
              key={item.id}
              item={item}
              canAfford={canAfford(item)}
              isMock={useFallback}
              onRequest={openRequestModal}
            />
          ))}
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-lg w-full mx-3 sm:mx-4">
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Ürün Talebi</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              <span className="font-medium text-gray-900">{selectedItem.name}</span> için talep oluşturmak üzeresiniz.
              Bu işlem <span className="font-medium text-gray-900">{selectedItem.pointsRequired}</span> puan gerektirir.
            </p>
            
            <div className="mb-4 sm:mb-6">
              <label htmlFor="note" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
                Not (İsteğe bağlı)
              </label>
              <textarea
                id="note"
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder="Öğretmeninize iletmek istediğiniz bir not..."
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={closeModal}
                className="w-full sm:w-auto order-2 sm:order-1 px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleRequestSubmit}
                disabled={requestInProgress}
                className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {requestInProgress ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>İşleniyor...</span>
                  </>
                ) : (
                  'Talebi Gönder'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// StoreItemCard component
function StoreItemCard({ 
  item, 
  canAfford, 
  isMock = false,
  onRequest 
}: { 
  item: StoreItem, 
  canAfford: boolean, 
  isMock?: boolean,
  onRequest: (item: StoreItem) => void 
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden group">
      <div className="aspect-[4/3] relative bg-gray-100">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-start gap-4 mb-2 sm:mb-3">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2">{item.name}</h3>
          <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
            {item.pointsRequired} Puan
          </span>
        </div>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 line-clamp-3">{item.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm text-gray-500">
            {item.availableQuantity} adet mevcut
          </span>
          <button
            onClick={() => onRequest(item)}
            disabled={!canAfford}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${
              canAfford
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {canAfford ? 'Talep Et' : 'Yetersiz Puan'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingStore({ error }: { error?: string | null }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <div className="space-y-2 w-full sm:w-auto">
            <Skeleton className="h-8 sm:h-10 w-48 sm:w-64" />
            <Skeleton className="h-4 sm:h-5 w-64 sm:w-80" />
          </div>
          <Skeleton className="h-10 sm:h-12 w-full sm:w-32" />
        </div>

        {/* Points card skeleton */}
        <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-2 w-full sm:w-auto">
              <Skeleton className="h-6 sm:h-8 w-32 sm:w-40" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 sm:h-8 w-16 sm:w-20" />
                <Skeleton className="h-5 sm:h-6 w-24 sm:w-32" />
              </div>
            </div>
            <Skeleton className="h-12 sm:h-14 w-12 sm:w-14 rounded-xl" />
          </div>
          <Skeleton className="h-16 sm:h-20 w-full mt-4" />
        </div>

        {/* Store items grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <Skeleton className="h-40 sm:h-48 w-full" />
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <Skeleton className="h-6 sm:h-7 w-32 sm:w-40" />
                  <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 sm:h-6 w-20 sm:w-24 rounded-full" />
                  <Skeleton className="h-8 sm:h-10 w-24 sm:w-28 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}