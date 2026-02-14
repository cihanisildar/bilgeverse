import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trophy, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { useSportBranches, useUpsertSportBranch, useDeleteSportBranch } from '@/app/hooks/use-athlete-data';

interface Branch {
    id: string;
    name: string;
    description: string | null;
    _count?: {
        athletes: number;
    };
}

export default function BranchList() {
    const { data: branches = [], isLoading: loading } = useSportBranches();
    const upsertBranchMutation = useUpsertSportBranch();
    const deleteBranchMutation = useDeleteSportBranch();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [currentBranch, setCurrentBranch] = useState<{ id?: string; name: string; description: string }>({
        name: '',
        description: ''
    });

    const { toast } = useToast();

    const handleSaveBranch = async () => {
        if (!currentBranch.name) {
            toast({ title: 'Hata', description: 'Grup adı boş olamaz', variant: 'destructive' });
            return;
        }

        const result = await upsertBranchMutation.mutateAsync(currentBranch);
        if (!result.error) {
            setIsDialogOpen(false);
            setCurrentBranch({ name: '', description: '' });
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const result = await deleteBranchMutation.mutateAsync(deleteId);
        if (!result.error) {
            setDeleteId(null);
        }
    };

    const openEditDialog = (branch: Branch) => {
        setCurrentBranch({
            id: branch.id,
            name: branch.name,
            description: branch.description || ''
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800">Spor Branşları</h3>
                    <p className="text-sm text-gray-500">Kulüp bünyesindeki spor kategorilerini yönetin</p>
                </div>
                <Button
                    onClick={() => {
                        setCurrentBranch({ name: '', description: '' });
                        setIsDialogOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" /> Yeni Branş
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <Card key={i} className="animate-pulse bg-gray-50 border-0 h-32"></Card>
                    ))
                ) : branches.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl">
                        <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Henüz hiç branş eklenmemiş</p>
                    </div>
                ) : (
                    branches.map((branch) => (
                        <Card key={branch.id} className="hover:shadow-md transition-shadow duration-200 border-gray-100 group relative">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                                        {branch.name}
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100">
                                        {branch._count?.athletes || 0} Sporcu
                                    </Badge>
                                </div>
                                {branch.description && (
                                    <CardDescription className="line-clamp-2 mt-1">
                                        {branch.description}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    Aktif
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-indigo-600" onClick={() => openEditDialog(branch)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => setDeleteId(branch.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentBranch.id ? 'Branşı Düzenle' : 'Yeni Branş Ekle'}</DialogTitle>
                        <DialogDescription>
                            Spor branşı bilgilerini girin. Branş adı benzersiz olmalıdır.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Branş Adı</label>
                            <Input
                                placeholder="örn: Futbol"
                                value={currentBranch.name}
                                onChange={(e) => setCurrentBranch({ ...currentBranch, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Açıklama</label>
                            <Input
                                placeholder="Branş hakkında detaylı bilgi"
                                value={currentBranch.description}
                                onChange={(e) => setCurrentBranch({ ...currentBranch, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>İptal</Button>
                        <Button onClick={handleSaveBranch} className="bg-indigo-600 text-white">
                            {currentBranch.id ? 'Güncelle' : 'Kaydet'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu branşı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve bu branşa bağlı antrenmanlar varsa hata alabilirsiniz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">Sil</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
