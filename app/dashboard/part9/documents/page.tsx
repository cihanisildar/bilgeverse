import React from 'react';
import PartDocuments from '@/app/components/PartDocuments';
import { requireAuth } from '@/app/lib/auth-utils';

export default async function Page() {
    // Oturum + kurum paketi kontrolü; ayrıca sayfanın build sırasında statik
    // üretilip PartDocuments'ın kurum bağlamı bulamamasını engeller.
    await requireAuth({ partId: 9 });

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-bold text-gray-800">Belgeler</h2>
                <p className="text-sm text-gray-500">
                    Disiplin yönetmeliği, turnuva belgeleri ve kulüple ilgili paylaşılan kaynaklar.
                </p>
            </div>
            <PartDocuments partId={9} gradientFrom="from-slate-600" gradientTo="to-indigo-600" />
        </div>
    );
}
