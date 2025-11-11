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
  response?: string;
  respondedAt?: string;
  respondedBy?: string;
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
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [response, setResponse] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [editingResponse, setEditingResponse] = useState(false);
  const [showEditResponseForm, setShowEditResponseForm] = useState(false);
  const [showDeleteResponseConfirm, setShowDeleteResponseConfirm] = useState(false);
  const [deletingResponse, setDeletingResponse] = useState(false);

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
          router.push('/dashboard/part7/admin/wishes');
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

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/wishes/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete wish');
      }

      toast.success('İstek başarıyla silindi');
      router.push('/dashboard/part7/admin/wishes');
    } catch (error) {
      toast.error('İstek silinirken bir hata oluştu');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!response.trim()) {
      toast.error('Yanıt boş olamaz');
      return;
    }

    try {
      setSubmittingResponse(true);
      const responseData = await fetch(`/api/admin/wishes/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response: response.trim() }),
      });

      if (!responseData.ok) {
        throw new Error('Failed to submit response');
      }

      const data = await responseData.json();
      setWish(data.wish);
      setResponse('');
      setShowResponseForm(false);
      toast.success('Yanıt başarıyla gönderildi');
    } catch (error) {
      toast.error('Yanıt gönderilirken bir hata oluştu');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleEditResponse = async () => {
    if (!response.trim()) {
      toast.error('Yanıt boş olamaz');
      return;
    }

    try {
      setSubmittingResponse(true);
      const responseData = await fetch(`/api/admin/wishes/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response: response.trim() }),
      });

      if (!responseData.ok) {
        throw new Error('Failed to edit response');
      }

      const data = await responseData.json();
      setWish(data.wish);
      setResponse('');
      setShowEditResponseForm(false);
      toast.success('Yanıt başarıyla düzenlendi');
    } catch (error) {
      toast.error('Yanıt düzenlenirken bir hata oluştu');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleDeleteResponse = async () => {
    try {
      setDeletingResponse(true);
      const responseData = await fetch(`/api/admin/wishes/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'delete_response' }),
      });

      if (!responseData.ok) {
        throw new Error('Failed to delete response');
      }

      const data = await responseData.json();
      setWish(data.wish);
      setShowDeleteResponseConfirm(false);
      toast.success('Yanıt başarıyla silindi');
    } catch (error) {
      toast.error('Yanıt silinirken bir hata oluştu');
    } finally {
      setDeletingResponse(false);
    }
  };

  const startEditResponse = () => {
    setResponse(wish?.response || '');
    setShowEditResponseForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
        <div className="px-4 sm:px-6 lg:px-8">
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
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard/part7/admin/wishes"
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
              <div className="flex items-center gap-3">
                {!wish.response && (
                  <button
                    onClick={() => setShowResponseForm(true)}
                    className="inline-flex items-center px-3 py-2 border border-indigo-300 shadow-sm text-sm leading-4 font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Yanıtla
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                  className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {deleting ? 'Siliniyor...' : 'Sil'}
                </button>
              </div>
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

          {/* Response Section */}
          {wish.response && (
            <div className="border-t border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-gray-700">Admin Yanıtı</h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {wish.respondedAt && new Date(wish.respondedAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={startEditResponse}
                      className="inline-flex items-center px-2 py-1 border border-blue-300 shadow-sm text-xs font-medium rounded text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Düzenle
                    </button>
                    <button
                      onClick={() => setShowDeleteResponseConfirm(true)}
                      disabled={deletingResponse}
                      className="inline-flex items-center px-2 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {deletingResponse ? 'Siliniyor...' : 'Sil'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <p className="text-gray-700 whitespace-pre-wrap">{wish.response}</p>
              </div>
            </div>
          )}

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

        {/* Response Form Modal */}
        {showResponseForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">İsteğe Yanıt Ver</h3>
                <button
                  onClick={() => setShowResponseForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mb-4">
                <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-2">
                  Yanıtınız
                </label>
                <textarea
                  id="response"
                  rows={6}
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Öğrencinin isteğine yanıtınızı buraya yazın..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowResponseForm(false)}
                  disabled={submittingResponse}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  İptal
                </button>
                <button
                  onClick={handleSubmitResponse}
                  disabled={submittingResponse || !response.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingResponse ? 'Gönderiliyor...' : 'Yanıtı Gönder'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Response Form Modal */}
        {showEditResponseForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Yanıtı Düzenle</h3>
                <button
                  onClick={() => setShowEditResponseForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mb-4">
                <label htmlFor="edit-response" className="block text-sm font-medium text-gray-700 mb-2">
                  Yanıtınız
                </label>
                <textarea
                  id="edit-response"
                  rows={6}
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Yanıtınızı düzenleyin..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditResponseForm(false)}
                  disabled={submittingResponse}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  İptal
                </button>
                <button
                  onClick={handleEditResponse}
                  disabled={submittingResponse || !response.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingResponse ? 'Düzenleniyor...' : 'Yanıtı Güncelle'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">İsteği Sil</h3>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-500">
                  Bu isteği silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  İptal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Siliniyor...' : 'Sil'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Response Confirmation Dialog */}
        {showDeleteResponseConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Yanıtı Sil</h3>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-500">
                  Bu yanıtı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteResponseConfirm(false)}
                  disabled={deletingResponse}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  İptal
                </button>
                <button
                  onClick={handleDeleteResponse}
                  disabled={deletingResponse}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingResponse ? 'Siliniyor...' : 'Sil'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 