'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2, Plus, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createSuperAdmin,
  resetSuperAdminPassword,
} from '@/app/actions/superadmin-account';

export type SuperAdminRow = {
  id: string;
  username: string;
  fullName: string;
  createdAt: string;
  isSelf: boolean;
};

const field =
  'w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm';
const label = 'block text-sm font-medium text-slate-700 mb-1.5';

export default function SuperAdminList({ admins }: { admins: SuperAdminRow[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  // Şifre sıfırlanacak hesap (kendisi hariç); açıkken satırın altında form.
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetCurrent, setResetCurrent] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await createSuperAdmin({
      username,
      password,
      firstName,
      lastName,
      currentPassword,
    });
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`"${username}" süper admin olarak eklendi`);
    setUsername('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setCurrentPassword('');
    setAdding(false);
    router.refresh();
  };

  const handleReset = async (e: React.FormEvent, userId: string) => {
    e.preventDefault();
    setResetting(true);
    const result = await resetSuperAdminPassword(userId, resetPassword, resetCurrent);
    setResetting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success('Şifre sıfırlandı');
    setResetFor(null);
    setResetPassword('');
    setResetCurrent('');
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-6 mt-6">
      <div className="flex items-center justify-between gap-4 mb-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold text-slate-800">Süper Adminler</h2>
        </div>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Tek süper admin kalmasın: erişimini kaybedersen kurtarmanın tek yolu veritabanı script'i olur.
      </p>

      <ul className="divide-y divide-slate-100 border-y border-slate-100">
        {admins.map((admin) => (
          <li key={admin.id} className="py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">
                  <span className="font-mono">{admin.username}</span>
                  {admin.isSelf && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      siz
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {admin.fullName || '—'} · {new Date(admin.createdAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
              {!admin.isSelf && (
                <button
                  type="button"
                  onClick={() => setResetFor(resetFor === admin.id ? null : admin.id)}
                  className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 shrink-0"
                >
                  <KeyRound className="h-4 w-4" />
                  Şifre sıfırla
                </button>
              )}
            </div>

            {resetFor === admin.id && (
              <form onSubmit={(e) => handleReset(e, admin.id)} className="mt-3 grid sm:grid-cols-2 gap-3 bg-slate-50 rounded-lg p-3">
                <div>
                  <label className={label}>Yeni Şifre *</label>
                  <input
                    type="password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    className={field}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
                <div>
                  <label className={label}>Kendi Şifreniz *</label>
                  <input
                    type="password"
                    value={resetCurrent}
                    onChange={(e) => setResetCurrent(e.target.value)}
                    className={field}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={resetting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-60"
                  >
                    {resetting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Sıfırla
                  </button>
                </div>
              </form>
            )}
          </li>
        ))}
      </ul>

      {adding && (
        <form onSubmit={handleCreate} className="mt-5 grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Kullanıcı Adı *</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className={`${field} font-mono`}
              required
            />
          </div>
          <div>
            <label className={label}>Şifre *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={field}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div>
            <label className={label}>Ad</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>Soyad</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={field} />
          </div>
          <div className="sm:col-span-2 pt-3 border-t border-slate-100">
            <label className={label}>Kendi Şifreniz *</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={`${field} sm:max-w-xs`}
              autoComplete="current-password"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Yeni bir sistem sahibi yaratmak en yetkili işlem; şifrenizle doğrulanır.
            </p>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Süper Admin Ekle
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
