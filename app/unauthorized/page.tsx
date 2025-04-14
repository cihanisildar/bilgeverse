'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

export default function UnauthorizedPage() {
  const { user, isAdmin, isTutor, isStudent } = useAuth();
  const router = useRouter();

  // Determine where to send the user based on their role
  const getDashboardLink = () => {
    if (isAdmin) return '/admin';
    if (isTutor) return '/tutor';
    if (isStudent) return '/student';
    return '/login';
  };

  const dashboardLink = getDashboardLink();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-red-600">
            Access Denied
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You do not have permission to access this page.
          </p>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-16 w-16 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V3m0 0l-3 3m3-3l3 3"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Yetkisiz Erişim</h3>
              <p className="mt-1 text-sm text-gray-500">
                Hesabınızın bu sayfayı görüntülemek için gerekli izinleri bulunmamaktadır.
              </p>
              <div className="mt-6">
                <Link
                  href={dashboardLink}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white hover:text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Panele Geri Dön
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-500">
            Bunun bir hata olduğunu düşünüyorsanız, lütfen sistem yöneticisiyle iletişime geçin.
          </p>
        </div>
      </div>
    </div>
  );
} 