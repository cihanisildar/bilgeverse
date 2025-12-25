'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useToast } from '@/app/hooks/use-toast';
import Link from 'next/link';

type Wish = {
  id: string;
  title: string;
  description: string;
  response?: string;
  respondedAt?: string;
  createdAt: string;
  student: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
};

export default function AdminWishes() {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchWishes();
    }
  }, [isAdmin]);

  const fetchWishes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/wishes');
      if (!response.ok) throw new Error('Failed to fetch wishes');
      const data = await response.json();
      setWishes(data.wishes);
    } catch (error) {
      toast.error('İstekler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 w-64 bg-white rounded-lg shadow-sm"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 space-y-4 shadow-sm">
                  <div className="h-7 w-3/4 bg-gray-200 rounded-md"></div>
                  <div className="h-5 w-1/3 bg-gray-200 rounded-md"></div>
                  <div className="h-16 w-full bg-gray-200 rounded-md"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const respondedWishes = wishes.filter(wish => wish.response);
  const pendingWishes = wishes.filter(wish => !wish.response);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Öğrenci İstek ve Dilekleri
              </h1>
              <p className="mt-2 text-gray-600">
                Öğrencilerin gönderdiği istek ve dilekleri buradan görüntüleyebilirsiniz.
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="flex gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                  <div className="text-2xl font-bold text-indigo-600">{wishes.length}</div>
                  <div className="text-sm text-gray-500">Toplam İstek</div>
                </div>
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                  <div className="text-2xl font-bold text-orange-600">{pendingWishes.length}</div>
                  <div className="text-sm text-gray-500">Bekleyen</div>
                </div>
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                  <div className="text-2xl font-bold text-green-600">{respondedWishes.length}</div>
                  <div className="text-sm text-gray-500">Yanıtlandı</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wishes List */}
        <div className="space-y-4">
          {wishes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">Henüz bir istek/dilek bulunmamaktadır.</p>
            </div>
          ) : (
            wishes.map((wish) => (
              <Link
                key={wish.id}
                href={`/dashboard/part7/admin/wishes/${wish.id}`}
                className="group block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {wish.title}
                      </h3>
                      {wish.response ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Yanıtlandı
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Bekliyor
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(wish.createdAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      {' • '}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium">{wish.student.username}</span>
                      {wish.student.firstName && wish.student.lastName && (
                        <span className="text-gray-400">({wish.student.firstName} {wish.student.lastName})</span>
                      )}
                    </p>
                    {wish.respondedAt && (
                      <p className="mt-1 text-sm text-green-600 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Yanıtlandı: {new Date(wish.respondedAt).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-gray-700 line-clamp-2">{wish.description}</p>
                <div className="mt-4 flex items-center text-sm text-indigo-600 group-hover:text-indigo-700 transition-colors">
                  <span>Detayları Görüntüle</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 