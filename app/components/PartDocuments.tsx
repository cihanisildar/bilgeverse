import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ExternalLink, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type PartPdf = {
    id: string;
    partId: number;
    title: string;
    description: string | null;
    driveLink: string;
    contentType: string | null;
    isActive: boolean;
    createdAt: string;
    uploadedBy: {
        id: string;
        username: string;
        firstName: string | null;
        lastName: string | null;
    };
};

interface PartDocumentsProps {
    partId: number;
    gradientFrom: string;
    gradientTo: string;
}

import prisma from '@/lib/prisma';

// Helper to fetch documents directly from DB
async function getPartDocuments(partId: number) {
    try {
        const documents = await prisma.partPdf.findMany({
            where: {
                partId: partId,
            },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return documents;
    } catch (error) {
        console.error('Error fetching documents:', error);
        return [];
    }
}

function formatDate(dateString: Date): string {
    return new Date(dateString).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export default async function PartDocuments({ partId, gradientFrom, gradientTo }: PartDocumentsProps) {
    const pdfs = await getPartDocuments(partId);

    if (pdfs.length === 0) {
        return (
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <CardContent className="text-center py-12">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br ${gradientFrom.replace('from-', 'from-').replace('-600', '-100')} ${gradientTo.replace('to-', 'to-').replace('-600', '-100')} mb-6`}>
                        <FileText className={`h-10 w-10 ${gradientFrom.replace('from-', 'text-')}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Henüz belge eklenmemiş</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                        Bu bölüm için henüz belge paylaşılmamış.
                    </p>
                    <Link href="/dashboard/belgeler">
                        <Button className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} hover:${gradientFrom.replace('-600', '-700')} hover:${gradientTo.replace('-600', '-700')} text-white shadow-lg`}>
                            <FileText className="h-4 w-4 mr-2" />
                            Belge Ekle
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {pdfs.map((pdf) => (
                <Card
                    key={pdf.id}
                    className="group border-0 shadow-md rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white"
                >
                    <div className={`h-1.5 bg-gradient-to-r ${gradientFrom} ${gradientTo}`}></div>
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div className={`p-2.5 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-lg shadow-md group-hover:scale-110 transition-transform shrink-0`}>
                                    <FileText className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <CardTitle className={`text-lg font-bold text-gray-800 mb-1 line-clamp-2 group-hover:${gradientFrom.replace('from-', 'text-')} transition-colors`}>
                                        {pdf.title}
                                    </CardTitle>
                                </div>
                            </div>
                        </div>
                        {pdf.description && (
                            <CardDescription className="mt-2 line-clamp-2 text-sm">
                                {pdf.description}
                            </CardDescription>
                        )}
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex items-center gap-2 mb-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${pdf.isActive
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                                }`}>
                                <Power className={`h-3 w-3 mr-1 ${pdf.isActive ? 'text-white' : 'text-gray-500'}`} />
                                {pdf.isActive ? 'Aktif' : 'Pasif'}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1.5 mb-4 pb-4 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Yükleyen:</span>
                                <span className="font-semibold text-gray-700">{pdf.uploadedBy.username}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Tarih:</span>
                                <span className="font-semibold text-gray-700">{formatDate(pdf.createdAt)}</span>
                            </div>
                        </div>
                        <Link href={pdf.driveLink} target="_blank" rel="noopener noreferrer">
                            <Button
                                disabled={!pdf.isActive}
                                className={`w-full bg-gradient-to-r ${gradientFrom} ${gradientTo} hover:${gradientFrom.replace('-600', '-700')} hover:${gradientTo.replace('-600', '-700')} text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200`}
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                {pdf.isActive ? 'Drive\'a Git' : 'Pasif'}
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
