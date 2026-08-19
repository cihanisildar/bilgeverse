'use client';

import { PACKAGES } from '@/app/lib/packages';
import { PARTS } from '@/app/lib/parts';

interface Props {
  packageIds: number[];
  extraParts: number[];
  excludedParts: number[];
  onChange: (next: { packageIds: number[]; extraParts: number[]; excludedParts: number[] }) => void;
}

/**
 * Paket seçimi + tekil modül istisnaları.
 *
 * Bir modül pakete dahilse "kapat" istisnası, dahil değilse "aç" istisnası
 * sunulur. Böylece müşteriye "şu kuruma sadece Maliye'yi de verelim" gibi
 * talepler kod değişikliği olmadan karşılanabilir.
 */
export default function OrgEntitlementPicker({ packageIds, extraParts, excludedParts, onChange }: Props) {
  const partsFromPackages = new Set<number>();
  for (const pkg of PACKAGES) {
    if (packageIds.includes(pkg.id)) pkg.parts.forEach((p) => partsFromPackages.add(p));
  }

  const togglePackage = (id: number) => {
    const next = packageIds.includes(id)
      ? packageIds.filter((p) => p !== id)
      : [...packageIds, id];

    // Paket kapatılınca ona ait istisnaları da temizle ki eski seçimler
    // sessizce takılı kalmasın.
    const pkg = PACKAGES.find((p) => p.id === id)!;
    onChange({
      packageIds: next,
      extraParts: extraParts.filter((p) => !pkg.parts.includes(p)),
      excludedParts: excludedParts.filter((p) => !pkg.parts.includes(p)),
    });
  };

  const togglePart = (partId: number) => {
    const inPackage = partsFromPackages.has(partId);

    if (inPackage) {
      onChange({
        packageIds,
        extraParts,
        excludedParts: excludedParts.includes(partId)
          ? excludedParts.filter((p) => p !== partId)
          : [...excludedParts, partId],
      });
    } else {
      onChange({
        packageIds,
        excludedParts,
        extraParts: extraParts.includes(partId)
          ? extraParts.filter((p) => p !== partId)
          : [...extraParts, partId],
      });
    }
  };

  const isEnabled = (partId: number) =>
    (partsFromPackages.has(partId) || extraParts.includes(partId)) && !excludedParts.includes(partId);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Paketler</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {PACKAGES.map((pkg) => (
            <label
              key={pkg.id}
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                packageIds.includes(pkg.id)
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={packageIds.includes(pkg.id)}
                onChange={() => togglePackage(pkg.id)}
                className="mt-1"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{pkg.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{pkg.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Modül istisnaları</h3>
        <p className="text-xs text-slate-500 mb-3">
          Paketten bağımsız olarak tek tek modül açıp kapatabilirsiniz. Kapatma her zaman önceliklidir.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {PARTS.map((part) => {
            const enabled = isEnabled(part.id);
            const inPackage = partsFromPackages.has(part.id);
            return (
              <label
                key={part.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                  enabled ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                <input type="checkbox" checked={enabled} onChange={() => togglePart(part.id)} />
                <span className="truncate">{part.name}</span>
                {inPackage && (
                  <span className="ml-auto text-[10px] text-slate-400 shrink-0">pakette</span>
                )}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
