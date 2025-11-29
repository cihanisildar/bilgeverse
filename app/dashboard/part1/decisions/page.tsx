'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, FileText, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { getAllDecisions } from '@/app/actions/meetings/decisions';
import Loading from '@/app/components/Loading';
import toast from 'react-hot-toast';

type StatusFilter = 'all' | 'completed' | 'pending';

type Decision = {
    id: string;
    title: string;
    description: string | null;
    targetDate: string | null;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    meetingId: string;
    createdAt: string;
    updatedAt: string;
    meeting: {
        id: string;
        title: string;
        meetingDate: string;
    };
    responsibleUsers: {
        id: string;
        username: string;
        firstName: string | null;
        lastName: string | null;
    }[];
};

const statusLabels: Record<'TODO' | 'IN_PROGRESS' | 'DONE', string> = {
    TODO: 'Yapılacak',
    IN_PROGRESS: 'Devam Ediyor',
    DONE: 'Tamamlandı',
};

const statusColors: Record<'TODO' | 'IN_PROGRESS' | 'DONE', string> = {
    TODO: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    DONE: 'bg-green-100 text-green-800',
};

const filterLabels: Record<StatusFilter, string> = {
    all: 'Tüm Kararlar',
    completed: 'Tamamlanan Kararlar',
    pending: 'Bekleyen Kararlar',
};

export default function DecisionsOverviewPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [loading, setLoading] = useState(true);
    const statusFilter = (searchParams.get('status') as StatusFilter) || 'all';

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (user) {
            fetchDecisions();
        }
    }, [user, statusFilter]);

    const fetchDecisions = async () => {
        try {
            setLoading(true);
            const result = await getAllDecisions(statusFilter);
            if (result.error) {
                throw new Error(result.error);
            }
            setDecisions(result.data || []);
        } catch (error) {
            console.error('Error fetching decisions:', error);
            toast.error('Kararlar yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filter: StatusFilter) => {
        router.push(`/dashboard/part1/decisions?status=${filter}`);
    };

    const handleDecisionClick = (decision: Decision) => {
        router.push(`/dashboard/part1/meetings/${decision.meetingId}/decisions`);
    };

    if (authLoading || !user) {
        return <Loading fullScreen />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/dashboard/part1')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Geri Dön
                    </Button>
                </div>

                {/* Title and Filters */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                            {filterLabels[statusFilter]}
                        </span>
                    </h1>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant={statusFilter === 'all' ? 'default' : 'outline'}
                            onClick={() => handleFilterChange('all')}
                            className={statusFilter === 'all' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
                        >
                            Tümü
                        </Button>
                        <Button
                            variant={statusFilter === 'completed' ? 'default' : 'outline'}
                            onClick={() => handleFilterChange('completed')}
                            className={statusFilter === 'completed' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                        >
                            Tamamlanan
                        </Button>
                        <Button
                            variant={statusFilter === 'pending' ? 'default' : 'outline'}
                            onClick={() => handleFilterChange('pending')}
                            className={statusFilter === 'pending' ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}
                        >
                            Bekleyen
                        </Button>
                    </div>
                </div>

                {/* Decisions List */}
                {loading ? (
                    <Loading message="Kararlar yükleniyor..." />
                ) : decisions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {decisions.map((decision) => (
                            <Card
                                key={decision.id}
                                className="border-0 shadow-md rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-white"
                                onClick={() => handleDecisionClick(decision)}
                            >
                                <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between mb-2">
                                        <CardTitle className="text-lg font-bold text-gray-800 line-clamp-2 flex-1">
                                            {decision.title}
                                        </CardTitle>
                                        <Badge className={`ml-2 ${statusColors[decision.status]}`}>
                                            {statusLabels[decision.status]}
                                        </Badge>
                                    </div>
                                    {decision.description && (
                                        <CardDescription className="line-clamp-2 text-sm">
                                            {decision.description}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent className="pt-0 space-y-3">
                                    {/* Meeting Info */}
                                    <div className="flex items-start gap-2 text-sm">
                                        <FileText className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-gray-700">{decision.meeting.title}</p>
                                            <p className="text-xs text-gray-500">
                                                {format(new Date(decision.meeting.meetingDate), 'dd MMMM yyyy', { locale: tr })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Target Date */}
                                    {decision.targetDate && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span>Hedef: {format(new Date(decision.targetDate), 'dd MMM yyyy', { locale: tr })}</span>
                                        </div>
                                    )}

                                    {/* Responsible Users */}
                                    {decision.responsibleUsers && decision.responsibleUsers.length > 0 && (
                                        <div className="space-y-1">
                                            <div className="flex items-center text-xs text-gray-500">
                                                <User className="h-3 w-3 mr-1" />
                                                Sorumlu Üyeler:
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {decision.responsibleUsers.map((user) => (
                                                    <Badge key={user.id} variant="secondary" className="text-xs">
                                                        {user.firstName && user.lastName
                                                            ? `${user.firstName} ${user.lastName}`
                                                            : user.username}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* View Details Link */}
                                    <div className="pt-2 border-t border-gray-100">
                                        <div className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700">
                                            Detayları Görüntüle
                                            <ExternalLink className="ml-1 h-3 w-3" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                        <CardContent className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-6">
                                <FileText className="h-10 w-10 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                {statusFilter === 'all' && 'Henüz karar eklenmemiş'}
                                {statusFilter === 'completed' && 'Tamamlanmış karar bulunamadı'}
                                {statusFilter === 'pending' && 'Bekleyen karar bulunamadı'}
                            </h3>
                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                                {statusFilter === 'all' && 'Toplantı kararları eklendiğinde burada görüntülenecektir.'}
                                {statusFilter === 'completed' && 'Henüz tamamlanmış bir karar bulunmamaktadır.'}
                                {statusFilter === 'pending' && 'Henüz bekleyen bir karar bulunmamaktadır.'}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
