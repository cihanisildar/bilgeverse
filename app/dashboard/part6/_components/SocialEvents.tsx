'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, Edit2, Trash2, CalendarHeart, Repeat, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
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

import { useSocialEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/app/hooks/use-social';
import { EVENT_TYPES, getEventTypeMeta, TR_SPECIAL_DAYS } from '@/app/lib/social';
import { SocialEvent } from '@/types/social';
import { SocialEventType } from '@prisma/client';

export default function SocialEvents() {
    const { data: events = [], isLoading } = useSocialEvents();
    const createEvent = useCreateEvent();
    const updateEvent = useUpdateEvent();
    const deleteEvent = useDeleteEvent();

    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState<SocialEvent | null>(null);
    const [eventToDelete, setEventToDelete] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [type, setType] = useState<SocialEventType>(SocialEventType.EVENT);
    const [recurring, setRecurring] = useState(false);
    const [reminderDays, setReminderDays] = useState(7);

    const openDialog = (ev: SocialEvent | null = null) => {
        if (ev) {
            setEditing(ev);
            setTitle(ev.title);
            setDescription(ev.description || '');
            setDate(new Date(ev.date).toISOString().split('T')[0]);
            setType(ev.type);
            setRecurring(ev.recurring);
            setReminderDays(ev.reminderDays);
        } else {
            setEditing(null);
            setTitle('');
            setDescription('');
            setDate('');
            setType(SocialEventType.EVENT);
            setRecurring(false);
            setReminderDays(7);
        }
        setIsOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { title, description, date, type, recurring, reminderDays: Number(reminderDays) };
        try {
            if (editing) {
                await updateEvent.mutateAsync({ id: editing.id, data: payload });
                toast.success('Etkinlik başarıyla güncellendi.');
            } else {
                await createEvent.mutateAsync(payload);
                toast.success('Etkinlik başarıyla oluşturuldu.');
            }
            setIsOpen(false);
        } catch (error) {
            toast.error('İşlem sırasında bir hata oluştu.');
        }
    };

    const confirmDelete = async () => {
        if (!eventToDelete) return;
        try {
            await deleteEvent.mutateAsync(eventToDelete);
            toast.success('Etkinlik başarıyla silindi.');
        } catch (error) {
            toast.error('Etkinlik silinirken bir hata oluştu.');
        } finally {
            setEventToDelete(null);
        }
    };

    const saving = createEvent.isPending || updateEvent.isPending;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Özel Günler & Kampanyalar</h2>
                    <p className="text-gray-500 text-sm">Özel gün, etkinlik ve kampanyaları kaydedin; yaklaşanlar Genel Bakış'ta hatırlatılır.</p>
                </div>
                <Button onClick={() => openDialog()} className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                    <Plus className="h-4 w-4 mr-2" /> Yeni Etkinlik
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
            ) : events.length === 0 ? (
                <Card className="border-dashed border-2 border-teal-100 bg-teal-50/30">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <CalendarHeart className="h-12 w-12 text-teal-200 mb-4" />
                        <h3 className="text-lg font-medium text-gray-700">Henüz etkinlik eklenmemiş</h3>
                        <p className="text-gray-500 max-w-sm mt-2">Kampanya ve özel günlerinizi ekleyin; sistem yaklaşınca hatırlatsın.</p>
                        <Button variant="outline" className="mt-6 border-teal-200 text-teal-600" onClick={() => openDialog()}>İlk Etkinliği Ekle</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((ev) => {
                        const meta = getEventTypeMeta(ev.type);
                        return (
                            <Card key={ev.id} className="group border-0 shadow-sm hover:shadow-md transition-all">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between">
                                        <Badge variant="outline" className={`${meta.bg} ${meta.color} border-transparent`}>{meta.label}</Badge>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:bg-blue-50" onClick={() => openDialog(ev)}>
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600 hover:bg-rose-50" onClick={() => setEventToDelete(ev.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mt-3">{ev.title}</h3>
                                    {ev.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ev.description}</p>}
                                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                        <span className="font-semibold text-gray-700">
                                            {new Date(ev.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: ev.recurring ? undefined : 'numeric' })}
                                        </span>
                                        {ev.recurring && <span className="flex items-center gap-1 text-teal-600"><Repeat className="h-3 w-3" /> Yıllık</span>}
                                        <span className="flex items-center gap-1"><Bell className="h-3 w-3" /> {ev.reminderDays} gün önce</span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Reference: seed special days */}
            <Card className="border-0 shadow-sm bg-gray-50/50">
                <CardContent className="p-5">
                    <h4 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
                        <CalendarHeart className="h-4 w-4 text-rose-500" /> Hazır Özel Günler (otomatik hatırlatılır)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {TR_SPECIAL_DAYS.map((sd) => (
                            <Badge key={sd.title} variant="outline" className="bg-white text-gray-600 border-gray-200 font-normal">
                                {sd.day}.{sd.month} · {sd.title}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Etkinliği Düzenle' : 'Yeni Etkinlik'}</DialogTitle>
                        <DialogDescription>Özel gün, etkinlik veya kampanya bilgilerini girin.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="ev-title">Başlık</Label>
                            <Input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: Bahar Kampanyası" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ev-date">Tarih</Label>
                                <Input id="ev-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ev-type">Tür</Label>
                                <Select value={type} onValueChange={(v) => setType(v as SocialEventType)}>
                                    <SelectTrigger id="ev-type"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {EVENT_TYPES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ev-desc">Açıklama</Label>
                            <Textarea id="ev-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="İsteğe bağlı not..." className="min-h-[80px]" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <Label htmlFor="ev-remind">Hatırlatma (gün önce)</Label>
                                <Input id="ev-remind" type="number" min={0} max={365} value={reminderDays} onChange={(e) => setReminderDays(Number(e.target.value))} />
                            </div>
                            <label className="flex items-center gap-2 text-sm text-gray-700 pb-2 cursor-pointer">
                                <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="h-4 w-4 accent-teal-600" />
                                Her yıl tekrarla
                            </label>
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>İptal</Button>
                            <Button type="submit" disabled={saving} className="bg-teal-600 text-white min-w-[100px]">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Güncelle' : 'Kaydet'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Etkinliği silmek istediğinize emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu etkinliği silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white">
                            {deleteEvent.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sil'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
