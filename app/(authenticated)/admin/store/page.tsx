'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { HeaderSkeleton, SearchFilterSkeleton, StoreItemCardSkeleton } from '@/app/components/ui/skeleton-shimmer';

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

export default function AdminStore() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTutorId, setSelectedTutorId] = useState<string>('');
  const [tutors, setTutors] = useState<{ id: string; username: string; firstName?: string; lastName?: string; }[]>([]);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    pointsRequired: 0,
    availableQuantity: 0,
    imageUrl: '',
    tutorId: ''
  });
  const [addingItem, setAddingItem] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Fetch tutors
  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const res = await fetch('/api/users?role=TUTOR');
        if (!res.ok) throw new Error('Failed to fetch tutors');
        const data = await res.json();
        setTutors(data.users);
      } catch (err) {
        console.error('Error fetching tutors:', err);
      }
    };

    if (isAdmin) {
      fetchTutors();
    }
  }, [isAdmin]);

  // Fetch store items
  useEffect(() => {
    const fetchStoreItems = async () => {
      try {
        setLoading(true);
        
        const url = selectedTutorId 
          ? `/api/admin/store?tutorId=${selectedTutorId}`
          : '/api/admin/store';
        
        const res = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          if (res.status === 403) {
            setError('Yetkiniz yok');
            return;
          }
          const errorData = await res.json();
          throw new Error(errorData.error || 'Mağaza ürünleri yüklenemedi');
        }
        
        const data = await res.json();
        setItems(data.items);
      } catch (err) {
        console.error('Mağaza ürünlerini getirme hatası:', err);
        setError('Mağaza ürünleri yüklenemedi. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchStoreItems();
    }
  }, [isAdmin, selectedTutorId]);

  const openAddModal = () => {
    if (!selectedTutorId) {
      setError('Lütfen önce bir öğretmen seçin');
      return;
    }
    setNewItem({
      name: '',
      description: '',
      pointsRequired: 0,
      availableQuantity: 0,
      imageUrl: '',
      tutorId: selectedTutorId
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Reset image error when changing image URL
    if (name === 'imageUrl') {
      setImageError(false);
      setIsImageLoading(true);
    }
    
    // Convert numeric fields
    if (name === 'pointsRequired' || name === 'availableQuantity') {
      setNewItem({
        ...newItem,
        [name]: value === '' ? 0 : parseInt(value, 10),
      });
    } else {
      setNewItem({
        ...newItem,
        [name]: value,
      });
    }
  };

  const handleImageError = () => {
    setImageError(true);
    setIsImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageError(false);
    setIsImageLoading(false);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setAddingItem(true);
      setError('');
      
      // Validate inputs
      if (!newItem.name.trim()) {
        throw new Error('Ürün adı zorunludur');
      }
      
      if (!newItem.description.trim()) {
        throw new Error('Ürün açıklaması zorunludur');
      }
      
      if (newItem.pointsRequired <= 0) {
        throw new Error('Gerekli puan sıfırdan büyük olmalıdır');
      }
      
      if (newItem.availableQuantity < 0) {
        throw new Error('Mevcut miktar negatif olamaz');
      }
      
      const res = await fetch('/api/admin/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Ürün eklenemedi');
      }
      
      const data = await res.json();
      
      // Add new item to the list
      setItems([...items, data.item]);
      
      // Show success message
      setSuccessMessage(`${data.item.name} mağazaya eklendi!`);
      
      // Clear form and close modal
      closeModal();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err: any) {
      console.error('Ürün ekleme hatası:', err);
      setError(err.message || 'Ürün eklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/admin/store?itemId=${itemId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Ürün silinemedi');
      }

      // Remove item from the list
      setItems(items.filter(item => item.id !== itemId));
      setSuccessMessage('Ürün başarıyla silindi');

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err: any) {
      console.error('Ürün silme hatası:', err);
      setError(err.message || 'Ürün silinemedi. Lütfen tekrar deneyin.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-8">
        <HeaderSkeleton />
        <SearchFilterSkeleton />
        
        {/* Store Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <StoreItemCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-8">
      <div className="bg-gradient-to-r from-indigo-700 to-purple-800 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-white">Mağaza Yönetimi</h1>
            <p className="text-indigo-100 mt-1">Öğretmenlerin mağaza ürünlerini yönetin</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedTutorId}
              onChange={(e) => setSelectedTutorId(e.target.value)}
              className="bg-white text-gray-900 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white"
            >
              <option value="">Tüm Öğretmenler</option>
              {tutors.map(tutor => (
                <option key={tutor.id} value={tutor.id}>
                  {tutor.firstName && tutor.lastName 
                    ? `${tutor.firstName} ${tutor.lastName}`
                    : tutor.username}
                </option>
              ))}
            </select>
            <button
              onClick={openAddModal}
              className={`bg-white text-indigo-700 hover:bg-indigo-50 py-2.5 px-5 rounded-lg flex items-center text-sm font-medium transition-colors shadow-sm ${!selectedTutorId ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!selectedTutorId}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Yeni Ürün Ekle
            </button>
          </div>
        </div>
      </div>
      
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-sm">
          <div className="flex items-center">
            <svg className="h-6 w-6 mr-3 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-green-800">Başarılı</h3>
              <div className="mt-1 text-sm text-green-700">{successMessage}</div>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {items.length === 0 ? (
        <div className="bg-white shadow-sm rounded-xl p-8 text-center text-gray-500 border border-gray-100 flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p className="text-lg font-medium">Mağazada henüz ürün bulunmamaktadır.</p>
          <button
            onClick={openAddModal}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg flex items-center text-sm font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            İlk Ürünü Ekle
          </button>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ürün
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Öğretmen
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stok Durumu
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.imageUrl ? (
                          <div className="flex-shrink-0 h-10 w-10 mr-3">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                          </div>
                        )}
                        <div className="text-sm font-medium text-gray-900">
                          {item.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm text-gray-900">
                        {item.tutor.firstName && item.tutor.lastName 
                          ? `${item.tutor.firstName} ${item.tutor.lastName}`
                          : item.tutor.username}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {item.description}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {item.pointsRequired} puan
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.availableQuantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.availableQuantity > 0 
                          ? `${item.availableQuantity} adet mevcut` 
                          : 'Stokta yok'}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="inline-flex items-center px-3 py-1.5 border border-indigo-500 text-indigo-600 bg-white hover:bg-indigo-50 rounded-md mr-2 transition-colors"
                        onClick={() => {/* TODO: Implement edit functionality */}}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Düzenle
                      </button>
                      <button
                        className="inline-flex items-center px-3 py-1.5 border border-red-500 text-red-600 bg-white hover:bg-red-50 rounded-md transition-colors"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl transform transition-all max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">Yeni Mağaza Ürünü Ekle</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500 transition-colors focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-6">
              <form id="addItemForm" onSubmit={handleAddItem} className="space-y-5">
                <input type="hidden" name="tutorId" value={newItem.tutorId} />
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Ürün Adı *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={newItem.name}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                      placeholder="Ürün adını girin"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama *
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                    </div>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={newItem.description}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                      placeholder="Ürün açıklamasını girin"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pointsRequired" className="block text-sm font-medium text-gray-700 mb-1">
                      Gerekli Puan *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <input
                        type="number"
                        id="pointsRequired"
                        name="pointsRequired"
                        min="1"
                        value={newItem.pointsRequired || ''}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                        placeholder="Puan girin"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="availableQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                      Mevcut Miktar *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <input
                        type="number"
                        id="availableQuantity"
                        name="availableQuantity"
                        min="0"
                        value={newItem.availableQuantity || ''}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                        placeholder="Miktar girin"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Görsel URL (İsteğe Bağlı)
                  </label>
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="url"
                        id="imageUrl"
                        name="imageUrl"
                        value={newItem.imageUrl}
                        onChange={handleInputChange}
                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors ${
                          imageError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="https://ornek.com/gorsel.jpg"
                      />
                    </div>
                    
                    {/* Image Preview */}
                    {newItem.imageUrl && (
                      <div className="relative rounded-lg overflow-hidden border border-gray-200">
                        {isImageLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
                          </div>
                        )}
                        <Image
                          src={newItem.imageUrl}
                          alt="Ürün önizleme"
                          width={300}
                          height={200}
                          className="w-full h-48 object-cover"
                          onError={handleImageError}
                          onLoad={handleImageLoad}
                        />
                        {imageError && (
                          <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-90">
                            <div className="text-center text-red-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-sm">Görsel yüklenemedi. Lütfen URL'yi kontrol edin.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="border-t p-6 bg-gray-50 rounded-b-2xl">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  onClick={closeModal}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  form="addItemForm"
                  className={`px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${addingItem ? 'opacity-70 cursor-not-allowed' : ''}`}
                  disabled={addingItem}
                >
                  {addingItem ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Ekleniyor...
                    </span>
                  ) : 'Ürün Ekle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 