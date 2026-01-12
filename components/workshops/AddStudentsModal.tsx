"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, UserPlus, CheckCircle2, Circle, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface Student {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    username: string;
}

export function AddStudentsModal({
    workshopId,
    currentUserRole
}: {
    workshopId: string;
    currentUserRole: string;
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [eligibleStudents, setEligibleStudents] = useState<Student[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const router = useRouter();

    useEffect(() => {
        if (open) {
            fetchEligibleStudents();
        }
    }, [open]);

    const fetchEligibleStudents = async () => {
        setFetching(true);
        try {
            const res = await fetch(`/api/workshops/${workshopId}/students`);
            if (!res.ok) throw new Error('Failed to fetch students');
            const data = await res.json();
            setEligibleStudents(data);
        } catch (error) {
            toast.error("Öğrenci listesi alınamadı.");
        } finally {
            setFetching(false);
        }
    };

    const handleBulkEnroll = async () => {
        if (selectedIds.length === 0) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/workshops/${workshopId}/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentIds: selectedIds }),
            });

            if (!res.ok) throw new Error('Enrollment failed');

            toast.success(`${selectedIds.length} öğrenci başarıyla eklendi.`);
            setOpen(false);
            setSelectedIds([]);
            router.refresh();
        } catch (error) {
            toast.error("Öğrenci eklenirken bir sorun oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        setSelectedIds(eligibleStudents.map(s => s.id));
    };

    const filteredStudents = eligibleStudents.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md border-0">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Öğrenci Ekle
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Atölyeye Öğrenci Ekle</DialogTitle>
                    <DialogDescription>
                        {currentUserRole === 'TUTOR'
                            ? "Kendi öğrencilerinizi toplu olarak seçip atölyeye dahil edebilirsiniz."
                            : "Atölyeye dahil etmek istediğiniz öğrencileri seçin."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Öğrenci ara..."
                                className="pl-10 rounded-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {eligibleStudents.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={selectAll}
                                className="rounded-xl whitespace-nowrap"
                            >
                                <Users className="h-4 w-4 mr-2" />
                                {currentUserRole === 'TUTOR' ? "Tüm Sınıfımı Seç" : "Hepsini Seç"}
                            </Button>
                        )}
                    </div>

                    <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {fetching ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <p className="text-sm text-gray-500 italic py-8 text-center bg-gray-50 rounded-2xl">
                                {searchTerm ? "Kriterlere uygun sonuç bulunamadı." : "Atölyeye eklenebilecek yeni öğrenci bulunamadı."}
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {filteredStudents.map((s) => (
                                    <div
                                        key={s.id}
                                        onClick={() => toggleSelection(s.id)}
                                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedIds.includes(s.id)
                                            ? "bg-amber-50 border-amber-200"
                                            : "bg-white border-gray-100 hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                                                {s.firstName ? s.firstName[0] : (s.username ? s.username[0] : '?')}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                                                {s.firstName || ''} {s.lastName || ''}
                                            </span>
                                        </div>
                                        <Checkbox
                                            checked={selectedIds.includes(s.id)}
                                            onCheckedChange={() => toggleSelection(s.id)}
                                            className="rounded-full"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">İptal</Button>
                    <Button
                        disabled={loading || selectedIds.length === 0}
                        onClick={handleBulkEnroll}
                        className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl min-w-[120px]"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `${selectedIds.length} Öğrenciyi Ekle`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
