'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Calendar, CheckCircle, XCircle, Clock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTutorPromotion, useUpdatePromotion } from '@/app/hooks/use-tutor-promotions';
import Loading from '@/app/components/Loading';

export default function TutorPromotionDetailPage({ params }: { params: { id: string } }) {
    const { data: promotion, isLoading, error } = useTutorPromotion(params.id);

    if (isLoading) {
        return <Loading fullScreen />;
    }

    if (error || !promotion) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6 lg:p-8">
                <div className="max-w-5xl mx-auto">
                    <p className="text-center text-red-600">
                        {error?.message || 'Terfi talebi bulunamadı'}
                    </p>
                </div>
            </div>
        );
    }

    // Using key={promotion.id} ensures the Content component's state 
    // is completely reset and re-initialized when a new promotion is loaded.
    return <PromotionDetailContent key={promotion.id} promotion={promotion} />;
}

function PromotionDetailContent({ promotion }: { promotion: any }) {
    const router = useRouter();
    const { toast } = useToast();
    const updatePromotion = useUpdatePromotion();

    const [notes, setNotes] = useState(promotion.notes || '');
    const [rejectionReason, setRejectionReason] = useState('');
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);

    const handleUpdateNotes = async () => {
        updatePromotion.mutate(
            { id: promotion.id, data: { notes } },
            {
                onSuccess: () => {
                    toast({
                        title: 'Başarılı',
                        description: 'Notlar güncellendi',
                    });
                },
            }
        );
    };

    const confirmApprove = async () => {
        setShowApproveDialog(false);
        updatePromotion.mutate(
            { id: promotion.id, data: { status: 'APPROVED', notes } },
            {
                onSuccess: () => {
                    toast({
                        title: 'Başarılı',
                        description: 'Terfi onaylandı',
                    });
                    router.push('/dashboard/part3/tutor-promotions');
                    router.refresh();
                },
            }
        );
    };

    const confirmReject = async () => {
        // Validate before proceeding
        if (!rejectionReason.trim()) {
            toast({
                title: 'Uyarı',
                description: 'Lütfen red sebebini belirtin',
                variant: 'destructive',
            });
            setShowRejectDialog(false);
            return;
        }

        setShowRejectDialog(false);
        updatePromotion.mutate(
            { id: promotion.id, data: { status: 'REJECTED', notes, rejectionReason } },
            {
                onSuccess: () => {
                    toast({
                        title: 'Başarılı',
                        description: 'Terfi reddedildi',
                    });
                    router.push('/dashboard/part3/tutor-promotions');
                    router.refresh();
                },
            }
        );
    };

    const getStatusBadge = () => {
        switch (promotion.status) {
            case 'PENDING':
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300"><Clock className="h-3 w-3 mr-1" />Beklemede</Badge>;
            case 'APPROVED':
                return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="h-3 w-3 mr-1" />Onaylandı</Badge>;
            case 'REJECTED':
                return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300"><XCircle className="h-3 w-3 mr-1" />Reddedildi</Badge>;
        }
    };

    const isPending = promotion.status === 'PENDING';
    const processing = updatePromotion.isPending;

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6 lg:p-8">
                <div className="max-w-5xl mx-auto">
                    <Link href="/dashboard/part3/tutor-promotions">
                        <Button variant="ghost" className="mb-6 hover:bg-gray-100 transition-all duration-200">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Terfi Listesine Dön
                        </Button>
                    </Link>

                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                                        Terfi Talebi Detayları
                                    </span>
                                </h1>
                                <p className="text-gray-600">Terfi talebini inceleyin ve karar verin</p>
                            </div>
                            {getStatusBadge()}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* User Information */}
                        <div className="lg:col-span-1">
                            <Card className="border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Kullanıcı Bilgileri
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500">Ad Soyad</p>
                                        <p className="font-medium">{promotion.user.firstName} {promotion.user.lastName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Kullanıcı Adı</p>
                                        <p className="font-medium">@{promotion.user.username}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">E-posta</p>
                                        <p className="font-medium text-sm">{promotion.user.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Mevcut Rol</p>
                                        <p className="font-medium">{promotion.user.role === 'STUDENT' ? 'Öğrenci' : 'Asistan'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Hedef Rol</p>
                                        <p className="font-medium text-green-600">Öğretmen</p>
                                    </div>
                                    {promotion.user.phone && (
                                        <div>
                                            <p className="text-sm text-gray-500">Telefon</p>
                                            <p className="font-medium">{promotion.user.phone}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg mt-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        Tarihler
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500">Oluşturulma</p>
                                        <p className="font-medium">{new Date(promotion.createdAt).toLocaleString('tr-TR')}</p>
                                        <p className="text-sm text-gray-600">{promotion.createdBy.firstName} {promotion.createdBy.lastName}</p>
                                    </div>
                                    {promotion.reviewedAt && (
                                        <div>
                                            <p className="text-sm text-gray-500">İnceleme</p>
                                            <p className="font-medium">{new Date(promotion.reviewedAt).toLocaleString('tr-TR')}</p>
                                            {promotion.reviewedBy && (
                                                <p className="text-sm text-gray-600">{promotion.reviewedBy.firstName} {promotion.reviewedBy.lastName}</p>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Notes and Actions */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle>Görüşme Notları</CardTitle>
                                    <CardDescription>
                                        Değerlendirme sürecindeki gözlemler ve notlar
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={8}
                                        placeholder="Görüşme notları, gözlemler ve değerlendirmeler..."
                                        disabled={!isPending || processing}
                                        className="mb-4"
                                    />
                                    {isPending && (
                                        <Button
                                            onClick={handleUpdateNotes}
                                            disabled={processing}
                                            variant="outline"
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            Notları Kaydet
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>

                            {promotion.status === 'REJECTED' && promotion.rejectionReason && (
                                <Card className="border-0 shadow-lg border-l-4 border-l-red-500">
                                    <CardHeader>
                                        <CardTitle className="text-red-600">Red Sebebi</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-700">{promotion.rejectionReason}</p>
                                    </CardContent>
                                </Card>
                            )}

                            {isPending && (
                                <Card className="border-0 shadow-lg">
                                    <CardHeader>
                                        <CardTitle>Karar</CardTitle>
                                        <CardDescription>
                                            Terfi talebini onaylayın veya reddedin
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="rejectionReason">Red Sebebi (Sadece reddederken)</Label>
                                            <Textarea
                                                id="rejectionReason"
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                rows={4}
                                                placeholder="Terfi reddedilirse gerekçesini buraya yazın..."
                                                className="mt-2"
                                            />
                                        </div>

                                        <div className="flex gap-4">
                                            <Button
                                                onClick={() => setShowApproveDialog(true)}
                                                disabled={processing}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Terfiyi Onayla
                                            </Button>
                                            <Button
                                                onClick={() => setShowRejectDialog(true)}
                                                disabled={processing}
                                                variant="destructive"
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Terfiyi Reddet
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Approve Confirmation Dialog */}
            <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Terfiyi Onaylıyor musunuz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu terfiyi onaylamak istediğinizden emin misiniz? Kullanıcının rolü öğretmen olarak güncellenecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmApprove} className="bg-green-600 hover:bg-green-700 text-white">
                            Tamam
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Reject Confirmation Dialog */}
            <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Terfiyi Reddediyor musunuz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu terfiyi reddetmek istediğinizden emin misiniz?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmReject} className="bg-red-600 hover:bg-red-700 text-white">
                            Reddet
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
