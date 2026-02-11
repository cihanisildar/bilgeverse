'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, User, History, PlusCircle, Trash2 } from "lucide-react";
import { deleteDonor } from "@/app/actions/donations";
import { toast } from "react-hot-toast";
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
import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Donor } from "@/types/donations";

interface DonorTableProps {
    donors: Donor[];
    onViewDetails: (donor: Donor) => void;
    onAddDonation: (donor: Donor) => void;
    onEdit: (donor: Donor) => void;
}

export default function DonorTable({ donors, onViewDetails, onAddDonation, onEdit }: DonorTableProps) {
    const queryClient = useQueryClient();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            const res = await deleteDonor(deletingId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Bağışçı silindi");
                queryClient.invalidateQueries({ queryKey: ['donors'] });
            }
        } catch (error) {
            toast.error("Bir hata oluştu");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Ad Soyad</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Toplam Bağış</TableHead>
                        <TableHead>Son Bağış</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {donors.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                Bağışçı bulunamadı.
                            </TableCell>
                        </TableRow>
                    ) : (
                        donors.map((donor) => (
                            <TableRow key={donor.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{donor.firstName} {donor.lastName}</span>
                                        <span className="text-xs text-muted-foreground">{donor.email || donor.phone || '-'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {donor.isInactive ? (
                                        <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none">
                                            Hareketsiz (2+ Ay)
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
                                            Aktif
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="font-semibold">
                                    {donor.totalDonated.toLocaleString('tr-TR')} ₺
                                </TableCell>
                                <TableCell>
                                    {donor.lastDonationDate
                                        ? format(new Date(donor.lastDonationDate), "d MMMM yyyy", { locale: tr })
                                        : '-'
                                    }
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => onAddDonation(donor)}>
                                                <PlusCircle className="mr-2 h-4 w-4 text-emerald-600" />
                                                Bağış Ekle
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => onViewDetails(donor)}>
                                                <History className="mr-2 h-4 w-4 text-rose-600" />
                                                Bağış Geçmişi
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => onEdit(donor)}>
                                                <User className="mr-2 h-4 w-4" />
                                                Düzenle
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onSelect={(e) => e.preventDefault()}
                                                onClick={() => setDeletingId(donor.id)}
                                                className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Sil
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bağışçıyı Sil?</AlertDialogTitle>
                        <AlertDialogDescription>
                            DİKKAT: Bu bağışçıyı sildiğinizde, ona ait <strong>tüm bağış geçmişi ve kayıtlar da kalıcı olarak silinecektir</strong>. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-white border-none">
                            Evet, Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
