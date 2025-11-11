'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { getRoleBasedPath } from '@/app/lib/navigation';
import { useEffect } from 'react';

export default function Part1Page() {
  const router = useRouter();
  const { user, loading, isAdmin, isTutor, isStudent } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      const targetPath = getRoleBasedPath(user.role);
      router.replace(targetPath);
    }
  }, [loading, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-bold mb-4">Bilgeder</div>
        <div className="w-full flex items-center justify-center">
          <div className="loader"></div>
        </div>
        <p className="mt-4 text-gray-600">Yönlendiriliyorsunuz...</p>
      </div>
    </div>
  );
}

