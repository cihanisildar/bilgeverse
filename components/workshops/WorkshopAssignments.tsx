"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, Trash2, Briefcase, Loader2, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function WorkshopAssignments({
    workshopId,
    assignments
}: {
    workshopId: string;
    assignments: any[];
}) {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [allPrivilegedUsers, setAllPrivilegedUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [userToRemove, setUserToRemove] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        fetchAllPrivilegedUsers();
    }, [assignments]);

    const fetchAllPrivilegedUsers = async () => {
        setFetching(true);
        try {
            const res = await fetch('/api/users');
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();

            const assignedIds = assignments.map(a => a.userId);
            const filtered = data.users.filter((u: any) =>
                ['BOARD_MEMBER', 'TUTOR'].includes(u.role) && !assignedIds.includes(u.id)
            );
            setAllPrivilegedUsers(filtered);
        } catch (error) {
            toast.error("Yetkili kullanıcı listesi alınamadı.");
        } finally {
            setFetching(false);
        }
    };

    const handleBulkAssign = async () => {
        if (selectedUserIds.length === 0) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/workshops/${workshopId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIds: selectedUserIds }),
            });
            if (!res.ok) throw new Error('Assignment failed');

            toast.success(`${selectedUserIds.length} rehber başarıyla atandı.`);
            setSelectedUserIds([]);
            router.refresh();
        } catch (error) {
            toast.error("Görevlendirme sırasında bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async () => {
        if (!userToRemove) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/workshops/${workshopId}/assign?userId=${userToRemove.id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Removal failed');

            toast.success("Görevlendirme kaldırıldı.");
            setUserToRemove(null);
            router.refresh();
        } catch (error) {
            toast.error("Kaldırma işlemi sırasında bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const filteredUsers = allPrivilegedUsers.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* New Assignment Section */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                        <UserPlus className="h-5 w-5 mr-2 text-amber-600" />
                        Rehber Ata
                    </h3>
                    {selectedUserIds.length > 0 && (
                        <Button
                            onClick={handleBulkAssign}
                            disabled={loading}
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md border-0"
                        >
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Seçili {selectedUserIds.length} Kişiyi Ata
                        </Button>
                    )}
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="İsim ile rehber ara..."
                        className="pl-10 rounded-2xl border-amber-100 bg-amber-50/30 shadow-none focus-visible:ring-amber-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {fetching ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <p className="text-sm text-gray-500 italic py-8 text-center bg-gray-50 rounded-2xl">
                            {searchTerm ? "Arama kriterine uygun kullanıcı bulunamadı." : "Atanabilecek uygun rehber bulunamadı."}
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={() => toggleUserSelection(user.id)}
                                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${selectedUserIds.includes(user.id)
                                            ? "bg-amber-50 border-amber-200 shadow-sm"
                                            : "bg-white border-gray-100 hover:border-amber-100 hover:bg-amber-50/30"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                                            {user.firstName ? user.firstName[0] : '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 text-sm truncate">
                                                {user.firstName} {user.lastName}
                                            </p>
                                            <Badge variant="outline" className="text-[10px] p-0 h-auto text-gray-500 border-0">
                                                {user.role === 'TUTOR' ? 'Rehber' : 'Kurul Üyesi'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Checkbox
                                        checked={selectedUserIds.includes(user.id)}
                                        onCheckedChange={() => toggleUserSelection(user.id)}
                                        className="rounded-full border-amber-200 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-amber-600" />
                    Mevcut Görevlendirmeler
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignments.length === 0 ? (
                        <p className="text-gray-500 italic py-4">Henüz atanmış bir rehber bulunmuyor.</p>
                    ) : (
                        assignments.map((assignment) => (
                            <div key={assignment.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700">
                                        {assignment.user.firstName ? assignment.user.firstName[0] : '?'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">
                                            {assignment.user.firstName} {assignment.user.lastName}
                                        </p>
                                        <Badge variant="secondary" className="text-[10px] uppercase font-bold py-0 h-4 min-w-[80px] justify-center">
                                            {assignment.role}
                                        </Badge>
                                    </div>
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setUserToRemove(assignment.user)}
                                    disabled={loading}
                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Deletion Confirmation Dialog */}
            <AlertDialog open={!!userToRemove} onOpenChange={(open) => !open && setUserToRemove(null)}>
                <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto md:mx-0">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold text-gray-900">
                            Görevi Kaldır?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600">
                            <span className="font-bold text-gray-900">
                                {userToRemove?.firstName} {userToRemove?.lastName}
                            </span> isimli öğretmen bu atölyedeki görevinden alınacaktır. Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl border-gray-200 hover:bg-gray-100">Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemove}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl border-0 min-w-[100px]"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Görevi Kaldır"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
