'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HeaderSkeleton, SearchFilterSkeleton, UserCardSkeleton } from '@/app/components/ui/skeleton-shimmer';
import { UserRole } from '@prisma/client';

type User = {
  id: string;
  username: string;
  role: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
  points: number;
  createdAt: string;
  isActive: boolean;
  statusChangedAt?: string;
  statusChangedBy?: string;
  tutor?: {
    id: string;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
};

export default function AdminUsersPage() {
  const toast = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState('');

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [finalConfirmationOpen, setFinalConfirmationOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string, username: string } | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string, role: string, status: string) => {
      if (!users.length) return;

      const lowercaseQuery = query.toLowerCase().trim();
      const filtered = users.filter((user) => {
        const matchesSearch =
          !lowercaseQuery ||
          user.username.toLowerCase().includes(lowercaseQuery) ||

          (user.firstName?.toLowerCase() || '').includes(lowercaseQuery) ||
          (user.lastName?.toLowerCase() || '').includes(lowercaseQuery);

        const matchesRole = !role || (user.roles && user.roles.some(r => r.toLowerCase() === role.toLowerCase())) || user.role.toLowerCase() === role.toLowerCase();
        const matchesStatus = !status || (status === 'active' ? user.isActive : !user.isActive);

        return matchesSearch && matchesRole && matchesStatus;
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
      debouncedSearch(searchQuery, roleFilter, statusFilter);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [searchQuery, roleFilter, statusFilter, debouncedSearch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleRoleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      setStatusUpdateLoading(userId);

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kullanıcı durumu güncellenirken hata oluştu');
      }

      const updatedUser = await response.json();

      // Update users in state
      setUsers(users.map(user =>
        user.id === userId ? { ...user, isActive: !currentStatus, statusChangedAt: new Date().toISOString() } : user
      ));
      setFilteredUsers(filteredUsers.map(user =>
        user.id === userId ? { ...user, isActive: !currentStatus, statusChangedAt: new Date().toISOString() } : user
      ));

      toast.success(`Kullanıcı durumu ${!currentStatus ? 'aktif' : 'pasif'} olarak güncellendi`);
    } catch (err: any) {
      console.error('Status update error:', err);
      toast.error(err.message || 'Kullanıcı durumu güncellenirken hata oluştu');
    } finally {
      setStatusUpdateLoading('');
    }
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
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'tutor':
        return 'bg-blue-100 text-blue-800';
      case 'asistan':
        return 'bg-purple-100 text-purple-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      case 'athlete':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleTranslation = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'Yönetici';
      case 'tutor':
        return 'Rehber';
      case 'asistan':
        return 'Lider';
      case 'student':
        return 'Öğrenci';
      case 'athlete':
        return 'Sporcu';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        <HeaderSkeleton />
        <SearchFilterSkeleton />
        <div className="bg-white shadow-md rounded-xl border border-gray-100">
          <div className="overflow-x-auto overflow-y-visible">
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
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-8" style={{ overflow: 'visible' }}>
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-blue-800 rounded-xl p-4 sm:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Kullanıcı Yönetimi</h1>
            <p className="text-sm sm:text-base text-indigo-100 mt-1">Kullanıcıları yönet, düzenle ve takip et</p>
          </div>
          <Link
            href="/dashboard/part7/admin/users/new"
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
                <option value={UserRole.TUTOR}>Rehber</option>
                <option value={UserRole.ASISTAN}>Lider</option>
                <option value={UserRole.STUDENT}>Öğrenci</option>
                <option value={(UserRole as any).ATHLETE}>Sporcu</option>
              </select>
            </div>
          </div>
          <div className="w-full sm:w-48 md:w-60">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <select
                value={statusFilter}
                onChange={handleStatusFilter}
                className="block w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors appearance-none"
              >
                <option value="">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="passive">Pasif</option>
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
            href="/dashboard/part7/admin/users/new"
            className="mt-4 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg flex items-center justify-center text-sm font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            İlk Kullanıcıyı Oluştur
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-xl border border-gray-100 relative" style={{ overflow: 'visible' }}>
          <div className="overflow-x-auto overflow-y-visible relative" style={{ overflowY: 'visible' }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Rol
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      Durum
                      <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 2L9 13" />
                        </svg>
                        <span className="text-xs text-blue-700 font-medium">Tıklanabilir</span>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Danışman
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
                      <div className="flex flex-wrap gap-1">
                        {(user.roles && user.roles.length > 0 ? user.roles : [user.role]).map((r, i) => (
                          <span key={i} className={`px-2.5 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(r)}`}>
                            {getRoleTranslation(r)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap hidden sm:table-cell">
                      <button
                        onClick={() => handleStatusToggle(user.id, user.isActive)}
                        disabled={statusUpdateLoading === user.id}
                        className={`group relative px-3 sm:px-4 py-1.5 inline-flex items-center text-xs leading-5 font-semibold rounded-lg transition-all duration-200 transform ${user.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200 hover:shadow-md border-2 border-green-200 hover:border-green-300'
                          : 'bg-red-100 text-red-800 hover:bg-red-200 hover:shadow-md border-2 border-red-200 hover:border-red-300'
                          } ${statusUpdateLoading === user.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                      >
                        {statusUpdateLoading === user.id ? (
                          <div className="flex items-center gap-1">
                            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Güncelleniyor...
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${user.isActive ? 'text-green-600' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              {user.isActive ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              )}
                            </svg>
                            <span>{user.isActive ? 'Aktif' : 'Pasif'}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </div>
                        )}
                        {/* Subtle hover hint */}
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                          Durumu değiştirmek için tıkla
                        </div>
                      </button>
                    </td>
                    <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                      {((user.roles && user.roles.includes('STUDENT')) || user.role.toLowerCase() === 'student') && user.tutor ? (
                        user.tutor.firstName && user.tutor.lastName
                          ? `${user.tutor.firstName} ${user.tutor.lastName}`
                          : user.tutor.username
                      ) : '-'}
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
                          href={`/dashboard/part7/admin/users/${user.id}`}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600">⚠️ Önemli Uyarı</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <p className="font-medium text-gray-900">
                {userToDelete?.username} kullanıcısını sildiğinizde aşağıdaki veriler de kalıcı olarak silinecektir:
              </p>

              {/* General deletion consequences */}
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                <li>Kullanıcının tüm puan işlemleri</li>
                <li>Kullanıcının tüm deneyim puanları ve işlemleri</li>
                <li>Kullanıcının tüm mağaza ürün talepleri</li>
                <li>Kullanıcının tüm etkinlik katılımları</li>
                <li>Kullanıcının oluşturduğu tüm etkinlikler</li>
                <li>Kullanıcının yazdığı/hakkında yazılan tüm notlar ve raporlar</li>
              </ul>

              {/* Tutor/Asistan-specific consequences */}
              {userToDelete?.id && (() => {
                const target = users.find(u => u.id === userToDelete.id);
                const r = target?.roles || [target?.role];
                return r.some(v => v?.toLowerCase() === 'tutor' || v?.toLowerCase() === 'asistan');
              })() && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-red-800 mb-2">🎓 Öğretmen/Asistan Silme - Özel Durumlar:</h4>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-red-700">
                      <li><strong>Öğrenciler yetim kalacak:</strong> Bu kişinin tüm öğrencileri danışmansız kalacak ve manuel olarak yeni bir danışmana atanmaları gerekecek</li>
                      <li><strong>Sınıf tamamen silinecek:</strong> Bu kişinin sınıfı sistemden kalıcı olarak kaldırılacak</li>
                      <li><strong>Mağaza ürünleri silinecek:</strong> Bu kişinin oluşturduğu tüm mağaza ürünleri silinecek</li>
                      <li><strong>Öğrenci geçmişi kaybolacak:</strong> Öğrencilerin bu kişiyle olan tüm puan/deneyim geçmişi silinecek</li>
                      <li><strong>Öğrenci notları kaybolacak:</strong> Bu kişinin öğrenciler hakkında yazdığı tüm notlar ve raporlar silinecek</li>
                    </ul>
                    <p className="mt-3 text-sm text-red-800 font-medium">
                      💡 <strong>Öneri:</strong> Silmeden önce öğrencileri başka bir danışmana atamayı düşünün.
                    </p>
                  </div>
                )}

              {/* Student-specific consequences */}
              {userToDelete?.id && (() => {
                const target = users.find(u => u.id === userToDelete.id);
                const r = target?.roles || [target?.role];
                return r.some(v => v?.toLowerCase() === 'student');
              })() && (
                  <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-orange-800 mb-2">📚 Öğrenci Silme - Özel Durumlar:</h4>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-orange-700">
                      <li>Öğrencinin tüm akademik geçmişi ve progress kayıtları silinecek</li>
                      <li>Öğrencinin dilek listesindeki tüm istekler silinecek</li>
                      <li>Öğrencinin katıldığı etkinlik kayıtları silinecek</li>
                    </ul>
                  </div>
                )}

              {/* Admin-specific consequences */}
              {userToDelete?.id && (() => {
                const target = users.find(u => u.id === userToDelete.id);
                const r = target?.roles || [target?.role];
                return r.some(v => v?.toLowerCase() === 'admin');
              })() && (
                  <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">👑 Yönetici Silme - Özel Durumlar:</h4>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-purple-700">
                      <li>Bu yöneticinin oluşturduğu puan kartları silinecek</li>
                      <li>Bu yöneticinin işlediği kayıt istekleri kayıtları temizlenecek</li>
                      <li>Sistem yönetim geçmişi etkilenebilir</li>
                    </ul>
                  </div>
                )}

              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-red-600 font-bold text-center">
                  ⚠️ BU İŞLEM GERİ ALINAMAZ! ⚠️
                </p>
                <p className="text-gray-700 text-sm text-center mt-2">
                  Silinen veriler hiçbir şekilde geri getirilemez. Devam etmek istediğinizden kesinlikle emin misiniz?
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={cancelDelete}
                disabled={deleteLoading}
              >
                İptal Et
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
                  'Evet, Kesin Sil'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 