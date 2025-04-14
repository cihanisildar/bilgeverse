'use client';

import { HeaderSkeleton } from '@/app/components/ui/skeleton-shimmer';
import { useAuth } from '@/app/contexts/AuthContext';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AlertCircle, Coins, Filter, Package, Search, ShoppingBag, Tag } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

type StoreItem = {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  availableQuantity: number;
  imageUrl?: string;
};

// Mock data to use as fallback when server fails
const MOCK_ITEMS: StoreItem[] = [
  {
    id: 'mock-1',
    name: 'Örnek Ürün 1',
    description: 'Bu, sunucu kullanılamadığında gösterilen bir yer tutucu öğedir.',
    pointsRequired: 100,
    availableQuantity: 5,
    imageUrl: 'https://via.placeholder.com/300'
  },
  {
    id: 'mock-2',
    name: 'Örnek Ürün 2',
    description: 'Sunucu bağlantı sorunları oluştu. Bunlar sadece örnek ürünlerdir.',
    pointsRequired: 200,
    availableQuantity: 3
  },
  {
    id: 'mock-3',
    name: 'Örnek Ürün 3',
    description: 'Veritabanı bağlantısı yeniden sağlandığında lütfen tekrar deneyin.',
    pointsRequired: 500,
    availableQuantity: 1
  }
];

// Loading state components
function StoreItemSkeleton() {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="space-y-2">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-10" />
      </CardFooter>
    </Card>
  );
}

function LoadingStore() {
  return (
    <div className="space-y-8">
      <HeaderSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <StoreItemSkeleton key={i} />
        ))}
      </div>
      
      {/* Store Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <StoreItemSkeleton key={`item-${i}`} />
        ))}
      </div>
    </div>
  );
}

export default function TutorStore() {
  const { isTutor, user } = useAuth();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [filteredItems, setFilteredItems] = useState<StoreItem[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [useFallback, setUseFallback] = useState(false);
  const [isServerError, setIsServerError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const fetchStoreItems = async () => {
    console.log('Eğitmen olarak mağaza ürünleri getiriliyor:', { 
      isTutor, 
      userId: user?.id,
      username: user?.username, 
      role: user?.role 
    });
    
    try {
      setLoading(true);
      setError(null);
      setIsServerError(false);
      setUseFallback(false);
      setErrorDetails(null);
      setDebugInfo(null);
      
      const response = await fetch('/api/store/items', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch store items');
      }
      
      const data = await response.json();
      setItems(data.items || []);
      setFilteredItems(data.items || []);
    } catch (err: any) {
      console.error('Error fetching store items:', err);
      setError(err.message);
      
      // Handle fetch abort/timeout specially
      if (err.name === 'AbortError' || err.name === 'TimeoutError') {
        setError('İstek zaman aşımına uğradı. Sunucu aşırı yüklenmiş veya kullanılamıyor olabilir.');
        setIsServerError(true);
        
        // Use fallback after timeout
        setUseFallback(true);
        setItems(MOCK_ITEMS);
        setError('Sunucu bağlantısı zaman aşımına uğradı. Örnek veriler gösteriliyor.');
      } else {
        setError(`${err.message || 'Mağaza ürünleri yüklenemedi. Lütfen tekrar deneyin.'}`);
        
        // Store debug info
        setDebugInfo({
          error: err.message,
          name: err.name,
          stack: err.stack?.split('\n').slice(0, 3).join('\n')
        });
        
        // Check if the error is likely related to database connection
        if (
          err.message.includes('MongoDB') || 
          err.message.includes('database') ||
          err.message.includes('connection') ||
          err.message.includes('Internal Server Error') ||
          err.message.includes('Server error')
        ) {
          setIsServerError(true);
          
          // Use fallback for database errors
          setUseFallback(true);
          setItems(MOCK_ITEMS);
          setError('Veritabanı veya sunucu sorunu. Örnek veriler gösteriliyor.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isTutor && user) {
      fetchStoreItems();
    }
  }, [isTutor, user]);

  useEffect(() => {
    let filtered = [...items];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply price filter
    if (priceFilter !== 'all') {
      filtered = filtered.filter(item => {
        switch (priceFilter) {
          case 'low':
            return item.pointsRequired <= 100;
          case 'medium':
            return item.pointsRequired > 100 && item.pointsRequired <= 300;
          case 'high':
            return item.pointsRequired > 300;
          default:
            return true;
        }
      });
    }
    
    setFilteredItems(filtered);
  }, [searchQuery, priceFilter, items]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchStoreItems();
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-8">
        <HeaderSkeleton />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <StoreItemSkeleton key={i} />
          ))}
        </div>
        
        {/* Store Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <StoreItemSkeleton key={`item-${i}`} />
          ))}
        </div>
      </div>
    );
  }

  const stats = {
    totalItems: items.length,
    averagePoints: Math.round(items.reduce((acc, item) => acc + item.pointsRequired, 0) / items.length) || 0,
    totalAvailable: items.reduce((acc, item) => acc + item.availableQuantity, 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Gradient Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Mağaza Yönetimi
            </span>
          </h1>
          <p className="mt-1 text-gray-600">Ürünleri görüntüleyin ve yönetin</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Toplam Ürün</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalItems}</h3>
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <Package className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
            <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Ortalama Puan</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.averagePoints}</h3>
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">
                  <Coins className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
            <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Stok Miktarı</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalAvailable}</h3>
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Tag className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Ürün ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>
              <div className="w-full sm:w-60">
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Puan Filtresi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Puanlar</SelectItem>
                    <SelectItem value="low">Düşük Puan (≤ 100)</SelectItem>
                    <SelectItem value="medium">Orta Puan (101-300)</SelectItem>
                    <SelectItem value="high">Yüksek Puan ({'>'}300)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center text-red-700">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
                <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                {item.imageUrl && (
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-image.jpg';
                      }}
                    />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{item.name}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                      {item.pointsRequired} Puan
                    </Badge>
                    <span className={cn(
                      "text-sm font-medium",
                      item.availableQuantity > 10 ? "text-green-600" :
                      item.availableQuantity > 0 ? "text-yellow-600" : "text-red-600"
                    )}>
                      {item.availableQuantity} adet kaldı
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredItems.length === 0 && !error && (
          <Card className="border-0 shadow-lg text-center py-12">
            <CardContent>
              <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Ürün Bulunamadı
              </h3>
              <p className="text-gray-500">
                Arama kriterlerinize uygun ürün bulunamadı. Farklı bir arama yapmayı deneyebilirsiniz.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Store Item Card Component
function StoreItemCard({ item, isMock = false }: { item: StoreItem, isMock?: boolean }) {
  // Track if image has errored
  const [imageError, setImageError] = useState(false);
  
  // Handle image loading error
  const handleImageError = () => {
    console.log(`Resim yüklenemedi: ${item.imageUrl}`);
    setImageError(true);
  };
  
  return (
    <div className={`bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border group ${
      isMock ? 'border-yellow-200' : 'border-gray-100'
    }`}>
      {item.imageUrl && !imageError ? (
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
          />
          <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-lg font-bold shadow-md ${
            isMock ? 'bg-yellow-500 text-white' : 'bg-indigo-600 text-white'
          }`}>
            {item.pointsRequired} puan
          </div>
          {isMock && (
            <div className="absolute bottom-0 left-0 right-0 bg-yellow-500 text-white text-xs px-2 py-1 text-center">
              Örnek Resim
            </div>
          )}
        </div>
      ) :
        <div className={`relative h-48 w-full flex items-center justify-center ${
          isMock 
            ? 'bg-gradient-to-br from-yellow-50 to-yellow-100' 
            : 'bg-gradient-to-br from-indigo-100 to-purple-100'
        }`}>
          <Package className={`h-16 w-16 ${isMock ? 'text-yellow-300' : 'text-indigo-300'}`} />
          <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-lg font-bold shadow-md ${
            isMock ? 'bg-yellow-500 text-white' : 'bg-indigo-600 text-white'
          }`}>
            {item.pointsRequired} puan
          </div>
          {isMock && (
            <div className="absolute bottom-0 left-0 right-0 bg-yellow-500 text-white text-xs px-2 py-1 text-center">
              Örnek Ürün
            </div>
          )}
        </div>
      }
      
      <div className="p-5">
        <h2 className={`text-lg font-semibold mb-2 transition-colors ${
          isMock ? 'text-yellow-700 group-hover:text-yellow-800' : 'text-gray-900 group-hover:text-indigo-600'
        }`}>
          {item.name}
        </h2>
        
        <p className="text-gray-600 mb-4 text-sm line-clamp-2">
          {item.description}
        </p>
        
        <div className="flex items-center">
          <div className={`text-sm font-medium rounded-full px-3 py-1 ${
            isMock 
              ? 'bg-yellow-50 text-yellow-700' 
              : item.availableQuantity > 5 
                ? 'bg-green-50 text-green-700'
                : item.availableQuantity > 0
                  ? 'bg-yellow-50 text-yellow-700' 
                  : 'bg-red-50 text-red-700'
          }`}>
            {item.availableQuantity > 5 
              ? `${item.availableQuantity} adet mevcut` 
              : item.availableQuantity > 0
                ? `Sadece ${item.availableQuantity} adet kaldı` 
                : 'Stokta yok'}
          </div>
        </div>
      </div>
    </div>
  );
} 