'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { Skeleton } from "@/components/ui/skeleton";
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Star, 
  Sparkles, 
  TrendingUp, 
  Gift, 
  Zap,
  Heart,
  Crown,
  X,
  ChevronRight
} from 'lucide-react';

type StoreItem = {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  imageUrl?: string;
};

export default function StudentStore() {
  const { user, isStudent, checkAuth } = useAuth();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestInProgress, setRequestInProgress] = useState(false);
  const [requestNote, setRequestNote] = useState('');
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const fetchStoreItems = async () => {
      // Wait for authentication to stabilize
      if (!user && !hasInitialized) {
        return;
      }
      
      // Set initialized flag
      if (!hasInitialized) {
        setHasInitialized(true);
      }
      
      // If not a student, don't fetch data but stop loading
      if (!user || !isStudent) {
        setLoading(false);
        return;
      }
      
      // Fetch fresh user data to ensure points are up to date
      await checkAuth();
      
      try {
        setLoading(true);
        setError('');
        
        const res = await fetch(`/api/store?t=${new Date().getTime()}`, {
          signal: AbortSignal.timeout(15000),
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'  
          }
        });
        
        if (res.status === 503) {
          console.error('Database connection issue detected');
          setError('Veritabanı bağlantı sorunu. Lütfen daha sonra tekrar deneyin.');
          return;
        }
        
        if (res.status >= 500) {
          console.error(`Server error: ${res.status}`);
          setError(`Sunucu şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin. (${res.status})`);
          return;
        }
        
        if (!res.ok) {
          throw new Error(`Failed to fetch store items: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        
        if (!data || !data.items) {
          setItems([]);
        } else {
          setItems(data.items || []);
        }
      } catch (err: any) {
        console.error('Error fetching store items:', err);
        
        if (err.name === 'AbortError' || err.name === 'TimeoutError') {
          setError('Sunucu bağlantı zaman aşımı. Lütfen daha sonra tekrar deneyin.');
        } else {
          setError('Mağaza yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStoreItems();
  }, [user?.id, isStudent, hasInitialized]);

  const openDetailsModal = (item: StoreItem) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const openRequestModal = (item: StoreItem) => {
    setSelectedItem(item);
    setRequestNote('');
    setShowRequestModal(true);
  };

  const closeModal = () => {
    setShowRequestModal(false);
    setShowDetailsModal(false);
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
      
      // Refresh user data to update points after successful request
      await checkAuth();
      
      setSuccessMessage(`🎉 Harika! ${selectedItem.name} talebiniz başarıyla gönderildi!`);
      closeModal();
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err: any) {
      console.error('Error submitting request:', err);
      setError(err.message || 'Talep gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setRequestInProgress(false);
    }
  };

  const canAfford = (item: StoreItem) => {
    return (user?.points || 0) >= item.pointsRequired;
  };

  // Don't render anything until authentication is initialized
  if (!hasInitialized && !user) {
    return <LoadingStore />;
  }

  // Show loading while fetching data
  if (loading) {
    return <LoadingStore />;
  }

  // If not a student, show unauthorized message
  if (!isStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-3xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Yetkisiz Erişim</h1>
          <p className="text-slate-600">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/30 via-slate-50/20 to-transparent"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-200/15 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/70 backdrop-blur-sm border border-blue-200/50 rounded-full text-slate-700 text-sm font-medium shadow-sm">
              <ShoppingBag className="h-4 w-4 text-blue-500" />
              <span>Ödül Mağazası</span>
              <Gift className="h-4 w-4 text-indigo-500" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-800 leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                Hayallerinizdeki
              </span>
              <br />
              <span className="text-slate-700">Ödüller</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Çalışmanızın karşılığını alın! Topladığınız puanlarla harika ödüllere sahip olun. 
              Her başarınız değerli bir hediyeye dönüşür! ✨
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/student/requests"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-indigo-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
              >
                <Heart className="h-5 w-5" />
                <span>Taleplerim</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
          
          {/* Points Card */}
          <div className="relative">
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border border-blue-200/50 rounded-3xl shadow-xl"></div>
            <div className="relative z-10 p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200/50 rounded-2xl shadow-sm">
                    <Crown className="h-12 w-12 text-amber-600" />
                  </div>
                  <div className="text-center lg:text-left">
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                      <span>Puanlarınız</span>
                      <Sparkles className="h-6 w-6 text-amber-500" />
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                        {user?.points || 0}
                      </span>
                      <span className="text-xl text-slate-600 font-semibold">puan</span>
                    </div>
                    <p className="text-slate-500 mt-1">Başarılarınızın değeri</p>
                  </div>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl shadow-sm">
                  <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-slate-700 font-semibold">Ödül Bekliyor!</p>
                  <p className="text-slate-500 text-sm">Puanlarınızı kullanın</p>
                </div>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                className="mx-auto max-w-md"
              >
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl text-center shadow-sm">
                  <p className="text-green-700 font-semibold">{successMessage}</p>
                </div>
              </motion.div>
            )}
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                className="mx-auto max-w-md"
              >
                <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200/50 rounded-2xl text-center shadow-sm">
                  <p className="text-orange-700 font-medium">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Store Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {items.map((item, index) => (
              <StoreItemCard
                key={item.id}
                item={item}
                canAfford={canAfford(item)}
                onRequest={openRequestModal}
                onViewDetails={openDetailsModal}
                index={index}
              />
            ))}
          </div>

          {/* Empty State */}
          {!loading && items.length === 0 && !error && (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200/50 rounded-3xl flex items-center justify-center shadow-sm">
                <ShoppingBag className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Mağaza Hazırlanıyor</h3>
              <p className="text-slate-600">Yakında harika ödüller sizleri bekliyor!</p>
            </div>
          )}
        </div>
      </div>

      {/* Item Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedItem && (
          <ItemDetailsModal
            item={selectedItem}
            canAfford={canAfford(selectedItem)}
            onClose={closeModal}
            onRequest={() => {
              setShowDetailsModal(false);
              setShowRequestModal(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Request Modal */}
      <AnimatePresence>
        {showRequestModal && selectedItem && (
          <RequestModal
            item={selectedItem}
            requestNote={requestNote}
            setRequestNote={setRequestNote}
            requestInProgress={requestInProgress}
            onClose={closeModal}
            onSubmit={handleRequestSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// StoreItemCard component
function StoreItemCard({ 
  item, 
  canAfford, 
  onRequest,
  onViewDetails,
  index = 0
}: { 
  item: StoreItem, 
  canAfford: boolean, 
  onRequest: (item: StoreItem) => void,
  onViewDetails: (item: StoreItem) => void,
  index?: number
}) {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onClick={() => onViewDetails(item)}
      className="relative group cursor-pointer"
    >
      <div className="relative h-96 rounded-3xl overflow-hidden transition-transform duration-300 hover:scale-105">
        {/* Soft card background */}
        <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border border-slate-200/50 rounded-3xl shadow-lg"></div>
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/50 rounded-3xl"></div>
        
        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-xl group-hover:shadow-blue-500/10"></div>

        {/* Image section */}
        <div className="absolute top-0 left-0 right-0 h-48 rounded-t-2xl overflow-hidden">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              quality={100}
              unoptimized
              className="object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
              <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm">
                <Gift className="h-12 w-12 text-slate-600" />
              </div>
            </div>
          )}
          
          {/* Points badge */}
          <div className="absolute top-4 right-4">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1.5 rounded-full shadow-lg">
              <span className="text-sm font-bold text-white flex items-center gap-1">
                <Star className="h-3 w-3" />
                {item.pointsRequired}
              </span>
            </div>
          </div>
        </div>

        {/* Card content */}
        <div className="relative z-10 p-6 h-full flex flex-col pt-52">
          <div className="flex-1 flex flex-col justify-center text-center space-y-4">
            <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors duration-300">
              {item.name}
            </h3>
            
            <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Action button */}
          <div className="mt-6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequest(item);
              }}
              disabled={!canAfford}
              className={`w-full py-3 px-4 rounded-2xl font-semibold transition-all duration-300 ${
                canAfford
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 hover:shadow-lg transform hover:-translate-y-1 hover:shadow-blue-500/25'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              {canAfford ? (
                <span className="flex items-center justify-center gap-2">
                  <Heart className="h-4 w-4" />
                  Talep Et
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Zap className="h-4 w-4" />
                  Yetersiz Puan
                </span>
              )}
            </button>
          </div>

          {/* Hover instruction */}
          <div className="mt-3 flex items-center justify-center gap-2 text-blue-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span>Detaylar için tıklayın</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// RequestModal component
function RequestModal({
  item,
  requestNote,
  setRequestNote,
  requestInProgress,
  onClose,
  onSubmit
}: {
  item: StoreItem,
  requestNote: string,
  setRequestNote: (note: string) => void,
  requestInProgress: boolean,
  onClose: () => void,
  onSubmit: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        className="w-full max-w-lg relative"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Modal soft background */}
        <div className="absolute inset-0 bg-white/95 backdrop-blur-2xl border border-slate-200/50 rounded-3xl shadow-2xl"></div>
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/50 rounded-3xl"></div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-3 bg-slate-200/50 hover:bg-slate-200/70 backdrop-blur-sm border border-slate-300/50 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-slate-600" />
        </button>

        {/* Modal content */}
        <div className="relative z-10 p-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200/50 rounded-2xl shadow-sm">
                <Gift className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-bold text-slate-800">Ürün Talebi</h3>
                <p className="text-slate-600">Hayalinize ulaşın!</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <span className="font-bold text-slate-800 text-lg">{item.name}</span>
              </div>
              <p className="text-slate-600 mb-4">
                Bu harika ürün için talep oluşturmak üzeresiniz!
              </p>
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200/50 rounded-full shadow-sm">
                <Crown className="h-4 w-4 text-amber-600" />
                <span className="text-slate-800 font-bold">{item.pointsRequired} puan gerekiyor</span>
              </div>
            </div>
            
            <div className="text-left">
              <label htmlFor="note" className="block text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Heart className="h-4 w-4 text-blue-500" />
                Özel Notunuz (İsteğe bağlı)
              </label>
              <textarea
                id="note"
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                className="w-full px-4 py-3 text-slate-800 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-slate-400 resize-none shadow-sm"
                rows={3}
                placeholder="Öğretmeninize iletmek istediğiniz özel bir mesaj..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl font-semibold transition-all duration-200 shadow-sm"
              >
                İptal
              </button>
              <button
                onClick={onSubmit}
                disabled={requestInProgress}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-2xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {requestInProgress ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Talebi Gönder</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Item Details Modal Component
function ItemDetailsModal({ 
  item, 
  canAfford, 
  onClose, 
  onRequest 
}: { 
  item: StoreItem, 
  canAfford: boolean, 
  onClose: () => void,
  onRequest: () => void
}) {
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);

  const handleImageClick = () => {
    if (item.imageUrl) {
      setShowFullscreenImage(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-6xl w-full shadow-2xl border border-white/20 overflow-hidden">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-slate-200/50 bg-gradient-to-r from-cyan-50/50 to-emerald-50/50">
          <div className="flex justify-between items-start gap-6">
            <div className="flex-1 space-y-3">
              <h3 className="text-3xl sm:text-4xl font-black text-slate-800">{item.name}</h3>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-cyan-600 to-emerald-600 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                  {item.pointsRequired} Puan
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-slate-100 rounded-2xl transition-all duration-200 hover:rotate-90"
            >
              <X className="h-6 w-6 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row max-h-[70vh]">
          {/* Image Section */}
          <div className="lg:w-1/2 relative bg-gradient-to-br from-slate-50 to-slate-100 min-h-[300px] lg:min-h-[500px]">
            {item.imageUrl ? (
              <div 
                className="relative w-full h-full flex items-center justify-center cursor-pointer group p-6"
                onClick={handleImageClick}
              >
                <div className="relative max-w-full max-h-full">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={600}
                    height={600}
                    quality={100}
                    priority
                    unoptimized
                    className="max-w-full max-h-full object-contain transition-all duration-300 rounded-2xl shadow-lg group-hover:shadow-2xl group-hover:scale-105"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full p-6">
                <div className="p-8 bg-white/50 backdrop-blur-sm rounded-3xl">
                  <Gift className="h-24 w-24 text-slate-400" />
                </div>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="lg:w-1/2 p-6 sm:p-8 flex flex-col overflow-y-auto">
            <div className="flex-1 space-y-6">
              <div>
                <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-xl">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  Ürün Açıklaması
                </h4>
                <p className="text-slate-700 leading-relaxed text-lg">{item.description}</p>
              </div>
              
              <div className="bg-gradient-to-r from-cyan-50 to-emerald-50 rounded-2xl p-6 border border-cyan-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-xl">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold text-slate-700">Gerekli Puan:</span>
                  </div>
                  <span className="text-3xl font-black bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                    {item.pointsRequired}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-slate-200">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-4 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-2xl font-semibold transition-all duration-200 border border-slate-300"
              >
                Kapat
              </button>
              <button
                onClick={onRequest}
                disabled={!canAfford}
                className={`flex-1 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                  canAfford
                    ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white hover:from-cyan-700 hover:to-emerald-700 hover:shadow-lg transform hover:-translate-y-1'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {canAfford ? 'Talep Et' : 'Yetersiz Puan'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Fullscreen Image Modal */}
      {showFullscreenImage && item.imageUrl && (
        <FullscreenImageModal
          imageUrl={item.imageUrl}
          altText={item.name}
          onClose={() => setShowFullscreenImage(false)}
        />
      )}
    </div>
  );
}

// Fullscreen Image Modal Component
function FullscreenImageModal({ 
  imageUrl, 
  altText, 
  onClose 
}: { 
  imageUrl: string, 
  altText: string, 
  onClose: () => void 
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    const newZoomLevel = Math.max(0.5, Math.min(4, zoomLevel + delta));
    
    setZoomLevel(newZoomLevel);
    
    // Reset position when zooming out to normal size
    if (newZoomLevel <= 1) {
      setImagePosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[60] overflow-hidden"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all duration-200 hover:rotate-90 backdrop-blur-sm"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {/* Zoom level indicator */}
      <div className="absolute top-6 left-6 z-10 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-2xl text-white font-bold">
        {Math.round(zoomLevel * 100)}%
      </div>

      {/* Instructions */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-2xl text-white text-center font-medium">
        Mouse tekerleği ile yakınlaştırın/uzaklaştırın • Sürükleyerek kaydırın
      </div>

      {/* Image Container */}
      <div
        className="absolute inset-0 flex items-center justify-center p-8"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-center justify-center w-full h-full">
          <Image
            src={imageUrl}
            alt={altText}
            fill
            quality={100}
            priority
            unoptimized
            className="object-contain transition-transform duration-200"
            style={{
              transform: `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`,
              cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
          />
        </div>
      </div>
    </div>
  );
}

function LoadingStore() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-emerald-50">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Header skeleton */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-4">
            <Skeleton className="h-16 w-80 rounded-2xl" />
            <Skeleton className="h-6 w-96 rounded-2xl" />
          </div>
          <Skeleton className="h-14 w-40 rounded-2xl" />
        </div>

        {/* Points card skeleton */}
        <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border border-white/20">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32 rounded-2xl" />
                  <Skeleton className="h-4 w-24 rounded-2xl" />
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <Skeleton className="h-16 w-24 rounded-2xl" />
                <Skeleton className="h-6 w-12 rounded-2xl" />
              </div>
            </div>
            <Skeleton className="h-16 w-16 rounded-2xl" />
          </div>
          <Skeleton className="h-16 w-full mt-6 rounded-2xl" />
        </div>

        {/* Store items grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
              <Skeleton className="h-60 w-full" />
              <div className="p-6">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <Skeleton className="h-8 w-40 rounded-2xl" />
                </div>
                <Skeleton className="h-4 w-full mb-2 rounded-2xl" />
                <Skeleton className="h-4 w-2/3 mb-6 rounded-2xl" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-24 rounded-2xl" />
                  <Skeleton className="h-10 w-28 rounded-2xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}