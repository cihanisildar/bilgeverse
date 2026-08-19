import Link from 'next/link';
import { Building2, Plus, Users, AlertTriangle } from 'lucide-react';
import { listOrganizations } from '@/app/actions/organizations';
import { PACKAGES } from '@/app/lib/packages';
import { PARTS } from '@/app/lib/parts';

export const dynamic = 'force-dynamic';

export default async function SuperAdminHomePage() {
  const { data: orgs, error } = await listOrganizations();

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kurumlar</h1>
          <p className="text-slate-500 text-sm mt-1">
            {orgs?.length ?? 0} kurum kayıtlı
          </p>
        </div>
        <Link
          href="/superadmin/organizations/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni Kurum
        </Link>
      </div>

      {(!orgs || orgs.length === 0) && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Henüz kurum eklenmemiş.</p>
        </div>
      )}

      <div className="grid gap-4">
        {orgs?.map((org) => {
          const expired = org.licenseExpiresAt && new Date(org.licenseExpiresAt) < new Date();
          return (
            <Link
              key={org.id}
              href={`/superadmin/organizations/${org.id}`}
              className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700">
                      {org.code}
                    </span>
                    <h2 className="font-semibold text-slate-800">{org.name}</h2>
                    {!org.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Pasif</span>
                    )}
                    {expired && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Lisans doldu
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {PACKAGES.map((pkg) => (
                      <span
                        key={pkg.id}
                        className={
                          org.packageIds.includes(pkg.id)
                            ? 'text-xs px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'text-xs px-2 py-1 rounded-md bg-slate-50 text-slate-400 border border-slate-200'
                        }
                      >
                        {pkg.name}
                      </span>
                    ))}
                  </div>

                  {(org.extraParts.length > 0 || org.excludedParts.length > 0) && (
                    <p className="text-xs text-slate-500 mt-2">
                      {org.extraParts.length > 0 && (
                        <>Ek modüller: {org.extraParts.map(partName).join(', ')} </>
                      )}
                      {org.excludedParts.length > 0 && (
                        <>· Kapatılan: {org.excludedParts.map(partName).join(', ')}</>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-sm text-slate-500 shrink-0">
                  <Users className="h-4 w-4" />
                  {org.userCount}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function partName(partId: number): string {
  return PARTS.find((p) => p.id === partId)?.name ?? `Modül ${partId}`;
}
