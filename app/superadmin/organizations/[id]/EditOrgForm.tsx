'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, KeyRound, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  updateOrganizationEntitlements,
  createOrganizationAdmin,
  resetOrganizationAdminPassword,
} from '@/app/actions/organizations';
import OrgEntitlementPicker from '../OrgEntitlementPicker';

interface OrgAdmin {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
}

interface Props {
  org: {
    id: string;
    code: string;
    name: string;
    isActive: boolean;
    packageIds: number[];
    extraParts: number[];
    excludedParts: number[];
    licenseExpiresAt: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    notes: string | null;
    admins: OrgAdmin[];
  };
}

export default function EditOrgForm({ org }: Props) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(org.name);
  const [code, setCode] = useState(org.code);
  const [isActive, setIsActive] = useState(org.isActive);
  const [contactEmail, setContactEmail] = useState(org.contactEmail ?? '');
  const [contactPhone, setContactPhone] = useState(org.contactPhone ?? '');
  const [licenseExpiresAt, setLicenseExpiresAt] = useState(
    org.licenseExpiresAt ? org.licenseExpiresAt.slice(0, 10) : ''
  );
  const [notes, setNotes] = useState(org.notes ?? '');

  const [entitlements, setEntitlements] = useState({
    packageIds: org.packageIds,
    extraParts: org.extraParts,
    excludedParts: org.excludedParts,
  });

  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateOrganizationEntitlements(org.id, {
      name,
      code,
      isActive,
      packageIds: entitlements.packageIds,
      extraParts: entitlements.extraParts,
      excludedParts: entitlements.excludedParts,
      licenseExpiresAt: licenseExpiresAt || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      notes: notes || null,
    });
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
    } else if (code !== org.code) {
      toast.success(`Kurum kodu "${code}" olarak değişti. Kullanıcılara bildirin.`);
    } else {
      toast.success('Kurum güncellendi. Değişiklik en geç 5 dakika içinde kullanıcılara yansır.');
    }
  };

  const handleAddAdmin = async () => {
    if (newAdminPassword.length < 8) {
      toast.error('Şifre en az 8 karakter olmalıdır');
      return;
    }
    const result = await createOrganizationAdmin(org.id, {
      username: newAdminUsername,
      password: newAdminPassword,
    });
    if (result.error) toast.error(result.error);
    else {
      toast.success('Yönetici eklendi');
      setNewAdminUsername('');
      setNewAdminPassword('');
    }
  };

  const handleResetPassword = async (userId: string, username: string) => {
    const pw = window.prompt(`"${username}" için yeni şifre (en az 8 karakter):`);
    if (!pw) return;
    const result = await resetOrganizationAdminPassword(userId, pw);
    if (result.error) toast.error(result.error);
    else toast.success(`"${username}" şifresi güncellendi`);
  };

  const field = 'w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm';
  const label = 'block text-sm font-medium text-slate-700 mb-1.5';

  return (
    <div>
      <Link href="/superadmin" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6">
        <ArrowLeft className="h-4 w-4" />
        Kurumlara dön
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700">
          {org.code}
        </span>
        <h1 className="text-2xl font-bold text-slate-800">{org.name}</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Kurum Bilgileri</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Kurum Adı</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={field} required />
            </div>
            <div>
              <label className={label}>Kurum Kodu</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className={`${field} font-mono uppercase`}
                required
              />
              {code !== org.code ? (
                <p className="text-xs text-amber-700 mt-1">
                  Kod <strong>{org.code}</strong> → <strong>{code || '…'}</strong> olarak değişecek.
                  Kurumun tüm kullanıcılarına yeni kodu bildirmeniz gerekir; eski kodla giriş yapılamaz.
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">
                  Kullanıcılar girişte bu kodu yazıyor. Değiştirmek veriye zarar vermez
                  (kayıtlar koda değil kurum kimliğine bağlıdır), ama kullanıcıların
                  yeni kodu öğrenmesi gerekir.
                </p>
              )}
            </div>
            <div>
              <label className={label}>İletişim E-postası</label>
              <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={field} />
            </div>
            <div>
              <label className={label}>İletişim Telefonu</label>
              <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={field} />
            </div>
            <div>
              <label className={label}>Lisans Bitiş Tarihi</label>
              <input type="date" value={licenseExpiresAt} onChange={(e) => setLicenseExpiresAt(e.target.value)} className={field} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-slate-700 pb-2">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Kurum aktif
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Notlar</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={field} rows={2} />
            </div>
          </div>
          {!isActive && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
              Kurum pasife alındığında mevcut oturumlar en geç 5 dakika içinde düşer ve
              kullanıcılar giriş yapamaz.
            </p>
          )}
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Paketler ve Modüller</h2>
          <OrgEntitlementPicker {...entitlements} onChange={setEntitlements} />
        </section>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60 transition-colors"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Değişiklikleri Kaydet
        </button>
      </form>

      <section className="bg-white rounded-xl border border-slate-200 p-6 mt-8 max-w-4xl">
        <h2 className="font-semibold text-slate-800 mb-4">Kurum Yöneticileri</h2>

        <div className="divide-y divide-slate-100 mb-6">
          {org.admins.length === 0 && (
            <p className="text-sm text-slate-500 py-2">Bu kurumda yönetici hesabı yok.</p>
          )}
          {org.admins.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {admin.firstName} {admin.lastName}
                </p>
                <p className="text-xs text-slate-500">@{admin.username}</p>
              </div>
              <button
                type="button"
                onClick={() => handleResetPassword(admin.id, admin.username)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Şifre Sıfırla
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3 pt-4 border-t border-slate-100">
          <div className="flex-1 min-w-[160px]">
            <label className={label}>Yeni yönetici kullanıcı adı</label>
            <input
              value={newAdminUsername}
              onChange={(e) => setNewAdminUsername(e.target.value.toLowerCase())}
              className={field}
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className={label}>Şifre</label>
            <input value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} className={field} />
          </div>
          <button
            type="button"
            onClick={handleAddAdmin}
            disabled={!newAdminUsername || !newAdminPassword}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            Ekle
          </button>
        </div>
      </section>
    </div>
  );
}
