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
  status: 'pending' | 'approved' | 'rejected';
  pointsSpent: number;
  note?: string;
  createdAt: string;
};

export default function StudentRequests() {
  const { isStudent, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';
  
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        let url = '/api/requests';
        if (statusFilter !== 'all') {
          url += `?status=${statusFilter}`;
        }
        
        const res = await fetch(url);
        
        if (!res.ok) {
          throw new Error('Failed to fetch requests');
        }
        
        const data = await res.json();
        setRequests(data.requests);
      } catch (err) {
        console.error('Error fetching requests:', err);
        setError('Failed to load requests. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isStudent) {
      fetchRequests();
    }
  }, [isStudent, statusFilter]);

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams();
    if (status !== 'all') {
      params.set('status', status);
    }
    router.push(`/student/requests?${params.toString()}`);
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
      case 'pending':
        return (
          <span className="px-3 py-1 inline-flex items-center gap-1.5 text-sm font-medium rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Beklemede
          </span>
        );
      case 'approved':
        return (
          <span className="px-3 py-1 inline-flex items-center gap-1.5 text-sm font-medium rounded-full bg-green-50 text-green-700 border border-green-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Onaylandı
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 inline-flex items-center gap-1.5 text-sm font-medium rounded-full bg-red-50 text-red-700 border border-red-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Reddedildi
          </span>
        );
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="flex justify-between items-center">
              <div className="space-y-3">
                <div className="h-8 w-48 bg-gray-200 rounded-md"></div>
                <div className="h-4 w-64 bg-gray-200 rounded-md"></div>
              </div>
              <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
            </div>
            
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-24 bg-gray-200 rounded-md"></div>
              ))}
            </div>
            
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="h-6 w-48 bg-gray-200 rounded-md"></div>
                  <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                </div>
                <div className="h-4 w-full bg-gray-200 rounded-md"></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded-md"></div>
                    <div className="h-5 w-32 bg-gray-200 rounded-md"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded-md"></div>
                    <div className="h-5 w-36 bg-gray-200 rounded-md"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Taleplerim
            </h1>
            <p className="mt-2 text-gray-600">Mağazadan talep ettiğiniz ürünleri buradan takip edebilirsiniz.</p>
          </div>
          <Link
            href="/student/store"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 px-6 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            Mağazaya Git
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
        
        <div className="flex gap-3 mb-8">
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2
              ${statusFilter === 'all' 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg' 
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
            onClick={() => handleStatusChange('all')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
            Tümü
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2
              ${statusFilter === 'pending'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md hover:shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
            onClick={() => handleStatusChange('pending')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Beklemede
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2
              ${statusFilter === 'approved'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md hover:shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
            onClick={() => handleStatusChange('approved')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Onaylanan
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2
              ${statusFilter === 'rejected'
                ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md hover:shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
            onClick={() => handleStatusChange('rejected')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Reddedilen
          </button>
        </div>
        
        {requests.length === 0 ? (
          <div className="bg-white shadow-lg rounded-2xl p-8 text-center border border-gray-100">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-600 mb-6">Henüz hiç talepte bulunmadınız.</p>
              <Link
                href="/student/store"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 px-6 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
              >
                Mağazayı Keşfet
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {requests.map((request) => (
              <div key={request.id} className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">{request.item.name}</h2>
                    {getStatusBadge(request.status)}
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-gray-600">{request.item.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Harcanan Puan</div>
                      <div className="font-semibold text-gray-900 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        {request.pointsSpent}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Talep Tarihi</div>
                      <div className="font-semibold text-gray-900 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        {formatDate(request.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  {request.status === 'rejected' && request.note && (
                    <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="text-sm font-medium text-red-800 mb-1">Red Nedeni:</div>
                      <div className="text-sm text-red-700">{request.note}</div>
                    </div>
                  )}
                  
                  {request.status === 'approved' && (
                    <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="text-sm text-green-700 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Talebiniz onaylandı! Ürününüzü öğretmeninizden teslim alabilirsiniz.
                      </div>
                    </div>
                  )}
                  
                  {request.status === 'pending' && (
                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <div className="text-sm text-yellow-700 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Talebiniz öğretmeninizin onayını bekliyor.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8 bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">Mevcut Puanlarınız</div>
              <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {user?.points || 0}
              </div>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Puanlarınız, talebiniz öğretmeniniz tarafından onaylandığında otomatik olarak düşülür.
          </p>
        </div>
      </div>
    </div>
  );
} 