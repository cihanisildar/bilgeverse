'use client';

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { addDonation } from "@/app/actions/donations";
import { toast } from "react-hot-toast";

import { Donor } from "@/types/donations";

interface DonationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    donor: Donor;
}

export default function DonationDialog({ isOpen, onClose, donor }: DonationDialogProps) {
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) {
            toast.error("Lütfen geçerli bir tutar girin");
            return;
        }

        setLoading(true);

        try {
            const res = await addDonation({
                donorId: donor.id,
                amount: parseFloat(amount),
                donationDate: new Date(date),
                notes,
            });

            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Bağış başarıyla eklendi");
                queryClient.invalidateQueries({ queryKey: ['donors'] });
                queryClient.invalidateQueries({ queryKey: ['donorDetails', donor.id] });
                setAmount("");
                setNotes("");
                onClose();
            }
        } catch (error) {
            toast.error("Bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Bağış Ekle</DialogTitle>
                    <DialogDescription>
                        {donor?.firstName} {donor?.lastName} için yeni bir bağış girişi yapın.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Tutar (TL) *</Label>
                        <div className="relative">
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                required
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-8"
                            />
                            <span className="absolute left-3 top-2.5 text-muted-foreground font-medium">₺</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date">Tarih *</Label>
                        <Input
                            id="date"
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Açıklama / Not</Label>
                        <Input
                            id="notes"
                            placeholder="İsteğe bağlı..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            İptal
                        </Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Bağış Kaydet
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
