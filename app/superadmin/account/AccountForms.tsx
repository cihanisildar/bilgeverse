'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { ArrowLeft, KeyRound, Loader2, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  updateSuperAdminProfile,
  changeSuperAdminPassword,
} from '@/app/actions/superadmin-account';
import { SYSTEM_ORG_CODE } from '@/lib/constants/tenant';

type Account = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
};

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm';
const label = 'block text-sm font-medium text-slate-700 mb-1.5';
const button =
  'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-60';

export default function AccountForms({ account }: { account: Account }) {
  const [username, setUsername] = useState(account.username);
  const [email, setEmail] = useState(account.email);
  const [firstName, setFirstName] = useState(account.firstName);
  const [lastName, setLastName] = useState(account.lastName);
  const [profilePassword, setProfilePassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Kullanıcı adı ya da şifre değiştiğinde oturumdaki JWT eskir; yeni
  // bilgilerle tekrar giriş yapılması gerekir.
  const reLogin = (message: string) => {
    toast.success(message);
    setTimeout(() => signOut({ callbackUrl: '/login' }), 1500);
  };

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const result = await updateSuperAdminProfile({
      username,
      email,
      firstName,
      lastName,
      currentPassword: profilePassword,
    });
    setSavingProfile(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setProfilePassword('');
    if (result.data?.mustReLogin) {
      reLogin('Kullanıcı adı değişti, yeni bilgilerle giriş yapın');
    } else {
      toast.success('Hesap bilgileri güncellendi');
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== newPassword2) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    setSavingPassword(true);
    const result = await changeSuperAdminPassword({ currentPassword, newPassword });
    setSavingPassword(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setNewPassword2('');
    reLogin('Şifre değişti, yeni şifreyle giriş yapın');
  };

  return (
    <div>
      <Link href="/superadmin" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6">
        <ArrowLeft className="h-4 w-4" />
        Kurumlara dön
      </Link>

      <h1 className="text-2xl font-bold text-slate-800">Hesabım</h1>
      <p className="text-slate-500 text-sm mt-1 mb-8">
        Süper admin giriş bilgileriniz. Girişte kurum kodu olarak{' '}
        <span className="font-mono font-semibold text-slate-700">{SYSTEM_ORG_CODE}</span> yazılır.
      </p>

      <form onSubmit={handleProfile} className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <UserCog className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold text-slate-800">Hesap Bilgileri</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Kullanıcı Adı *</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className={`${field} font-mono`}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              3-20 karakter; küçük harf, rakam, . _ -
            </p>
          </div>
          <div>
            <label className={label}>E-posta *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} required />
          </div>
          <div>
            <label className={label}>Ad</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>Soyad</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={field} />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <label className={label}>Mevcut Şifre *</label>
          <input
            type="password"
            value={profilePassword}
            onChange={(e) => setProfilePassword(e.target.value)}
            className={`${field} sm:max-w-xs`}
            autoComplete="current-password"
            required
          />
          <p className="text-xs text-slate-500 mt-1">Kimlik bilgilerini değiştirmek için şifrenizi doğrulayın.</p>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button type="submit" disabled={savingProfile} className={button}>
            {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
            Kaydet
          </button>
          {username !== account.username && (
            <span className="text-xs text-amber-700">
              Kullanıcı adı değişince yeniden giriş yapmanız istenecek.
            </span>
          )}
        </div>
      </form>

      <form onSubmit={handlePassword} className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold text-slate-800">Şifre Değiştir</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={label}>Mevcut Şifre *</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={`${field} sm:max-w-xs`}
              autoComplete="current-password"
              required
            />
          </div>
          <div>
            <label className={label}>Yeni Şifre *</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={field}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <p className="text-xs text-slate-500 mt-1">En az 8 karakter.</p>
          </div>
          <div>
            <label className={label}>Yeni Şifre (Tekrar) *</label>
            <input
              type="password"
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              className={field}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
        </div>

        <button type="submit" disabled={savingPassword} className={`${button} mt-5`}>
          {savingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
          Şifreyi Değiştir
        </button>
        <p className="text-xs text-slate-500 mt-3">
          Şifre değişince oturum kapatılır ve yeni şifreyle giriş yapmanız istenir.
        </p>
      </form>
    </div>
  );
}
