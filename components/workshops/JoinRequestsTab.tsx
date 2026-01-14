'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { WorkshopJoinRequestStatus } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';

interface JoinRequest {
    id: string;
    workshopId: string;
    studentId: string;
    status: WorkshopJoinRequestStatus;
    message: string | null;
    createdAt: string;
    student: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
        avatarUrl: string | null;
        username: string;
    };
}

interface JoinRequestsTabProps {
    workshopId: string;
    initialRequests: JoinRequest[];
}

export function JoinRequestsTab({ workshopId, initialRequests }: JoinRequestsTabProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [requests, setRequests] = useState<JoinRequest[]>(initialRequests);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleApprove = async (requestId: string) => {
        const request = requests.find(r => r.id === requestId);
        const studentName = request?.student.firstName && request?.student.lastName
            ? `${request.student.firstName} ${request.student.lastName}`
            : request?.student.username || 'Öğrenci';

        setProcessingId(requestId);
        try {
            const response = await fetch(`/api/workshops/join-requests/${requestId}/approve`, {
                method: 'POST',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to approve request');
            }

            // Remove from list after approval
            setRequests(prev => prev.filter(r => r.id !== requestId));

            toast({
                title: "Katılım İsteği Onaylandı",
                description: `${studentName} atölyeye başarıyla eklendi.`,
                variant: "default",
            });

            router.refresh();
        } catch (error) {
            console.error('Error approving request:', error);
            toast({
                title: "Hata",
                description: error instanceof Error ? error.message : 'İstek onaylanamadı',
                variant: "destructive",
            });
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (requestId: string) => {
        const request = requests.find(r => r.id === requestId);
        const studentName = request?.student.firstName && request?.student.lastName
            ? `${request.student.firstName} ${request.student.lastName}`
            : request?.student.username || 'Öğrenci';

        setProcessingId(requestId);
        try {
            const response = await fetch(`/api/workshops/join-requests/${requestId}/reject`, {
                method: 'POST',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to reject request');
            }

            // Remove from list after rejection
            setRequests(prev => prev.filter(r => r.id !== requestId));

            toast({
                title: "Katılım İsteği Reddedildi",
                description: `${studentName} için katılım isteği reddedildi.`,
                variant: "default",
            });

            router.refresh();
        } catch (error) {
            console.error('Error rejecting request:', error);
            toast({
                title: "Hata",
                description: error instanceof Error ? error.message : 'İstek reddedilemedi',
                variant: "destructive",
            });
        } finally {
            setProcessingId(null);
        }
    };

    if (requests.length === 0) {
        return (
            <Card className="bg-white rounded-3xl shadow-sm border border-amber-100">
                <CardContent className="p-12 text-center">
                    <Clock className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        Bekleyen İstek Yok
                    </h3>
                    <p className="text-gray-500">
                        Şu anda bu atölye için bekleyen katılım isteği bulunmamaktadır.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {requests.map((request) => (
                <Card key={request.id} className="bg-white rounded-3xl shadow-sm border border-amber-100 hover:shadow-md transition-shadow">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-amber-200 shadow-sm">
                                    {request.student.avatarUrl ? (
                                        <Image
                                            src={request.student.avatarUrl}
                                            alt={request.student.firstName || request.student.username}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-amber-100 flex items-center justify-center">
                                            <User className="h-7 w-7 text-amber-600" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <CardTitle className="text-lg">
                                        {request.student.firstName && request.student.lastName
                                            ? `${request.student.firstName} ${request.student.lastName}`
                                            : request.student.username}
                                    </CardTitle>
                                    <p className="text-sm text-gray-500">{request.student.email}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        İstek Tarihi: {new Date(request.createdAt).toLocaleDateString('tr-TR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </div>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                <Clock className="h-3 w-3 mr-1" />
                                Bekliyor
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {request.message && (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <p className="text-sm font-medium text-gray-700 mb-1">Mesaj:</p>
                                <p className="text-sm text-gray-600 italic">&quot;{request.message}&quot;</p>
                            </div>
                        )}
                        <div className="flex gap-3">
                            <Button
                                onClick={() => handleApprove(request.id)}
                                disabled={processingId === request.id}
                                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {processingId === request.id ? 'İşleniyor...' : 'Onayla'}
                            </Button>
                            <Button
                                onClick={() => handleReject(request.id)}
                                disabled={processingId === request.id}
                                variant="outline"
                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reddet
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
