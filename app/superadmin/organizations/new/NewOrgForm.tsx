'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createOrganization } from '@/app/actions/organizations';
import OrgEntitlementPicker from '../OrgEntitlementPicker';

export default function NewOrgForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [licenseExpiresAt, setLicenseExpiresAt] = useState('');
  const [periodName, setPeriodName] = useState('');

  const [entitlements, setEntitlements] = useState({
    packageIds: [1] as number[],
    extraParts: [] as number[],
    excludedParts: [] as number[],
  });

  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (adminPassword.length < 8) {
      toast.error('Yönetici şifresi en az 8 karakter olmalıdır');
      return;
    }
    if (entitlements.packageIds.length === 0 && entitlements.extraParts.length === 0) {
      toast.error('En az bir paket veya modül seçilmelidir');
      return;
    }

    setSaving(true);
    const result = await createOrganization({
      code,
      name,
      packageIds: entitlements.packageIds,
      extraParts: entitlements.extraParts,
      excludedParts: entitlements.excludedParts,
      licenseExpiresAt: licenseExpiresAt ? new Date(licenseExpiresAt) : null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      periodName: periodName || undefined,
      admin: {
        username: adminUsername,
        password: adminPassword,
        firstName: adminFirstName || undefined,
        lastName: adminLastName || undefined,
      },
    });
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`"${result.data?.code}" kurumu oluşturuldu`);
    router.push(`/superadmin/organizations/${result.data?.id}`);
  };

  const field = 'w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm';
  const label = 'block text-sm font-medium text-slate-700 mb-1.5';

  return (
    <div>
      <Link href="/superadmin" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6">
        <ArrowLeft className="h-4 w-4" />
        Kurumlara dön
      </Link>

      <h1 className="text-2xl font-bold text-slate-800 mb-8">Yeni Kurum</h1>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Kurum Bilgileri</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Kurum Kodu *</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className={`${field} font-mono uppercase`}
                placeholder="ORNEKDER"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Kullanıcılar girişte bu kodu yazacak. 3-20 karakter, harf/rakam/-/_
              </p>
            </div>
            <div>
              <label className={label}>Kurum Adı *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="Örnek Derneği" required />
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
              <p className="text-xs text-slate-500 mt-1">Boş bırakılırsa süresizdir.</p>
            </div>
            <div>
              <label className={label}>İlk Dönem Adı</label>
              <input value={periodName} onChange={(e) => setPeriodName(e.target.value)} className={field} placeholder="2025-2026" />
              <p className="text-xs text-slate-500 mt-1">Boş bırakılırsa içinde bulunulan eğitim yılı kullanılır.</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Paketler ve Modüller</h2>
          <OrgEntitlementPicker {...entitlements} onChange={setEntitlements} />
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-1">Kurum Yöneticisi</h2>
          <p className="text-sm text-slate-500 mb-4">
            Bu hesap kurum yetkilisine teslim edilir. Yetkili kendi kullanıcılarını bu hesapla oluşturur.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Kullanıcı Adı *</label>
              <input
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value.toLowerCase())}
                className={field}
                placeholder="admin"
                required
              />
            </div>
            <div>
              <label className={label}>Şifre *</label>
              <input
                type="text"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className={field}
                placeholder="En az 8 karakter"
                required
              />
            </div>
            <div>
              <label className={label}>Ad</label>
              <input value={adminFirstName} onChange={(e) => setAdminFirstName(e.target.value)} className={field} />
            </div>
            <div>
              <label className={label}>Soyad</label>
              <input value={adminLastName} onChange={(e) => setAdminLastName(e.target.value)} className={field} />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60 transition-colors"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Kurumu Oluştur
        </button>
      </form>
    </div>
  );
}
