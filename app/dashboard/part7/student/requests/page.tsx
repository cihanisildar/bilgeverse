'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type ItemRequest = {
  id: string;
  student: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  item: {
    id: string;
    name: string;
    description: string;
    pointsRequired: number;
    availableQuantity: number;
    imageUrl?: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  pointsSpent: number;
  note?: string;
  createdAt: string;
};

export default function StudentRequests() {
  const { isStudent, user, checkAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';
  
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequestsAndRefreshAuth = async () => {
    try {
      setRefreshing(true);
      
      // Refresh user data to get latest points
      await checkAuth();
      
      let url = '/api/requests';
      if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
      }
      
      const res = await fetch(url, {
        cache: 'no-store', // Ensure we get fresh data
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch requests');
      }
      
      const data = await res.json();
      setRequests(data.requests);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchRequestsAndRefreshAuth();
      setLoading(false);
    };

    if (isStudent) {
      loadInitialData();
    }
  }, [isStudent, statusFilter]);



  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams();
    if (status !== 'all') {
      params.set('status', status);
    }
    router.push(`/dashboard/part7/student/requests?${params.toString()}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <div className="relative">
            <span className="px-4 py-2 inline-flex items-center gap-2 text-sm font-semibold rounded-full bg-gradient-to-r from-amber-100 via-yellow-100 to-orange-100 text-amber-800 border border-amber-200 shadow-sm">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              Beklemede
            </span>
          </div>
        );
      case 'APPROVED':
        return (
          <div className="relative">
            <span className="px-4 py-2 inline-flex items-center gap-2 text-sm font-semibold rounded-full bg-gradient-to-r from-emerald-100 via-green-100 to-teal-100 text-emerald-800 border border-emerald-200 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              Onaylandı
            </span>
          </div>
        );
      case 'REJECTED':
        return (
          <div className="relative">
            <span className="px-4 py-2 inline-flex items-center gap-2 text-sm font-semibold rounded-full bg-gradient-to-r from-red-100 via-rose-100 to-pink-100 text-red-800 border border-red-200 shadow-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Reddedildi
            </span>
          </div>
        );
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            {/* Header Skeleton */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-4">
                <div className="h-10 w-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl"></div>
                <div className="h-5 w-96 bg-gray-200 rounded-xl"></div>
              </div>
              <div className="h-12 w-40 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl"></div>
            </div>
            
            {/* Filter Buttons Skeleton */}
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 w-32 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
            
            {/* Cards Skeleton */}
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="h-7 w-48 bg-gray-200 rounded-xl"></div>
                    <div className="h-8 w-28 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-gray-200 rounded-lg"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-gray-200 rounded-lg"></div>
                      <div className="h-6 w-32 bg-gray-200 rounded-lg"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-gray-200 rounded-lg"></div>
                      <div className="h-6 w-36 bg-gray-200 rounded-lg"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Taleplerim
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Mağazadan talep ettiğiniz ürünleri buradan takip edebilir, durumlarını görüntüleyebilirsiniz.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchRequestsAndRefreshAuth}
              disabled={refreshing}
              className="group relative overflow-hidden bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200 py-4 px-6 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="relative flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                {refreshing ? 'Yenileniyor...' : 'Yenile'}
              </div>
            </button>
            <Link
              href="/dashboard/part7/student/store"
              className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-4 px-8 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
                Mağazaya Git
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3 shadow-lg">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">Hata Oluştu</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
        
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3 mb-10">
          <button
            className={`group relative overflow-hidden px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 ${
              statusFilter === 'all' 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25' 
                : 'bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200 hover:bg-white hover:shadow-lg shadow-sm'
            }`}
            onClick={() => handleStatusChange('all')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
            Tümü
          </button>
          
          <button
            className={`group relative overflow-hidden px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 ${
              statusFilter === 'PENDING'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                : 'bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200 hover:bg-white hover:shadow-lg shadow-sm'
            }`}
            onClick={() => handleStatusChange('PENDING')}
          >
            <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
            Beklemede
          </button>
          
          <button
            className={`group relative overflow-hidden px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 ${
              statusFilter === 'APPROVED'
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200 hover:bg-white hover:shadow-lg shadow-sm'
            }`}
            onClick={() => handleStatusChange('APPROVED')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Onaylanan
          </button>
          
          <button
            className={`group relative overflow-hidden px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 ${
              statusFilter === 'REJECTED'
                ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25'
                : 'bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200 hover:bg-white hover:shadow-lg shadow-sm'
            }`}
            onClick={() => handleStatusChange('REJECTED')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Reddedilen
          </button>
        </div>
        
        {/* Content */}
        {requests.length === 0 ? (
          <div className="relative">
            <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl p-12 text-center border border-gray-100">
              <div className="mb-8">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full animate-pulse opacity-50"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-600 relative z-10" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Henüz talep yok!</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Puanlarınızla mağazadan harika ürünler talep edebilirsiniz. Hemen başlayın!
                </p>
                <Link
                  href="/dashboard/part7/student/store"
                  className="group inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-4 px-8 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                  </svg>
                  Mağazayı Keşfet
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {requests.map((request, index) => (
              <div 
                key={request.id} 
                className="group relative bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient border effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                <div className="absolute inset-0.5 bg-white rounded-3xl"></div>
                
                <div className="relative p-8">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                        {request.item.name}
                      </h2>
                      <p className="text-gray-600 leading-relaxed">{request.item.description}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                  
                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Harcanan Puan</div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{request.pointsSpent}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Talep Tarihi</div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="text-lg font-semibold text-gray-900">{formatDate(request.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Messages */}
                  {request.status === 'REJECTED' && request.note && (
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-6 mb-6">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 p-1 bg-red-100 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-red-800 mb-1">Red Nedeni</div>
                          <div className="text-red-700">{request.note}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {request.status === 'APPROVED' && (
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 p-1 bg-emerald-100 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-emerald-800 mb-1">Tebrikler! 🎉</div>
                          <div className="text-emerald-700">Talebiniz onaylandı! Ürününüzü öğretmeninizden teslim alabilirsiniz.</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {request.status === 'PENDING' && (
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 p-1 bg-amber-100 rounded-full">
                          <div className="w-4 h-4 bg-amber-500 rounded-full animate-pulse"></div>
                        </div>
                        <div>
                          <div className="font-semibold text-amber-800 mb-1">İnceleme Aşamasında</div>
                          <div className="text-amber-700">Talebiniz öğretmeninizin onayını bekliyor. Lütfen sabırla bekleyin.</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Points Summary Card */}
        <div className="mt-12 relative">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-white/80 text-sm font-medium uppercase tracking-wide mb-2">Mevcut Bakiyeniz</h3>
                <div className="text-4xl font-bold text-white mb-2">
                  {user?.points || 0} Puan
                </div>
                <p className="text-white/80 text-sm">
                  Puanlarınız, talebiniz öğretmeniniz tarafından onaylandığında otomatik olarak düşülür.
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 