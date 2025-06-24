'use client';

import { HeaderSkeleton, SearchFilterSkeleton, StoreItemCardSkeleton } from '@/app/components/ui/skeleton-shimmer';
import { useAuth } from '@/app/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';

type StoreItem = {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  imageUrl?: string;
  itemRequests?: {
    id: string;
    status: string;
    pointsSpent: number;
    createdAt: string;
    student: {
      id: string;
      username: string;
      firstName?: string;
      lastName?: string;
    };
  }[];
};

export default function AdminStore() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    pointsRequired: 0,
    imageUrl: ''
  });
  const [addingItem, setAddingItem] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [originalImage, setOriginalImage] = useState<string>('');
  const [cropData, setCropData] = useState({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    scale: 1
  });
  
  // Edit dialog states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<StoreItem | null>(null);
  const [editingItem, setEditingItem] = useState(false);
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [editUploadingImage, setEditUploadingImage] = useState(false);
  const [editImageError, setEditImageError] = useState(false);
  const [editIsImageLoading, setEditIsImageLoading] = useState(false);


  // Remove tutors fetching since we don't need it anymore

  // Fetch store items
  useEffect(() => {
    const fetchStoreItems = async () => {
      try {
        setLoading(true);
        
        const res = await fetch('/api/admin/store', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          if (res.status === 403) {
            toast.error('Yetkiniz yok');
            return;
          }
          const errorData = await res.json();
          throw new Error(errorData.error || 'Mağaza ürünleri yüklenemedi');
        }
        
        const data = await res.json();
        setItems(data.items);
      } catch (err) {
        console.error('Mağaza ürünlerini getirme hatası:', err);
        toast.error('Mağaza ürünleri yüklenemedi. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchStoreItems();
    }
  }, [isAdmin]);

  const openAddModal = () => {
    setNewItem({
      name: '',
      description: '',
      pointsRequired: 0,
      imageUrl: ''
    });
    setSelectedFile(null);
    setImageError(false);
    setIsImageLoading(false);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setSelectedFile(null);
    setImageError(false);
    setIsImageLoading(false);
    // Clean up preview URL if it exists
    if (newItem.imageUrl && newItem.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(newItem.imageUrl);
    }
  };

  const isAllowedImageDomain = (url: string): boolean => {
    try {
      const hostname = new URL(url).hostname;
      const allowedDomains = [
        'via.placeholder.com',
        'placehold.co',
        'placekitten.com',
        'picsum.photos',
        'images.unsplash.com',
        'encrypted-tbn0.gstatic.com',
        'encrypted-tbn1.gstatic.com',
        'lh3.googleusercontent.com',
        'storage.googleapis.com',
        'i.imgur.com',
        'imgur.com',
        'res.cloudinary.com',
        'media.istockphoto.com',
        'images.pexels.com',
        'img.freepik.com',
        'cdn.dsmcdn.com',
        'productimages.hepsiburada.net',
        'images.hepsiburada.net'
      ];
      return allowedDomains.includes(hostname);
    } catch {
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'imageUrl') {
      // Validate URL format
      const isValidUrl = !value.trim() || value.trim().startsWith('http://') || value.trim().startsWith('https://');
      if (!isValidUrl) {
        toast.error('Lütfen geçerli bir URL girin (http:// veya https:// ile başlamalı)');
        return;
      }

      // Check if domain is allowed
      if (value.trim() && !isAllowedImageDomain(value)) {
        toast.error('Bu görsel kaynağı desteklenmiyor. Lütfen desteklenen bir görsel kaynağı kullanın.');
        setNewItem({
          ...newItem,
          [name]: ''
        });
        return;
      }
      
      // Only set loading state if there's actually a valid URL
      if (value.trim()) {
        setIsImageLoading(true);
        setImageError(false);
      } else {
        setIsImageLoading(false);
        setImageError(false);
      }
    }
    
    // Convert numeric fields
    if (name === 'pointsRequired') {
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

  const handleImageError = useCallback(() => {
    setImageError(true);
    setIsImageLoading(false);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageError(false);
    setIsImageLoading(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Geçersiz dosya türü. Sadece JPEG, PNG, WebP ve GIF dosyaları kabul edilir.');
        return;
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error('Dosya çok büyük. Maksimum boyut 5MB\'dir.');
        return;
      }

      setSelectedFile(file);
      setImageError(false);
      
      // Create preview URL and open image editor
      const previewUrl = URL.createObjectURL(file);
      setOriginalImage(previewUrl);
      setShowImageEditor(true);
    }
  };

  const handleImageEditorSave = (editedImageBlob: Blob) => {
    // Convert blob to file
    const editedFile = new File([editedImageBlob], selectedFile?.name || 'edited-image.png', {
      type: editedImageBlob.type
    });
    
    setSelectedFile(editedFile);
    
    // Create new preview URL
    const previewUrl = URL.createObjectURL(editedImageBlob);
    setNewItem(prev => ({ ...prev, imageUrl: previewUrl }));
    
    setShowImageEditor(false);
  };

  const handleImageEditorCancel = () => {
    setShowImageEditor(false);
    setSelectedFile(null);
    if (originalImage) {
      URL.revokeObjectURL(originalImage);
      setOriginalImage('');
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Görsel yüklenemedi');
      }

      const data = await response.json();
      return data.url;
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error(error.message || 'Görsel yüklenirken bir hata oluştu');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const isValidImageUrl = (url: string): boolean => {
    if (!url || !url.trim()) return false;
    return url.trim().startsWith('http://') || url.trim().startsWith('https://');
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setAddingItem(true);
      
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
      

      // Upload image if a file is selected
      let finalImageUrl = '';
      if (selectedFile) {
        finalImageUrl = await uploadImage() || '';
        if (selectedFile && !finalImageUrl) {
          // Upload failed, don't continue
          setAddingItem(false);
          return;
        }
      }


      
      const res = await fetch('/api/admin/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newItem,
          imageUrl: finalImageUrl || undefined
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Ürün eklenemedi');
      }
      
      const data = await res.json();
      
      // Add new item to the list
      setItems([...items, data.item]);
      
      // Show success message
      toast.success(`${data.item.name} mağazaya eklendi!`);
      
      // Clear form and close modal
      closeModal();
      
    } catch (err: any) {
      console.error('Ürün ekleme hatası:', err);
      toast.error(err.message || 'Ürün eklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteClick = (itemId: string) => {
    setItemToDelete(itemId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    const toastId = toast.loading('Ürün siliniyor...');
    
    try {
      const res = await fetch(`/api/admin/store/${itemToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Ürün silinemedi');
      }

      // Remove item from the list
      setItems(items.filter(item => item.id !== itemToDelete));
      toast.success('Ürün başarıyla silindi', { id: toastId });
      setShowDeleteDialog(false);
      setItemToDelete(null);

    } catch (err: any) {
      console.error('Ürün silme hatası:', err);
      toast.error(err.message || 'Ürün silinemedi. Lütfen tekrar deneyin.', { id: toastId });
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setItemToDelete(null);
  };

  // Edit dialog functions
  const handleEditClick = async (itemId: string) => {
    try {
      const res = await fetch(`/api/admin/store/${itemId}`);
      
      if (!res.ok) {
        if (res.status === 403) {
          toast.error('Yetkiniz yok');
          return;
        }
        const errorData = await res.json();
        throw new Error(errorData.error || 'Ürün yüklenemedi');
      }
      
      const data = await res.json();
      setEditItem(data.item);
      setEditSelectedFile(null);
      setEditImageError(false);
      setEditIsImageLoading(false);
      setShowEditModal(true);
    } catch (err) {
      console.error('Ürün getirme hatası:', err);
      toast.error('Ürün yüklenemedi. Lütfen tekrar deneyin.');
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditItem(null);
    setEditSelectedFile(null);
    setEditImageError(false);
    setEditIsImageLoading(false);
    // Clean up preview URL if it exists
    if (editItem?.imageUrl && editItem.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(editItem.imageUrl);
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editItem) return;
    
    const { name, value } = e.target;
    
    if (name === 'imageUrl') {
      setEditImageError(false);
      setEditIsImageLoading(true);
    }
    
    setEditItem({
      ...editItem,
      [name]: name === 'pointsRequired'
        ? parseInt(value) || 0
        : value
    });
  };

  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Geçersiz dosya türü. Sadece JPEG, PNG, WebP ve GIF dosyaları kabul edilir.');
        return;
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error('Dosya çok büyük. Maksimum boyut 5MB\'dir.');
        return;
      }

      setEditSelectedFile(file);
      setEditImageError(false);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      if (editItem) {
        setEditItem({ ...editItem, imageUrl: previewUrl });
      }
    }
  };

  const editUploadImage = async (): Promise<string | null> => {
    if (!editSelectedFile) return null;

    try {
      setEditUploadingImage(true);
      const formData = new FormData();
      formData.append('image', editSelectedFile);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Görsel yüklenemedi');
      }

      const data = await response.json();
      return data.url;
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error(error.message || 'Görsel yüklenirken bir hata oluştu');
      return null;
    } finally {
      setEditUploadingImage(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    
    const toastId = toast.loading('Değişiklikler kaydediliyor...');
    
    try {
      setEditingItem(true);
      
      // Validate inputs
      if (!editItem.name.trim()) {
        throw new Error('Ürün adı zorunludur');
      }
      
      if (!editItem.description.trim()) {
        throw new Error('Ürün açıklaması zorunludur');
      }
      
      if (editItem.pointsRequired <= 0) {
        throw new Error('Gerekli puan sıfırdan büyük olmalıdır');
      }

      // Upload new image if a file is selected
      let finalImageUrl = editItem.imageUrl;
      if (editSelectedFile) {
        const uploadedUrl = await editUploadImage();
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        } else {
          // Upload failed, don't continue
          setEditingItem(false);
          return;
        }
      }
      
      const res = await fetch(`/api/admin/store/${editItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editItem.name,
          description: editItem.description,
          pointsRequired: editItem.pointsRequired,
          imageUrl: finalImageUrl
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 409) {
          throw new Error('Bu isimde bir ürün zaten var');
        }
        throw new Error(errorData.error || 'Ürün güncellenemedi');
      }
      
      const data = await res.json();
      
      // Update the items list
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === editItem.id 
            ? { ...data.item, imageUrl: finalImageUrl }
            : item
        )
      );
      
      toast.dismiss(toastId);
      toast.success('Ürün başarıyla güncellendi!');
      closeEditModal();
      
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error.message || 'Bir hata oluştu');
    } finally {
      setEditingItem(false);
    }
  };

  const handleEditImageError = useCallback(() => {
    setEditImageError(true);
    setEditIsImageLoading(false);
  }, []);

  const handleEditImageLoad = useCallback(() => {
    setEditImageError(false);
    setEditIsImageLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <HeaderSkeleton />
          <SearchFilterSkeleton />
          
          {/* Store Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <StoreItemCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="pt-8 pb-6">
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-3xl shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
            <div className="relative px-8 py-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white">Mağaza Yönetimi</h1>
                      <p className="text-blue-100 mt-1">Öğretmenlerin mağaza ürünlerini yönetin ve düzenleyin</p>
                    </div>
                  </div>
                  
                  {/* Controls */}
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={openAddModal}
                      className="bg-white text-indigo-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all shadow-lg transform hover:scale-105"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Yeni Ürün Ekle</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="pb-8">
          {items.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg border border-slate-200/60 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Henüz Ürün Bulunmuyor</h3>
                <p className="text-gray-600 mb-8">Mağazanızda henüz hiç ürün bulunmamaktadır. İlk ürününüzü ekleyerek başlayın.</p>
                <button
                  onClick={openAddModal}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold flex items-center space-x-2 mx-auto transition-all shadow-lg transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>İlk Ürünü Ekle</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <div key={item.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/60 overflow-hidden transform hover:-translate-y-1">
                  {/* Image Section */}
                  <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          // Hide the broken image and show fallback
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    {/* Fallback content - shown when no image or when image fails */}
                    <div className={`absolute inset-0 flex items-center justify-center ${item.imageUrl ? 'hidden' : 'flex'}`}>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
                        {item.imageUrl && (
                          <p className="text-xs text-gray-500 px-2">Görsel yüklenemedi</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleEditClick(item.id)}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-white transition-all transform hover:scale-110"
                      >
                        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item.id)}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:bg-red-50 transition-all transform hover:scale-110"
                      >
                        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2 flex-1">
                        {item.name}
                      </h3>
                      <div className="ml-3 flex-shrink-0">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700">
                          {item.pointsRequired} puan
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                      {item.description}
                    </p>
                    

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl transform transition-all">
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Ürünü Sil</h3>
                <p className="text-gray-600 mb-8">Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
                <div className="flex space-x-4">
                  <button
                    onClick={handleDeleteCancel}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
                  >
                    Evet, Sil
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Add Item Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl transform transition-all max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-8 border-b border-slate-200">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Yeni Mağaza Ürünü Ekle</h3>
                  <p className="text-gray-600 mt-1">Mağazanıza yeni bir ürün ekleyin</p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="overflow-y-auto flex-1 p-8">
                <form id="addItemForm" onSubmit={handleAddItem} className="space-y-6">
                  
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-3">
                      Ürün Adı *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={newItem.name}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Ürün adını girin"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-3">
                      Açıklama *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={newItem.description}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                      placeholder="Ürün açıklamasını girin"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="pointsRequired" className="block text-sm font-semibold text-gray-900 mb-3">
                      Gerekli Puan *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Puan girin"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="imageFile" className="block text-sm font-semibold text-gray-900 mb-3">
                      Ürün Görseli (İsteğe Bağlı)
                    </label>
                    <div className="space-y-4">
                      <div className="relative">
                        <input
                          type="file"
                          id="imageFile"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <label
                          htmlFor="imageFile"
                          className="w-full flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                        >
                          <div className="text-center">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-lg font-medium text-gray-700 mb-1">Görsel Yükle</p>
                            <p className="text-sm text-gray-500 mb-2">
                              {selectedFile ? selectedFile.name : 'Dosya seçmek için tıklayın veya sürükleyip bırakın'}
                            </p>
                            <p className="text-xs text-gray-400">
                              JPEG, PNG, WebP, GIF • Maksimum 5MB
                            </p>
                          </div>
                        </label>
                      </div>
                      
                      {/* Image Preview */}
                      {selectedFile && (
                        <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-white">
                          <div className="relative flex items-center justify-center p-4 min-h-[200px] bg-gray-50">
                            <Image
                              src={newItem.imageUrl}
                              alt="Ürün önizleme"
                              width={400}
                              height={300}
                              className="max-w-full max-h-80 object-contain rounded-lg shadow-sm"
                              unoptimized={true} // For blob URLs
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedFile(null);
                                if (newItem.imageUrl.startsWith('blob:')) {
                                  URL.revokeObjectURL(newItem.imageUrl);
                                }
                                setNewItem(prev => ({ ...prev, imageUrl: '' }));
                              }}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="p-4 bg-white border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {selectedFile.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Boyut: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const previewUrl = URL.createObjectURL(selectedFile);
                                  setOriginalImage(previewUrl);
                                  setShowImageEditor(true);
                                }}
                                className="px-3 py-2 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors font-medium"
                              >
                                Düzenle
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Helpful tips */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                        <div className="flex items-start space-x-2">
                          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="font-medium text-blue-900 mb-1">Görsel İpuçları:</p>
                            <ul className="text-blue-800 space-y-1 text-xs">
                              <li>• Görsel yüklemek isteğe bağlıdır (varsayılan ikon gösterilir)</li>
                              <li>• En iyi deneyim için 16:9 oranında (800x450px gibi) görseller kullanın</li>
                              <li>• Desteklenen formatlar: JPEG, PNG, WebP, GIF</li>
                              <li>• Maksimum dosya boyutu: 5MB</li>
                              <li>• Görseliniz güvenli bir şekilde sunucuda saklanır</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              
              <div className="border-t border-slate-200 p-8 bg-slate-50 rounded-b-3xl">
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    form="addItemForm"
                    disabled={addingItem || uploadingImage}
                    className={`px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg transform hover:scale-105 ${addingItem || uploadingImage ? 'opacity-70 cursor-not-allowed hover:scale-100' : ''}`}
                  >
                    {uploadingImage ? (
                      <span className="flex items-center space-x-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Görsel Yükleniyor...</span>
                      </span>
                    ) : addingItem ? (
                      <span className="flex items-center space-x-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Ekleniyor...</span>
                      </span>
                    ) : 'Ürün Ekle'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Edit Item Modal */}
        {showEditModal && editItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl transform transition-all max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-8 border-b border-slate-200">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Ürün Düzenle</h3>
                  <p className="text-gray-600 mt-1">Global mağaza ürünü - tüm öğrenciler tarafından satın alınabilir</p>
                </div>
                <button
                  onClick={closeEditModal}
                  className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="overflow-y-auto flex-1 p-8">
                <form id="editItemForm" onSubmit={handleEditSubmit} className="space-y-6">
                  
                  <div>
                    <label htmlFor="edit-name" className="block text-sm font-semibold text-gray-900 mb-3">
                      Ürün Adı *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="edit-name"
                        name="name"
                        value={editItem.name}
                        onChange={handleEditInputChange}
                        className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Ürün adını girin"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="edit-description" className="block text-sm font-semibold text-gray-900 mb-3">
                      Açıklama *
                    </label>
                    <textarea
                      id="edit-description"
                      name="description"
                      rows={4}
                      value={editItem.description}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                      placeholder="Ürün açıklamasını girin"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit-pointsRequired" className="block text-sm font-semibold text-gray-900 mb-3">
                      Gerekli Puan *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <input
                        type="number"
                        id="edit-pointsRequired"
                        name="pointsRequired"
                        min="1"
                        value={editItem.pointsRequired || ''}
                        onChange={handleEditInputChange}
                        className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Puan girin"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="edit-imageFile" className="block text-sm font-semibold text-gray-900 mb-3">
                      Ürün Görseli (İsteğe Bağlı)
                    </label>
                    <div className="space-y-4">
                      <div className="relative">
                        <input
                          type="file"
                          id="edit-imageFile"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          onChange={handleEditFileSelect}
                          className="hidden"
                        />
                        <label
                          htmlFor="edit-imageFile"
                          className="w-full flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                        >
                          <div className="text-center">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-lg font-medium text-gray-700 mb-1">
                              {editSelectedFile ? 'Yeni görsel seç' : 'Görsel değiştir'}
                            </p>
                            <p className="text-sm text-gray-500 mb-2">
                              {editSelectedFile ? editSelectedFile.name : 'Dosya seçmek için tıklayın'}
                            </p>
                            <p className="text-xs text-gray-400">
                              JPEG, PNG, WebP, GIF • Maksimum 5MB
                            </p>
                          </div>
                        </label>
                      </div>
                      
                      {/* Current Image Preview */}
                      {(editItem.imageUrl || editSelectedFile) && (
                        <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-white">
                          <div className="relative flex items-center justify-center p-4 min-h-[200px] bg-gray-50">
                            <Image
                              src={editSelectedFile ? editItem.imageUrl! : editItem.imageUrl!}
                              alt="Ürün önizleme"
                              width={400}
                              height={300}
                              className="max-w-full max-h-80 object-contain rounded-lg shadow-sm"
                              unoptimized={editSelectedFile ? true : false}
                              onError={handleEditImageError}
                              onLoad={handleEditImageLoad}
                            />
                            
                            {editSelectedFile && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditSelectedFile(null);
                                  if (editItem.imageUrl && editItem.imageUrl.startsWith('blob:')) {
                                    URL.revokeObjectURL(editItem.imageUrl);
                                  }
                                  // Reset to original image if it exists
                                  const originalItem = items.find(item => item.id === editItem.id);
                                  setEditItem(prev => prev ? { ...prev, imageUrl: originalItem?.imageUrl || '' } : null);
                                }}
                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                          
                          {editSelectedFile && (
                            <div className="p-4 bg-white border-t border-gray-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    <strong>Yeni dosya:</strong> {editSelectedFile.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Boyut: {(editSelectedFile.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </div>
              
              <div className="border-t border-slate-200 p-8 bg-slate-50 rounded-b-3xl">
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    form="editItemForm"
                    disabled={editingItem || editUploadingImage}
                    className={`px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg transform hover:scale-105 ${editingItem || editUploadingImage ? 'opacity-70 cursor-not-allowed hover:scale-100' : ''}`}
                  >
                    {editUploadingImage ? (
                      <span className="flex items-center space-x-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Görsel Yükleniyor...</span>
                      </span>
                    ) : editingItem ? (
                      <span className="flex items-center space-x-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Kaydediliyor...</span>
                      </span>
                    ) : (
                      'Değişiklikleri Kaydet'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Image Editor Modal */}
        {showImageEditor && originalImage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl transform transition-all max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-slate-200">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Görsel Düzenle</h3>
                  <p className="text-gray-600 mt-1">Görseli kırpın, boyutlandırın ve düzenleyin</p>
                </div>
                <button
                  onClick={handleImageEditorCancel}
                  className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <ImageEditor
                  imageSrc={originalImage}
                  onSave={handleImageEditorSave}
                  onCancel={handleImageEditorCancel}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Image Editor Component
const ImageEditor = ({ imageSrc, onSave, onCancel }: {
  imageSrc: string;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);

  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to a reasonable display size while maintaining aspect ratio
    const maxWidth = 500;
    const maxHeight = 400;
    const aspectRatio = img.width / img.height;
    
    let canvasWidth = maxWidth;
    let canvasHeight = maxWidth / aspectRatio;
    
    if (canvasHeight > maxHeight) {
      canvasHeight = maxHeight;
      canvasWidth = maxHeight * aspectRatio;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context
    ctx.save();

    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // Apply transformations
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(scale, scale);
    ctx.rotate((rotation * Math.PI) / 180);

    // Draw the entire image (no cropping)
    ctx.drawImage(
      img,
      -canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight
    );

    // Restore context
    ctx.restore();
  }, [scale, rotation, brightness, contrast]);

  useEffect(() => {
    const img = new (window as any).Image() as HTMLImageElement;
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      drawCanvas();
    };
    img.src = imageSrc;
  }, [imageSrc, drawCanvas]);

  useEffect(() => {
    if (imageLoaded) {
      drawCanvas();
    }
  }, [drawCanvas, imageLoaded]);

  // Remove drag functionality since we're not cropping anymore

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
      }
    }, 'image/png', 0.9);
  };

  const resetFilters = () => {
    setScale(1);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
  };

  return (
    <div className="flex h-full">
      {/* Preview Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="relative bg-white rounded-lg shadow-lg p-4 mb-4">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-96 border border-gray-200 rounded"
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={resetFilters}
            className="px-6 py-3 border border-blue-300 rounded-xl font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            Sıfırla
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg transform hover:scale-105"
          >
            Kaydet ve Kullan
          </button>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Scale Control */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Boyut: {Math.round(scale * 100)}%
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Rotation Control */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Döndürme: {rotation}°
            </label>
            <input
              type="range"
              min="-180"
              max="180"
              step="15"
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Brightness Control */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Parlaklık: {brightness}%
            </label>
            <input
              type="range"
              min="50"
              max="200"
              step="5"
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Contrast Control */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Kontrast: {contrast}%
            </label>
            <input
              type="range"
              min="50"
              max="200"
              step="5"
              value={contrast}
              onChange={(e) => setContrast(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>





          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-blue-900 mb-1">İpuçları:</p>
                <ul className="text-blue-800 space-y-1 text-xs">
                  <li>• Tüm görsel korunur, kırpma yapılmaz</li>
                  <li>• Boyut ayarı ile görseli büyütüp küçültebilirsiniz</li>
                  <li>• Parlaklık ve kontrast ayarları görsel kalitesini artırır</li>
                  <li>• Döndürme ile görseli istediğiniz açıya çevirebilirsiniz</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 