'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UserPlus, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTutorPromotions } from '@/app/hooks/use-tutor-promotions';
import { useRouter } from 'next/navigation';
import Loading from '@/app/components/Loading';
import { TutorPromotion } from '@/app/types/tutor-promotions';

export default function TutorPromotionsPage() {
    const router = useRouter();
    const { data: promotions, isLoading, error } = useTutorPromotions();

    if (isLoading) {
        return <Loading fullScreen />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-12 text-red-600">Hata: {error.message}</div>
                </div>
            </div>
        );
    }

    const pendingCount = promotions?.filter((p: TutorPromotion) => p.status === 'PENDING').length || 0;
    const approvedCount = promotions?.filter((p: TutorPromotion) => p.status === 'APPROVED').length || 0;
    const rejectedCount = promotions?.filter((p: TutorPromotion) => p.status === 'REJECTED').length || 0;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3" />
                        Beklemede
                    </span>
                );
            case 'APPROVED':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        Onaylandı
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3" />
                        Reddedildi
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Link href="/dashboard/part3">
                    <Button variant="ghost" className="mb-6 hover:bg-gray-100 transition-all duration-200">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Part 3 Dashboard
                    </Button>
                </Link>

                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                                    Öğretmen Terfi Sistemi
                                </span>
                            </h1>
                            <p className="text-gray-600">Öğrenci ve asistanların öğretmen olma taleplerini yönetin</p>
                        </div>
                        <Link href="/dashboard/part3/tutor-promotions/new">
                            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/50 transition-all duration-200 hover:shadow-xl hover:shadow-green-500/60">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Yeni Terfi Talebi
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                            <div className="h-2 bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600">Bekleyen</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <span className="text-3xl font-bold text-gray-800">{pendingCount}</span>
                                    <Clock className="h-8 w-8 text-yellow-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                            <div className="h-2 bg-gradient-to-r from-green-400 to-green-600"></div>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600">Onaylanan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <span className="text-3xl font-bold text-gray-800">{approvedCount}</span>
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                            <div className="h-2 bg-gradient-to-r from-red-400 to-red-600"></div>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600">Reddedilen</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <span className="text-3xl font-bold text-gray-800">{rejectedCount}</span>
                                    <XCircle className="h-8 w-8 text-red-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {!promotions || promotions.length === 0 ? (
                    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                        <CardContent className="text-center py-16 px-6">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 mb-6">
                                <UserPlus className="h-10 w-10 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Henüz terfi talebi yok</h3>
                            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                                İlk terfi talebini oluşturmak için yukarıdaki butona tıklayın.
                            </p>
                            <Link href="/dashboard/part3/tutor-promotions/new">
                                <Button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/50">
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    İlk Terfi Talebini Oluştur
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {promotions.map((promotion) => (
                            <Link key={promotion.id} href={`/dashboard/part3/tutor-promotions/${promotion.id}`}>
                                <Card className="group border-0 shadow-md rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer bg-white h-full">
                                    <div className="h-1.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg font-bold text-gray-800 group-hover:text-green-600 transition-colors">
                                                    {promotion.user.firstName} {promotion.user.lastName}
                                                </CardTitle>
                                                <CardDescription className="text-sm mt-1">
                                                    @{promotion.user.username}
                                                </CardDescription>
                                            </div>
                                            {getStatusBadge(promotion.status)}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0 space-y-3">
                                        <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-2.5">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-100 text-blue-600 mr-3">
                                                <Calendar className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium">
                                                {new Date(promotion.createdAt).toLocaleDateString('tr-TR')}
                                            </span>
                                        </div>
                                        <div className="pt-3 border-t border-gray-100">
                                            <p className="text-xs text-gray-500">
                                                Talep Eden: {promotion.createdBy.firstName} {promotion.createdBy.lastName}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Mevcut Rol: {promotion.user.role === 'STUDENT' ? 'Öğrenci' : 'Asistan'}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
