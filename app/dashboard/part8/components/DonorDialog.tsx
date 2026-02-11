'use client';

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { createDonor, updateDonor } from "@/app/actions/donations";
import { toast } from "react-hot-toast";

import { Donor } from "@/types/donations";

interface DonorDialogProps {
    isOpen: boolean;
    onClose: () => void;
    donor?: Donor | null;
}

export default function DonorDialog({ isOpen, onClose, donor }: DonorDialogProps) {
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
    });

    useEffect(() => {
        if (donor) {
            setFormData({
                firstName: donor.firstName || "",
                lastName: donor.lastName || "",
                email: donor.email || "",
                phone: donor.phone || "",
                address: donor.address || "",
                notes: donor.notes || "",
            });
        } else {
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                address: "",
                notes: "",
            });
        }
    }, [donor, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = donor
                ? await updateDonor(donor.id, formData)
                : await createDonor(formData);

            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(donor ? "Bağışçı güncellendi" : "Yeni bağışçı oluşturuldu");
                queryClient.invalidateQueries({ queryKey: ['donors'] });
                if (donor) {
                    queryClient.invalidateQueries({ queryKey: ['donorDetails', donor.id] });
                }
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{donor ? "Bağışçıyı Düzenle" : "Yeni Bağışçı Ekle"}</DialogTitle>
                    <DialogDescription>
                        Bağışçı bilgilerini buradan {donor ? "güncelleyebilirsiniz" : "ekleyebilirsiniz"}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Ad *</Label>
                            <Input
                                id="firstName"
                                required
                                maxLength={50}
                                placeholder="Örn: Ahmet"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Soyad *</Label>
                            <Input
                                id="lastName"
                                required
                                maxLength={50}
                                placeholder="Örn: Yılmaz"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-posta</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="ornek@mail.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefon</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="05XXXXXXXXX"
                                maxLength={11}
                                pattern="[0-9]{10,11}"
                                title="Lütfen 10 veya 11 haneli bir telefon numarası girin"
                                value={formData.phone}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "");
                                    setFormData({ ...formData, phone: val });
                                }}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Adres</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notlar</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            İptal
                        </Button>
                        <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {donor ? "Güncelle" : "Kaydet"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
