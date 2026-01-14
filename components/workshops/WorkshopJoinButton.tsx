'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, Clock, CheckCircle2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface WorkshopJoinButtonProps {
    workshopId: string;
    currentStatus: 'not_member' | 'pending' | 'member';
    onStatusChange?: () => void;
}

export function WorkshopJoinButton({ workshopId, currentStatus, onStatusChange }: WorkshopJoinButtonProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoinRequest = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/workshops/${workshopId}/join-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message.trim() || null }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to send join request');
            }

            setOpen(false);
            setMessage('');
            toast({
                title: "Katılım İsteği Gönderildi",
                description: "İsteğiniz rehberler tarafından değerlendirilecektir.",
            });
            router.refresh();
            onStatusChange?.();
        } catch (error) {
            console.error('Error sending join request:', error);
            toast({
                title: "Hata",
                description: error instanceof Error ? error.message : 'Katılım isteği gönderilemedi',
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveWorkshop = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/workshops/${workshopId}/leave`, {
                method: 'POST',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to leave workshop');
            }

            setLeaveDialogOpen(false);
            toast({
                title: "Atölyeden Ayrıldınız",
                description: "Başarıyla atölyeden ayrıldınız.",
            });
            router.refresh();
            onStatusChange?.();
        } catch (error) {
            console.error('Error leaving workshop:', error);
            toast({
                title: "Hata",
                description: error instanceof Error ? error.message : 'Atölyeden ayrılılamadı',
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (currentStatus === 'member') {
        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Atölye üyesisiniz</span>
                </div>
                <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                            <LogOut className="h-4 w-4 mr-2" />
                            Ayrıl
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Atölyeden ayrılmak istediğinize emin misiniz?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bu işlem geri alınamaz. Atölyeden ayrıldıktan sonra tekrar katılmak için yeni bir katılım isteği göndermeniz gerekecektir.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={loading}>İptal</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleLeaveWorkshop}
                                disabled={loading}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {loading ? 'İşleniyor...' : 'Evet, Ayrıl'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
    }

    if (currentStatus === 'pending') {
        return (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
                <Clock className="h-4 w-4 animate-pulse" />
                <span className="font-medium">İsteğiniz değerlendiriliyor</span>
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Katılım İsteği Gönder
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Atölye Katılım İsteği</DialogTitle>
                    <DialogDescription>
                        Bu atölyeye katılmak için istek gönderin. Atölye rehberleri tarafından değerlendirilecektir.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="message">Mesaj (Opsiyonel)</Label>
                        <Textarea
                            id="message"
                            placeholder="Neden bu atölyeye katılmak istiyorsunuz?"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        İptal
                    </Button>
                    <Button onClick={handleJoinRequest} disabled={loading}>
                        {loading ? 'Gönderiliyor...' : 'İstek Gönder'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
