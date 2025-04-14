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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Öğrenci Mağazası
            </h1>
            <p className="mt-2 text-gray-600">Puanlarınızı harika ödüllerle değerlendirin!</p>
          </div>
          <Link
            href="/student/requests"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 px-6 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <span>İsteklerim</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
        
        <div className="bg-white shadow-lg rounded-2xl p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Puanlarınız</h2>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {user?.points || 0}
                </span>
                <span className="text-gray-500 font-medium">puan mevcut</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          <p className="mt-4 text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
            Mağazadan ürün talep etmek için puanlarınızı kullanabilirsiniz. Tüm talepler öğretmeniniz tarafından onaylanmalıdır.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error.includes('Database connection issue') ? 'Veritabanı bağlantı sorunu. Örnek veriler gösteriliyor.' :
             error.includes('Server currently unavailable') ? 'Sunucu şu anda kullanılamıyor. Örnek veriler gösteriliyor.' :
             error.includes('Server connection timed out') ? 'Sunucu bağlantı zaman aşımı. Örnek veriler gösteriliyor.' :
             error.includes('Database or server issue') ? 'Veritabanı veya sunucu sorunu. Örnek veriler gösteriliyor.' :
             error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-8 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMessage.includes('has been submitted successfully') 
              ? successMessage.replace('Your request for', 'Talebiniz').replace('has been submitted successfully', 'başarıyla gönderildi!')
              : successMessage}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
            <h3 className="text-2xl font-bold mb-4">Ürün Talebi</h3>
            <p className="text-gray-600 mb-6">
              <span className="font-medium text-gray-900">{selectedItem.name}</span> için talep oluşturmak üzeresiniz.
              Bu işlem <span className="font-medium text-gray-900">{selectedItem.pointsRequired}</span> puan gerektirir.
            </p>
            
            <div className="mb-6">
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                Not (İsteğe bağlı)
              </label>
              <textarea
                id="note"
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder="Öğretmeninize iletmek istediğiniz bir not..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleRequestSubmit}
                disabled={requestInProgress}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {requestInProgress ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start gap-4 mb-3">
          <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
          <div className="flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold text-indigo-600">{item.pointsRequired}</span>
          </div>
        </div>
        <p className="text-gray-600 mb-4">{item.description}</p>
        <div className="flex items-center justify-between">
          <div className={`text-sm font-medium px-3 py-1 rounded-full ${
            isMock 
              ? 'bg-yellow-50 text-yellow-700'
              : item.availableQuantity > 0 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {item.availableQuantity > 0 
              ? `${item.availableQuantity} adet mevcut` 
              : 'Stokta yok'}
          </div>
          
          <button
            onClick={() => onRequest(item)}
            disabled={item.availableQuantity <= 0 || !canAfford || isMock}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-all
              ${item.availableQuantity > 0 && canAfford && !isMock
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg'
                : 'bg-gray-300 cursor-not-allowed'}`}
          >
            {isMock
              ? 'Örnek Ürün'
              : !canAfford
              ? 'Yetersiz Puan'
              : item.availableQuantity <= 0
                ? 'Stokta Yok'
                : 'Talep Et'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingStore({ error }: { error?: string | null }) {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Points card skeleton */}
      <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
          <Skeleton className="h-14 w-14 rounded-xl" />
        </div>
        <Skeleton className="h-20 w-full mt-4" />
      </div>

      {/* Store items grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <div className="p-6">
              <div className="flex justify-between items-start gap-4 mb-3">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-10 w-28 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}