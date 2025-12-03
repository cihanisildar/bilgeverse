'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useBoardMembers, useDeleteBoardMember, useToggleBoardMemberStatus } from '@/app/hooks/use-board-members';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Edit2, Trash2, LayoutDashboard, Mail, Phone, Power } from 'lucide-react';
import { useState, useEffect } from 'react';
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
import Loading from '@/app/components/Loading';

export default function BoardMembersPage() {
    const router = useRouter();
    const { user, isAdmin } = useAuth();
    const { data: boardMembers, isLoading, error } = useBoardMembers();
    const deleteMember = useDeleteBoardMember();
    const toggleStatus = useToggleBoardMemberStatus();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

    useEffect(() => {
        if (!deleteDialogOpen) {
            setSelectedMemberId(null);
        }
    }, [deleteDialogOpen]);

    if (isLoading) {
        return <Loading fullScreen />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-12 text-red-600">Hata: {error.message}</div>
                </div>
            </div>
        );
    }

    const handleDelete = () => {
        if (!selectedMemberId) return;

        const memberId = String(selectedMemberId);

        deleteMember.mutate(memberId, {
            onSuccess: (result) => {
                if (result && !result.error) {
                    setDeleteDialogOpen(false);
                    setSelectedMemberId(null);
                }
            },
        });
    };

    const handleToggleStatus = (id: string) => {
        toggleStatus.mutate(id);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                                    Yönetim Kurulu Üyeleri
                                </span>
                            </h1>
                            <p className="text-gray-600">Yönetim kurulu üyelerini görüntüleyin ve yönetin</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => router.push('/dashboard/part1')}
                                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                            >
                                <LayoutDashboard className="h-4 w-4 mr-2" />
                                Dashboard
                            </Button>
                            {isAdmin && (
                                <Button
                                    onClick={() => router.push('/dashboard/part1/board-members/new')}
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/50 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/60"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Yeni Üye Ekle
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {!boardMembers || boardMembers.length === 0 ? (
                    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                        <CardContent className="text-center py-16 px-6">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-6">
                                <Users className="h-10 w-10 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Henüz üye yok</h3>
                            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                                İlk yönetim kurulu üyesini eklemek için yukarıdaki butona tıklayın.
                            </p>
                            {isAdmin && (
                                <Button
                                    onClick={() => router.push('/dashboard/part1/board-members/new')}
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/50"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    İlk Üyeyi Ekle
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {boardMembers.map((member) => (
                            <Card
                                key={member.id}
                                className="group border-0 shadow-md rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 bg-white"
                            >
                                <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors flex-1">
                                            {member.user.firstName && member.user.lastName
                                                ? `${member.user.firstName} ${member.user.lastName}`
                                                : member.user.username}
                                        </CardTitle>
                                        <Badge className={`${member.isActive ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' : 'bg-gray-100 text-gray-600'} border-0 shrink-0`}>
                                            {member.isActive ? 'Aktif' : 'Pasif'}
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-gray-600 font-medium">
                                        {member.title}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-3 mb-5">
                                        {member.user.email && (
                                            <div className="flex items-center text-sm text-gray-700 bg-gray-50 rounded-lg p-2.5">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-indigo-100 text-indigo-600 mr-3">
                                                    <Mail className="h-4 w-4" />
                                                </div>
                                                <span className="font-medium truncate">{member.user.email}</span>
                                            </div>
                                        )}
                                        {member.user.phone && (
                                            <div className="flex items-center text-sm text-gray-700 bg-gray-50 rounded-lg p-2.5">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-purple-100 text-purple-600 mr-3">
                                                    <Phone className="h-4 w-4" />
                                                </div>
                                                <span className="font-medium">{member.user.phone}</span>
                                            </div>
                                        )}
                                        {/* Attendance Stats */}
                                        {member.stats && (
                                            <div className="flex items-center text-sm text-gray-700 bg-gray-50 rounded-lg p-2.5">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-emerald-100 text-emerald-600 mr-3">
                                                    <LayoutDashboard className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-medium">Katılım</span>
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${member.stats.attendanceRate >= 80 ? 'bg-green-100 text-green-700' :
                                                                member.stats.attendanceRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-red-100 text-red-700'
                                                            }`}>
                                                            %{member.stats.attendanceRate.toFixed(0)}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                        <div
                                                            className={`h-1.5 rounded-full ${member.stats.attendanceRate >= 80 ? 'bg-green-500' :
                                                                    member.stats.attendanceRate >= 50 ? 'bg-yellow-500' :
                                                                        'bg-red-500'
                                                                }`}
                                                            style={{ width: `${member.stats.attendanceRate}%` }}
                                                        ></div>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1 text-right">
                                                        {member.stats.attendedMeetings} / {member.stats.totalMeetings} Toplantı
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {isAdmin && (
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleStatus(member.id)}
                                                disabled={toggleStatus.isPending}
                                                className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 font-medium"
                                            >
                                                <Power className="h-4 w-4 mr-2" />
                                                {member.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                                            </Button>
                                            <div className="flex space-x-1.5">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/dashboard/part1/board-members/${member.id}/edit`)}
                                                    className="border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 h-8 w-8 p-0"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedMemberId(member.id);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                    className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 h-8 w-8 p-0"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Üyeyi Sil</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bu yönetim kurulu üyesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel
                                disabled={deleteMember.isPending}
                                onClick={() => {
                                    setDeleteDialogOpen(false);
                                    setSelectedMemberId(null);
                                }}
                            >
                                İptal
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={deleteMember.isPending}
                                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deleteMember.isPending ? 'Siliniyor...' : 'Sil'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
