'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';
import { Loader2 } from 'lucide-react';

export default function Part10Page() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      const user = session.user as any;
      const roles = user.roles || [user.role];

      if (roles.includes(UserRole.ADMIN) || roles.includes(UserRole.BOARD_MEMBER)) {
        router.replace('/dashboard/part10/admin');
      } else {
        // For now, other roles still see nothing or a default page
        // If there's a student/tutor view later, we can add it here
      }
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto" />
        <p className="text-gray-600 font-medium">Yönlendiriliyorsunuz...</p>
      </div>
    </div>
  );
}
