'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, FileText, Eye, Edit2, Clock, Check, ChevronsUpDown, Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { getAllDecisions } from '@/app/actions/meetings/decisions';
import { getAdminUsers } from '@/app/actions/users';
import Loading from '@/app/components/Loading';
import { useToast } from '@/app/hooks/use-toast';
import { useUpdateDecision, useDeleteDecision, useUpdateDecisionStatus } from '@/app/hooks/use-decisions';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DecisionStatus } from '@prisma/client';

type StatusFilter = 'all' | 'completed' | 'todo' | 'in-progress' | 'pending';

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

const filterLabels: Record<string, string> = {
    all: 'Tüm Kararlar',
    completed: 'Tamamlanan Kararlar',
    todo: 'Bekleyen Kararlar',
    'in-progress': 'Devam Eden Kararlar',
    pending: 'Bekleyen Kararlar (Hepsi)',
};

export default function DecisionsOverviewPage() {
    const toast = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading, isAdmin } = useAuth();
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [loading, setLoading] = useState(true);
    const statusFilter = (searchParams.get('status') as StatusFilter) || 'all';

    // Dialog states
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);

    const updateDecision = useUpdateDecision();
    const deleteDecision = useDeleteDecision();
    const updateStatus = useUpdateDecisionStatus();

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

    const handleViewDetails = (decision: Decision, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedDecision(decision);
        setDetailDialogOpen(true);
    };

    const handleEditFromDetail = () => {
        setDetailDialogOpen(false);
        setEditDialogOpen(true);
    };

    const handleStatusChange = async (id: string, status: DecisionStatus) => {
        try {
            await updateStatus.mutateAsync({ id, status });
            // If the dialog is open and it's the current decision, update it locally or fetch
            if (selectedDecision && selectedDecision.id === id) {
                setSelectedDecision({ ...selectedDecision, status: status as any });
            }
            fetchDecisions();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleDeleteClick = () => {
        setDetailDialogOpen(false);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedDecision) return;

        try {
            await deleteDecision.mutateAsync(selectedDecision.id);
            setDeleteDialogOpen(false);
            setSelectedDecision(null);
            fetchDecisions();
        } catch (error) {
            console.error('Error deleting decision:', error);
        }
    };

    const handleEditSubmit = async (data: {
        title: string;
        description: string | null;
        targetDate: string | null;
        responsibleUserIds: string[];
    }) => {
        if (!selectedDecision) return;

        try {
            await updateDecision.mutateAsync({
                id: selectedDecision.id,
                data,
            });
            setEditDialogOpen(false);
            setSelectedDecision(null);
            // Refetch decisions to get updated data
            fetchDecisions();
        } catch (error) {
            console.error('Error updating decision:', error);
        }
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
                            variant={statusFilter === 'todo' ? 'default' : 'outline'}
                            onClick={() => handleFilterChange('todo')}
                            className={statusFilter === 'todo' ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}
                        >
                            Bekleyen
                        </Button>
                        <Button
                            variant={statusFilter === 'in-progress' ? 'default' : 'outline'}
                            onClick={() => handleFilterChange('in-progress')}
                            className={statusFilter === 'in-progress' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                        >
                            Devam Eden
                        </Button>
                        <Button
                            variant={statusFilter === 'completed' ? 'default' : 'outline'}
                            onClick={() => handleFilterChange('completed')}
                            className={statusFilter === 'completed' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                        >
                            Tamamlanan
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
                                onClick={(e) => handleViewDetails(decision, e)}
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
                                            <Eye className="mr-1 h-3 w-3" />
                                            Detayları Görüntüle
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
                                {statusFilter === 'todo' && 'Bekleyen karar bulunamadı'}
                                {statusFilter === 'in-progress' && 'Devam eden karar bulunamadı'}
                                {statusFilter === 'pending' && 'Henüz bekleyen bir karar bulunamadı'}
                            </h3>
                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                                {statusFilter === 'all' && 'Toplantı kararları eklendiğinde burada görüntülenecektir.'}
                                {statusFilter === 'completed' && 'Henüz tamamlanmış bir karar bulunmamaktadır.'}
                                {statusFilter === 'todo' && 'Henüz bekleyen bir karar bulunmamaktadır.'}
                                {statusFilter === 'in-progress' && 'Henüz devam eden bir karar bulunmamaktadır.'}
                                {statusFilter === 'pending' && 'Henüz bekleyen bir karar bulunmamaktadır.'}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Decision Detail Dialog */}
                {selectedDecision && (
                    <DecisionDetailDialog
                        open={detailDialogOpen}
                        onOpenChange={setDetailDialogOpen}
                        decision={selectedDecision}
                        onEdit={handleEditFromDetail}
                        onDelete={handleDeleteClick}
                        onStatusChange={handleStatusChange}
                        isAdmin={isAdmin || false}
                    />
                )}

                {/* Edit Decision Dialog */}
                {selectedDecision && isAdmin && (
                    <EditDecisionDialog
                        open={editDialogOpen}
                        onOpenChange={setEditDialogOpen}
                        decision={selectedDecision}
                        onSubmit={handleEditSubmit}
                        isPending={updateDecision.isPending}
                    />
                )}

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Kararı Sil</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bu kararı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleteDecision.isPending}>
                                İptal
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteConfirm}
                                disabled={deleteDecision.isPending}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {deleteDecision.isPending ? 'Siliniyor...' : 'Sil'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}

// Decision Detail Dialog Component
function DecisionDetailDialog({
    open,
    onOpenChange,
    decision,
    onEdit,
    onDelete,
    onStatusChange,
    isAdmin,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    decision: Decision;
    onEdit: () => void;
    onDelete: () => void;
    onStatusChange: (id: string, status: DecisionStatus) => void;
    isAdmin: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex-1">
                        <DialogTitle className="text-2xl mb-2">{decision.title}</DialogTitle>
                        <div className="flex items-center gap-2 mt-2">
                            {isAdmin ? (
                                <Select
                                    value={decision.status}
                                    onValueChange={(value) => onStatusChange(decision.id, value as DecisionStatus)}
                                >
                                    <SelectTrigger className={cn("w-[140px] h-8", statusColors[decision.status])}>
                                        <SelectValue placeholder="Durum seç" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TODO">Yapılacak</SelectItem>
                                        <SelectItem value="IN_PROGRESS">Devam Ediyor</SelectItem>
                                        <SelectItem value="DONE">Tamamlandı</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Badge className={statusColors[decision.status]}>
                                    {statusLabels[decision.status]}
                                </Badge>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Meeting Info */}
                    <div className="space-y-2">
                        <div className="flex items-center text-sm font-semibold text-gray-700">
                            <FileText className="h-4 w-4 mr-2" />
                            Toplantı
                        </div>
                        <div className="text-gray-600 pl-6">
                            <p className="font-medium">{decision.meeting.title}</p>
                            <p className="text-sm text-gray-500">
                                {format(new Date(decision.meeting.meetingDate), 'dd MMMM yyyy', { locale: tr })}
                            </p>
                        </div>
                    </div>

                    {/* Description */}
                    {decision.description && (
                        <div className="space-y-2">
                            <div className="flex items-center text-sm font-semibold text-gray-700">
                                <FileText className="h-4 w-4 mr-2" />
                                Açıklama
                            </div>
                            <p className="text-gray-600 whitespace-pre-wrap pl-6">
                                {decision.description}
                            </p>
                        </div>
                    )}

                    {/* Responsible Users */}
                    {decision.responsibleUsers && decision.responsibleUsers.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center text-sm font-semibold text-gray-700">
                                <User className="h-4 w-4 mr-2" />
                                Sorumlu Üyeler
                            </div>
                            <div className="space-y-2 pl-6">
                                {decision.responsibleUsers.map((user) => (
                                    <div key={user.id} className="flex items-center text-gray-600">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                                            <User className="h-4 w-4 text-indigo-600" />
                                        </div>
                                        <span>
                                            {user.firstName && user.lastName
                                                ? `${user.firstName} ${user.lastName}`
                                                : user.username}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Target Date */}
                    {decision.targetDate && (
                        <div className="space-y-2">
                            <div className="flex items-center text-sm font-semibold text-gray-700">
                                <Calendar className="h-4 w-4 mr-2" />
                                Hedef Tarih
                            </div>
                            <p className="text-gray-600 pl-6">
                                {format(new Date(decision.targetDate), 'dd MMMM yyyy', { locale: tr })}
                            </p>
                        </div>
                    )}

                    {/* Created and Updated Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        <div className="space-y-1">
                            <div className="flex items-center text-xs text-gray-500">
                                <Clock className="h-3 w-3 mr-1" />
                                Oluşturulma Tarihi
                            </div>
                            <p className="text-sm text-gray-600">
                                {format(new Date(decision.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                            </p>
                        </div>
                        {decision.updatedAt && new Date(decision.updatedAt).getTime() !== new Date(decision.createdAt).getTime() && (
                            <div className="space-y-1">
                                <div className="flex items-center text-xs text-gray-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Son Güncelleme
                                </div>
                                <p className="text-sm text-gray-600">
                                    {format(new Date(decision.updatedAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6 border-t pt-6">
                    <div className="flex-1 flex gap-2">
                        {isAdmin && (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={onDelete}
                                    className="flex-1 sm:flex-none"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Sil
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={onEdit}
                                    className="flex-1 sm:flex-none"
                                >
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Düzenle
                                </Button>
                            </>
                        )}
                    </div>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>
                        Kapat
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Edit Decision Dialog Component
function EditDecisionDialog({
    open,
    onOpenChange,
    decision,
    onSubmit,
    isPending = false,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    decision: Decision;
    onSubmit: (data: {
        title: string;
        description: string | null;
        targetDate: string | null;
        responsibleUserIds: string[];
    }) => void;
    isPending?: boolean;
}) {
    const [title, setTitle] = useState(decision?.title || '');
    const [description, setDescription] = useState(decision?.description || '');
    const [targetDate, setTargetDate] = useState(
        decision?.targetDate ? format(new Date(decision.targetDate), 'yyyy-MM-dd') : ''
    );
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
        decision?.responsibleUsers?.map((u) => u.id) || []
    );
    const [adminUsers, setAdminUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [comboboxOpen, setComboboxOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (open) {
            setTitle(decision?.title || '');
            setDescription(decision?.description || '');
            setTargetDate(
                decision?.targetDate ? format(new Date(decision.targetDate), 'yyyy-MM-dd') : ''
            );
            setSelectedUserIds(decision?.responsibleUsers?.map((u) => u.id) || []);
            setSearchQuery('');
            setComboboxOpen(false);
            setLoadingUsers(true);
            getAdminUsers().then((result) => {
                if (result.error === null && result.data) {
                    setAdminUsers(result.data);
                }
                setLoadingUsers(false);
            });
        }
    }, [open, decision]);

    const handleSubmit = () => {
        if (!title.trim() || selectedUserIds.length === 0) return;
        onSubmit({
            title,
            description: description || null,
            targetDate: targetDate || null,
            responsibleUserIds: selectedUserIds,
        });
    };

    const handleUserToggle = (userId: string) => {
        setSelectedUserIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Kararı Düzenle</DialogTitle>
                    <DialogDescription>Karar bilgilerini güncelleyin</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label>Başlık *</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Karar başlığı"
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label>Açıklama</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Karar açıklaması"
                            rows={3}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label>Hedef Tarih</Label>
                        <Input
                            type="date"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                    <div className="relative">
                        <Label>Sorumlu Yönetim Kurulu Üyeleri *</Label>
                        <Button
                            variant="outline"
                            className="w-full justify-between mt-2"
                            type="button"
                            onClick={() => setComboboxOpen(!comboboxOpen)}
                        >
                            {selectedUserIds.length > 0
                                ? `${selectedUserIds.length} üye seçildi`
                                : 'Üye seçin...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>

                        {comboboxOpen && (
                            <div className="absolute z-[100] w-full mt-1 bg-popover border rounded-md shadow-md">
                                {/* Search Input */}
                                <div className="flex items-center border-b px-3 py-2">
                                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                    <Input
                                        placeholder="Üye ara..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9"
                                        autoFocus
                                    />
                                </div>

                                {/* User List */}
                                <div className="max-h-[200px] overflow-y-auto p-1">
                                    {loadingUsers ? (
                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                            Yükleniyor...
                                        </div>
                                    ) : adminUsers.filter((user) => {
                                        if (!searchQuery) return true;
                                        const displayName = user.firstName && user.lastName
                                            ? `${user.firstName} ${user.lastName}`
                                            : user.username;
                                        return displayName.toLowerCase().includes(searchQuery.toLowerCase());
                                    }).length === 0 ? (
                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                            Üye bulunamadı.
                                        </div>
                                    ) : (
                                        adminUsers
                                            .filter((user) => {
                                                if (!searchQuery) return true;
                                                const displayName = user.firstName && user.lastName
                                                    ? `${user.firstName} ${user.lastName}`
                                                    : user.username;
                                                return displayName.toLowerCase().includes(searchQuery.toLowerCase());
                                            })
                                            .map((user) => {
                                                const isSelected = selectedUserIds.includes(user.id);
                                                const displayName = user.firstName && user.lastName
                                                    ? `${user.firstName} ${user.lastName}`
                                                    : user.username;
                                                return (
                                                    <div
                                                        key={user.id}
                                                        className={cn(
                                                            "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                                                            "hover:bg-accent hover:text-accent-foreground",
                                                            isSelected && "bg-accent text-accent-foreground"
                                                        )}
                                                        onClick={() => {
                                                            handleUserToggle(user.id);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4 flex-shrink-0",
                                                                isSelected ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <span className="flex-1">{displayName}</span>
                                                    </div>
                                                );
                                            })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Click outside to close */}
                        {comboboxOpen && (
                            <div
                                className="fixed inset-0 z-[90]"
                                onClick={() => setComboboxOpen(false)}
                            />
                        )}
                        {selectedUserIds.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {selectedUserIds.map((userId) => {
                                    const user = adminUsers.find((u) => u.id === userId);
                                    if (!user) return null;
                                    const displayName = user.firstName && user.lastName
                                        ? `${user.firstName} ${user.lastName}`
                                        : user.username;
                                    return (
                                        <Badge
                                            key={userId}
                                            variant="secondary"
                                            className="text-sm"
                                        >
                                            {displayName}
                                            <button
                                                type="button"
                                                className="ml-2 hover:text-red-500"
                                                onClick={() => handleUserToggle(userId)}
                                            >
                                                ×
                                            </button>
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}
                        {selectedUserIds.length === 0 && (
                            <p className="text-sm text-red-500 mt-1">
                                En az bir sorumlu yönetim kurulu üyesi seçmelisiniz
                            </p>
                        )}
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                        >
                            İptal
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!title.trim() || selectedUserIds.length === 0 || isPending}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? 'Güncelleniyor...' : 'Güncelle'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
