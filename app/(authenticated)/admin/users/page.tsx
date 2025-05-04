'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HeaderSkeleton, SearchFilterSkeleton, UserCardSkeleton } from '../../../components/ui/skeleton-shimmer';
import { UserRole } from '@prisma/client';

type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  points: number;
  createdAt: string;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [finalConfirmationOpen, setFinalConfirmationOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string, username: string } | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string, role: string) => {
      if (!users.length) return;

      const lowercaseQuery = query.toLowerCase().trim();
      const filtered = users.filter((user) => {
        const matchesSearch =
          !lowercaseQuery ||
          user.username.toLowerCase().includes(lowercaseQuery) ||
          user.email.toLowerCase().includes(lowercaseQuery) ||
          (user.firstName?.toLowerCase() || '').includes(lowercaseQuery) ||
          (user.lastName?.toLowerCase() || '').includes(lowercaseQuery);

        const matchesRole = !role || user.role.toLowerCase() === role.toLowerCase();

        return matchesSearch && matchesRole;
      });

      setFilteredUsers(filtered);
    },
    [users]
  );

  // Effect for fetching users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        if (!data.users || !Array.isArray(data.users)) {
          throw new Error('Invalid response format');
        }
        
        setUsers(data.users);
        setFilteredUsers(data.users);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Kullanıcılar yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Effect for handling search and filter
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(searchQuery, roleFilter);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [searchQuery, roleFilter, debouncedSearch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleRoleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    setUserToDelete({ id: userId, username });
    setDeleteDialogOpen(true);
  };

  const proceedToFinalConfirmation = () => {
    setDeleteDialogOpen(false);
    setFinalConfirmationOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      setDeleteLoading(true);
      
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kullanıcı silinirken bir hata oluştu');
      }
      
      // Remove user from state
      setUsers(users.filter(user => user.id !== userToDelete.id));
      setFilteredUsers(filteredUsers.filter(user => user.id !== userToDelete.id));
      
      // Show success toast
      toast.success(`${userToDelete.username} kullanıcısı başarıyla silindi`);
      
      // Close both dialogs
      setDeleteDialogOpen(false);
      setFinalConfirmationOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      console.error('Delete user error:', err);
      toast.error(err.message || 'Kullanıcı silinirken bir hata oluştu');
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setFinalConfirmationOpen(false);
    setUserToDelete(null);
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'tutor':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleTranslation = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Yönetici';
      case 'tutor':
        return 'Öğretmen';
      case 'student':
        return 'Öğrenci';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-8">
        <HeaderSkeleton />
        <SearchFilterSkeleton />
        <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-posta
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kayıt Tarihi
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[1, 2, 3, 4, 5].map((i) => (
                  <UserCardSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-blue-800 rounded-xl p-4 sm:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Kullanıcı Yönetimi</h1>
            <p className="text-sm sm:text-base text-indigo-100 mt-1">Kullanıcıları yönet, düzenle ve takip et</p>
          </div>
          <Link 
            href="/admin/users/new"
            className="w-full sm:w-auto bg-white text-indigo-700 hover:bg-indigo-50 py-2 sm:py-2.5 px-4 sm:px-5 rounded-lg flex items-center justify-center sm:justify-start text-sm font-medium transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Yeni Kullanıcı
          </Link>
        </div>
      </div>
      
      {/* Search and filter */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Kullanıcı ara..."
              className="block w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <div className="w-full sm:w-48 md:w-60">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <select
                value={roleFilter}
                onChange={handleRoleFilter}
                className="block w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors appearance-none"
              >
                <option value="">Tüm Roller</option>
                <option value={UserRole.ADMIN}>Yönetici</option>
                <option value={UserRole.TUTOR}>Öğretmen</option>
                <option value={UserRole.STUDENT}>Öğrenci</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white shadow-sm rounded-xl p-6 sm:p-8 text-center text-gray-500 border border-gray-100 flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mb-3 sm:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-base sm:text-lg font-medium">
            {searchQuery || roleFilter 
              ? 'Arama kriterlerine uygun kullanıcı bulunamadı.' 
              : 'Henüz kullanıcı bulunmuyor.'}
          </p>
          <Link 
            href="/admin/users/new"
            className="mt-4 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            İlk Kullanıcıyı Oluştur
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Rol
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    E-posta
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Puan
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Kayıt Tarihi
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm sm:text-base">
                          {user.firstName 
                            ? user.firstName.charAt(0) 
                            : user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user.username}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                            {user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap hidden sm:table-cell">
                      <span className={`px-2.5 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                        {getRoleTranslation(user.role)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                      {user.email}
                    </td>
                    <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap hidden lg:table-cell">
                      <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {user.points} puan
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                      {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                        <Link 
                          href={`/admin/users/${user.id}`}
                          className="inline-flex items-center justify-center px-2.5 sm:px-3 py-1 sm:py-1.5 border border-indigo-500 text-indigo-600 bg-white hover:bg-indigo-50 rounded-md transition-colors text-xs sm:text-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Düzenle
                        </Link>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="inline-flex items-center justify-center px-2.5 sm:px-3 py-1 sm:py-1.5 border border-red-500 text-red-600 bg-white hover:bg-red-50 rounded-md transition-colors text-xs sm:text-sm"
                          disabled={deleteLoading}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Initial Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcıyı Sil</DialogTitle>
            <DialogDescription>
              {userToDelete?.username} kullanıcısını silmek istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={cancelDelete}
                disabled={deleteLoading}
              >
                İptal
              </Button>
              <Button
                onClick={proceedToFinalConfirmation}
                disabled={deleteLoading}
                variant="destructive"
              >
                Devam Et
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Confirmation Dialog with Detailed Information */}
      <Dialog open={finalConfirmationOpen} onOpenChange={setFinalConfirmationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">⚠️ Önemli Uyarı</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <p className="font-medium text-gray-900">
                {userToDelete?.username} kullanıcısını sildiğinizde aşağıdaki veriler de kalıcı olarak silinecektir:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                <li>Kullanıcının tüm puan işlemleri</li>
                <li>Kullanıcının tüm deneyim puanları ve işlemleri</li>
                <li>Kullanıcının tüm mağaza ürün talepleri</li>
                {userToDelete?.id && users.find(u => u.id === userToDelete.id)?.role === 'tutor' && (
                  <li className="text-red-600">Öğretmenin mağazadaki tüm ürünleri</li>
                )}
                <li>Kullanıcının tüm etkinlik katılımları</li>
                <li>Kullanıcının oluşturduğu tüm etkinlikler</li>
                <li>Öğretmen ise, öğrencilerinin öğretmen bağlantısı kaldırılacak</li>
              </ul>
              <p className="text-red-600 font-medium pt-2">
                Bu işlem geri alınamaz. Devam etmek istediğinizden emin misiniz?
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={cancelDelete}
                disabled={deleteLoading}
              >
                İptal
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleteLoading}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Siliniyor...
                  </>
                ) : (
                  'Evet, Sil'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 