'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function SuperAdminLogout() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-red-300 hover:text-white hover:bg-red-600/80 transition-colors"
    >
      <LogOut className="h-4 w-4" />
      Çıkış
    </button>
  );
}
