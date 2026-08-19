import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { Building2, ShieldCheck, UserCog } from 'lucide-react';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import SuperAdminLogout from './SuperAdminLogout';

export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  // `session.user.id` yoksa token boşaltılmış demektir (şifre değişti, kurum
  // kapandı...). Bu durumda /dashboard'a atmak middleware ile sonsuz
  // yönlendirme döngüsü kurar; doğru yer login.
  if (!session?.user?.id) redirect('/login');
  if (!session.user.isSuperAdmin) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/superadmin" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold leading-none">Bilgeverse Sistem Yönetimi</p>
              <p className="text-xs text-slate-400 mt-1">Kurum ve paket yönetimi</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/superadmin"
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Kurumlar
            </Link>
            <Link
              href="/superadmin/account"
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              <UserCog className="h-4 w-4" />
              Hesabım
            </Link>
            <span className="text-sm text-slate-400">@{session.user.username}</span>
            <SuperAdminLogout />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
