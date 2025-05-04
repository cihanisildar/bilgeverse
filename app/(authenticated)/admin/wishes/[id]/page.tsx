'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

type Wish = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  student: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
};

export default function WishDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [wish, setWish] = useState<Wish | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchWishDetails();
    }
  }, [isAdmin, params.id]);

  const fetchWishDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/wishes/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('İstek bulunamadı');
          router.push('/admin/wishes');
          return;
        }
        throw new Error('Failed to fetch wish details');
      }
      const data = await response.json();
      setWish(data.wish);
    } catch (error) {
      toast.error('İstek detayları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 bg-white rounded-lg shadow-sm"></div>
            <div className="bg-white rounded-xl p-6 space-y-4 shadow-sm">
              <div className="h-7 w-3/4 bg-gray-200 rounded-md"></div>
              <div className="h-5 w-1/3 bg-gray-200 rounded-md"></div>
              <div className="h-32 w-full bg-gray-200 rounded-md"></div>
              <div className="h-20 w-full bg-gray-200 rounded-md"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!wish) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/admin/wishes"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors group"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm border border-gray-200 mr-2 group-hover:bg-gray-50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </span>
            Tüm İsteklere Dön
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{wish.title}</h1>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(wish.createdAt).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              {/* <div className="hidden sm:block">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>İstek ID:</span>
                  <code className="px-2 py-1 bg-gray-100 rounded-md font-mono text-xs">{wish.id}</code>
                </div>
              </div> */}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="prose max-w-none">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-gray-700 whitespace-pre-wrap">{wish.description}</p>
              </div>
            </div>
          </div>

          {/* Student Information */}
          <div className="border-t border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4">
            <h2 className="text-sm font-medium text-gray-500 mb-4">Gönderen Öğrenci</h2>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-inner">
                  <span className="text-white font-medium text-lg">
                    {wish.student.firstName ? wish.student.firstName[0] : wish.student.username[0]}
                    {wish.student.lastName ? wish.student.lastName[0] : ''}
                  </span>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {wish.student.firstName && wish.student.lastName
                        ? `${wish.student.firstName} ${wish.student.lastName}`
                        : wish.student.username}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {wish.student.email}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                      @{wish.student.username}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 