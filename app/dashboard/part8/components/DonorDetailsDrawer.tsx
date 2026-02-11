'use client';

import { useState, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    History,
    Trash2,
    DollarSign,
    Calendar,
    Info,
    Loader2,
    AlertTriangle
} from "lucide-react";
import { getDonorDetails, deleteDonation } from "@/app/actions/donations";
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

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DonorDetails, Donation } from "@/types/donations";

interface DonorDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    donorId: string | null;
}

export default function DonorDetailsDrawer({ isOpen, onClose, donorId }: DonorDetailsDrawerProps) {
    const queryClient = useQueryClient();

    const { data: donorResult, isLoading: loading } = useQuery({
        queryKey: ['donorDetails', donorId],
        queryFn: async () => {
            if (!donorId) return null;
            const res = await getDonorDetails(donorId);
            if (res.error) throw new Error(res.error);
            return res.data;
        },
        enabled: isOpen && !!donorId,
    });

    const donor = donorResult;
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDeleteDonation = async () => {
        if (!deletingId) return;

        const res = await deleteDonation(deletingId);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Bağış kaydı silindi");
            queryClient.invalidateQueries({ queryKey: ['donors'] });
            queryClient.invalidateQueries({ queryKey: ['donorDetails', donorId] });
        }
        setDeletingId(null);
    };

    return (
        <>
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent className="sm:max-w-[540px] p-0 flex flex-col">
                    <SheetHeader className="p-6 border-b bg-rose-50/50">
                        <div className="flex items-center justify-between mb-2">
                            <SheetTitle className="text-2xl font-bold text-rose-900">
                                Bağışçı Detayları
                            </SheetTitle>
                            {donor?.isInactive && (
                                <Badge variant="destructive" className="bg-rose-100 text-rose-700 animate-pulse">
                                    Hareketsiz Warning
                                </Badge>
                            )}
                        </div>
                        <SheetDescription className="text-rose-700">
                            {donor?.firstName} {donor?.lastName} - Bağış Geçmişi ve Bilgiler
                        </SheetDescription>
                    </SheetHeader>

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
                        </div>
                    ) : donor ? (
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-6 space-y-8">
                                {/* Stats Summary */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                        <p className="text-xs text-emerald-600 uppercase font-bold mb-1">Toplam Bağış</p>
                                        <p className="text-2xl font-bold text-emerald-900">
                                            {donor.totalDonated.toLocaleString('tr-TR')} ₺
                                        </p>
                                    </div>
                                    <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                                        <p className="text-xs text-rose-600 uppercase font-bold mb-1">Bağış Sayısı</p>
                                        <p className="text-2xl font-bold text-rose-900">
                                            {donor.donations.length} Adet
                                        </p>
                                    </div>
                                </div>

                                {/* Donor Info */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                                        <Info className="h-4 w-4 mr-2" /> İletişim Bilgileri
                                    </h3>
                                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground mb-1">E-posta</p>
                                            <p className="font-medium">{donor.email || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground mb-1">Telefon</p>
                                            <p className="font-medium">{donor.phone || '-'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-muted-foreground mb-1">Adres</p>
                                            <p className="font-medium">{donor.address || '-'}</p>
                                        </div>
                                        {donor.notes && (
                                            <div className="col-span-2">
                                                <p className="text-muted-foreground mb-1">Notlar</p>
                                                <p className="bg-gray-50 p-3 rounded-lg border italic">{donor.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Donation History */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                                        <History className="h-4 w-4 mr-2" /> Bağış Geçmişi
                                    </h3>

                                    {donor.donations.length === 0 ? (
                                        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50">
                                            <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500">Henüz bağış kaydı bulunmuyor.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {donor.donations.map((donation: Donation) => (
                                                <div key={donation.id} className="group relative bg-white border rounded-xl p-4 transition-all hover:bg-gray-50">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-lg font-bold text-emerald-700">
                                                            {donation.amount.toLocaleString('tr-TR')} ₺
                                                        </span>
                                                        <div className="flex items-center text-xs text-muted-foreground">
                                                            <Calendar className="h-3 w-3 mr-1" />
                                                            {format(new Date(donation.donationDate), "d MMMM yyyy", { locale: tr })}
                                                        </div>
                                                    </div>
                                                    {donation.notes && (
                                                        <p className="text-sm text-gray-600">{donation.notes}</p>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-white shadow-sm border border-rose-100 text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => setDeletingId(donation.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div className="p-6 border-t bg-gray-50">
                        <Button variant="outline" className="w-full" onClick={onClose}>
                            Kapat
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bağış Kaydı Silinsin mi?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu bağış kaydı kalıcı olarak silinecektir. Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteDonation} className="bg-rose-600 hover:bg-rose-700 text-white border-none">
                            Evet, Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
