'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Megaphone, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { UserRole } from '@prisma/client';
import { useSportBranches } from '@/app/hooks/use-athlete-data';
import { useSportAnnouncements, useCreateSportAnnouncement, useDeleteSportAnnouncement } from '@/app/hooks/use-sports';
import { ANNOUNCEMENT_TYPES, getAnnouncementTypeMeta } from '@/app/lib/sports';
import { ReqMark, RequiredLegend } from './ReqMark';
import { format } from 'date-fns';

export default function SportAnnouncements() {
    const { user } = useAuth();
    const roles = user?.roles && user.roles.length > 0 ? user.roles : user?.role ? [user.role] : [];
    const isManager = roles.some((r) => ([UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN, UserRole.BOARD_MEMBER] as UserRole[]).includes(r as UserRole));

    const { data: announcements = [] } = useSportAnnouncements();
    const { data: branches = [] } = useSportBranches();
    const createMutation = useCreateSportAnnouncement();
    const deleteMutation = useDeleteSportAnnouncement();

    const [dialog, setDialog] = useState(false);
    const [form, setForm] = useState({ title: '', content: '', type: 'ANNOUNCEMENT', branchId: '' });
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const save = () => {
        if (!form.title || !form.content) return;
        createMutation.mutate(
            { title: form.title, content: form.content, type: form.type, branchId: form.branchId || null },
            { onSuccess: (res) => { if (!res.error) { setDialog(false); setForm({ title: '', content: '', type: 'ANNOUNCEMENT', branchId: '' }); } } }
        );
    };
    const confirmDelete = () => {
        if (!deletingId) return;
        deleteMutation.mutate(deletingId);
        setDeletingId(null);
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-indigo-500" /> Duyurular
                    </h2>
                    <p className="text-sm text-gray-500">Sporcu ve velilere duyuru, antrenman değişikliği ve etkinlik bilgisi.</p>
                </div>
                {isManager && <Button onClick={() => setDialog(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white"><Plus className="h-4 w-4 mr-2" /> Duyuru</Button>}
            </div>

            {announcements.length === 0 ? (
                <Card className="border-gray-100"><CardContent className="p-10 text-center text-gray-400">Henüz duyuru yok.</CardContent></Card>
            ) : (
                <div className="space-y-3">
                    {announcements.map((a) => {
                        const meta = getAnnouncementTypeMeta(a.type);
                        return (
                            <Card key={a.id} className="border-gray-100 shadow-sm group">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className={`text-[10px] ${meta.color}`}>{meta.label}</Badge>
                                                {a.branch && <Badge variant="secondary" className="text-[10px]">{a.branch.name}</Badge>}
                                            </div>
                                            <p className="font-bold text-gray-800">{a.title}</p>
                                            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{a.content}</p>
                                            <p className="text-[11px] text-gray-400 mt-2">
                                                {format(new Date(a.createdAt), 'dd.MM.yyyy HH:mm')}
                                                {a.createdBy ? ` · ${a.createdBy.firstName} ${a.createdBy.lastName}` : ''}
                                            </p>
                                        </div>
                                        {isManager && (
                                            <Button size="sm" variant="ghost" onClick={() => setDeletingId(a.id)} className="text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Dialog open={dialog} onOpenChange={setDialog}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader><DialogTitle>Yeni Duyuru</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5"><Label>Tür</Label>
                                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{ANNOUNCEMENT_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5"><Label>Hedef Branş</Label>
                                <Select value={form.branchId || 'all'} onValueChange={(v) => setForm({ ...form, branchId: v === 'all' ? '' : v })}>
                                    <SelectTrigger><SelectValue placeholder="Tümü" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tüm Kulüp</SelectItem>
                                        {branches.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5"><Label>Başlık <ReqMark /></Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                        <div className="space-y-1.5"><Label>İçerik <ReqMark /></Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} /></div>
                        <RequiredLegend />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialog(false)}>İptal</Button>
                        <Button onClick={save} className="bg-indigo-600 hover:bg-indigo-700 text-white">Yayınla</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deletingId}
                onOpenChange={(open) => { if (!open) setDeletingId(null); }}
                onConfirm={confirmDelete}
                title="Duyuru Silinsin mi?"
                description="Bu duyuru kalıcı olarak silinecektir."
                loading={deleteMutation.isPending}
            />
        </div>
    );
}
