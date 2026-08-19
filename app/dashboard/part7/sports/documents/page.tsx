import React from 'react';
import PartDocuments from '@/app/components/PartDocuments';
import { requireAuth } from '@/app/lib/auth-utils';
import ManagerGuard from '@/app/dashboard/part9/_components/ManagerGuard';

export default async function Part7SportsDocumentsPage() {
    // Layout zaten kapıyı kuruyor; burada tekrarlanmasının sebebi PartDocuments'ın
    // kurum bağlamını bulabilmesi için sayfanın dinamik render edilmesi.
    await requireAuth({ partId: 9 });

    return (
        <ManagerGuard>
            <div className="space-y-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Belgeler</h2>
                    <p className="text-sm text-gray-500">
                        Disiplin yönetmeliği, turnuva belgeleri ve kulüple ilgili paylaşılan kaynaklar.
                    </p>
                </div>
                <PartDocuments partId={9} gradientFrom="from-slate-600" gradientTo="to-indigo-600" />
            </div>
        </ManagerGuard>
    );
}
