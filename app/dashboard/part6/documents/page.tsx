import Link from 'next/link';
import { Button } from '@/components/ui/button';
import PartDocuments from '@/app/components/PartDocuments';

export default function SocialDocumentsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">Belgeler</h2>
                    <p className="text-gray-600">Çalışma yönergeleri, içerik standartları ve sosyal medya ekibi belgeleri.</p>
                </div>
                <Link href="/dashboard/pdfs">
                    <Button variant="outline" className="border-teal-200 text-teal-600 hover:bg-teal-50">
                        Tüm Belgeleri Görüntüle
                    </Button>
                </Link>
            </div>
            <PartDocuments partId={6} gradientFrom="from-teal-600" gradientTo="to-cyan-600" />
        </div>
    );
}
