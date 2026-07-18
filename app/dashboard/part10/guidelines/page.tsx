import { requireAuth } from '@/app/lib/auth-utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import PartDocuments from '@/app/components/PartDocuments';

export default async function GuidelinesPage() {
    await requireAuth({ partId: 10 });

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                <Link href="/dashboard/part10">
                    <Button variant="ghost" className="mb-6"><ArrowLeft className="h-4 w-4 mr-2" />Gençlik Merkezine Dön</Button>
                </Link>

                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-100 rounded-lg"><FileText className="h-6 w-6 text-emerald-600" /></div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Yönergeler</h1>
                        <p className="text-sm text-gray-500">Personel alımı, dernek defterleri, iç denetim ve DERBİS yönergeleri (PDF/Word)</p>
                    </div>
                </div>

                <div className="mt-6">
                    <PartDocuments partId={10} gradientFrom="from-emerald-600" gradientTo="to-teal-600" />
                </div>
            </div>
        </div>
    );
}
