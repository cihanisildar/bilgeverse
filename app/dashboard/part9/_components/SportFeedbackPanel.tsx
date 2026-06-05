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
import { MessageSquare, Plus, Send, Trash2 } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { UserRole } from '@prisma/client';
import { useSportFeedback, useCreateSportFeedback, useRespondSportFeedback, useUpdateFeedbackStatus, useDeleteSportFeedback } from '@/app/hooks/use-sports';
import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES, getFeedbackStatusMeta, getFeedbackCategoryLabel } from '@/app/lib/sports';
import { ReqMark, RequiredLegend } from './ReqMark';
import { format } from 'date-fns';

export default function SportFeedbackPanel() {
    const { user } = useAuth();
    const roles = user?.roles && user.roles.length > 0 ? user.roles : user?.role ? [user.role] : [];
    const isManager = roles.some((r) => ([UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN, UserRole.BOARD_MEMBER] as UserRole[]).includes(r as UserRole));

    const [statusFilter, setStatusFilter] = useState<string>('all');

    const { data: feedback = [] } = useSportFeedback(statusFilter === 'all' ? undefined : { status: statusFilter as any });
    const createMutation = useCreateSportFeedback();
    const respondMutation = useRespondSportFeedback();
    const updateStatusMutation = useUpdateFeedbackStatus();
    const deleteMutation = useDeleteSportFeedback();

    const [newDialog, setNewDialog] = useState(false);
    const [form, setForm] = useState({ subject: '', message: '', category: 'REQUEST' });

    const [respDialog, setRespDialog] = useState(false);
    const [respItem, setRespItem] = useState<any>(null);
    const [respForm, setRespForm] = useState({ response: '', status: 'RESOLVED' });
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const submit = () => {
        if (!form.subject || !form.message) return;
        createMutation.mutate(form as any, {
            onSuccess: (res) => {
                if (!res.error) { setNewDialog(false); setForm({ subject: '', message: '', category: 'REQUEST' }); }
            }
        });
    };

    const openResp = (item: any) => {
        setRespItem(item);
        setRespForm({ response: item.response ?? '', status: item.status === 'NEW' ? 'IN_REVIEW' : item.status });
        setRespDialog(true);
    };
    const sendResp = () => {
        if (!respForm.response || !respItem) return;
        respondMutation.mutate(
            { id: respItem.id, data: { response: respForm.response, status: respForm.status as any } },
            { onSuccess: (res) => { if (!res.error) setRespDialog(false); } }
        );
    };
    const changeStatus = (id: string, status: string) => updateStatusMutation.mutate({ id, status: status as any });
    const confirmDelete = () => {
        if (!deletingId) return;
        deleteMutation.mutate(deletingId);
        setDeletingId(null);
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-500" /> Geri Bildirim & Talepler
                    </h2>
                    <p className="text-sm text-gray-500">
                        {isManager ? 'Sporcu ve velilerden gelen talep, şikayet ve önerileri yönetin.' : 'Talep, şikayet ve önerilerinizi iletin.'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {isManager && (
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40"><SelectValue placeholder="Durum" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tümü</SelectItem>
                                {FEEDBACK_STATUSES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    )}
                    <Button onClick={() => setNewDialog(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white"><Plus className="h-4 w-4 mr-2" /> {isManager ? 'Kayıt' : 'Gönder'}</Button>
                </div>
            </div>

            {feedback.length === 0 ? (
                <Card className="border-gray-100"><CardContent className="p-10 text-center text-gray-400">Geri bildirim bulunmuyor.</CardContent></Card>
            ) : (
                <div className="space-y-3">
                    {feedback.map((f) => {
                        const meta = getFeedbackStatusMeta(f.status);
                        return (
                            <Card key={f.id} className="border-gray-100 shadow-sm group">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="secondary" className="text-[10px]">{getFeedbackCategoryLabel(f.category)}</Badge>
                                                <Badge variant="outline" className={`text-[10px] ${meta.color}`}>{meta.label}</Badge>
                                            </div>
                                            <p className="font-bold text-gray-800">{f.subject}</p>
                                            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{f.message}</p>
                                            <p className="text-[11px] text-gray-400 mt-2">
                                                {f.createdBy ? `${f.createdBy.firstName ?? ''} ${f.createdBy.lastName ?? ''}`.trim() : 'Anonim'} · {format(new Date(f.createdAt), 'dd.MM.yyyy')}
                                            </p>
                                            {f.response && (
                                                <div className="mt-3 p-3 rounded-lg bg-blue-50/60 border border-blue-100">
                                                    <p className="text-[11px] font-semibold text-blue-700 mb-0.5">Yanıt{f.respondedBy ? ` · ${f.respondedBy.firstName} ${f.respondedBy.lastName}` : ''}</p>
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{f.response}</p>
                                                </div>
                                            )}
                                        </div>
                                        {isManager && (
                                            <div className="flex flex-col gap-1 shrink-0">
                                                <Button size="sm" variant="outline" onClick={() => openResp(f)} className="text-xs"><Send className="h-3.5 w-3.5 mr-1" /> Yanıtla</Button>
                                                {f.status !== 'RESOLVED' && (
                                                    <Button size="sm" variant="ghost" onClick={() => changeStatus(f.id, 'RESOLVED')} className="text-xs text-green-600">Çözüldü</Button>
                                                )}
                                                <Button size="sm" variant="ghost" onClick={() => setDeletingId(f.id)} className="text-xs text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* New feedback dialog */}
            <Dialog open={newDialog} onOpenChange={setNewDialog}>
                <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader><DialogTitle>Geri Bildirim Gönder</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1.5"><Label>Kategori</Label>
                            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{FEEDBACK_CATEGORIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5"><Label>Konu <ReqMark /></Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
                        <div className="space-y-1.5"><Label>Mesaj <ReqMark /></Label><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} /></div>
                        <RequiredLegend />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNewDialog(false)}>İptal</Button>
                        <Button onClick={submit} className="bg-indigo-600 hover:bg-indigo-700 text-white">Gönder</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Respond dialog */}
            <Dialog open={respDialog} onOpenChange={setRespDialog}>
                <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader><DialogTitle>Geri Bildirimi Yanıtla</DialogTitle></DialogHeader>
                    {respItem && (
                        <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                                <p className="text-sm font-semibold text-gray-800">{respItem.subject}</p>
                                <p className="text-xs text-gray-500 mt-1">{respItem.message}</p>
                            </div>
                            <div className="space-y-1.5"><Label>Durum</Label>
                                <Select value={respForm.status} onValueChange={(v) => setRespForm({ ...respForm, status: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{FEEDBACK_STATUSES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5"><Label>Yanıt <ReqMark /></Label><Textarea value={respForm.response} onChange={(e) => setRespForm({ ...respForm, response: e.target.value })} rows={4} /></div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRespDialog(false)}>İptal</Button>
                        <Button onClick={sendResp} className="bg-indigo-600 hover:bg-indigo-700 text-white">Kaydet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deletingId}
                onOpenChange={(open) => { if (!open) setDeletingId(null); }}
                onConfirm={confirmDelete}
                title="Geri Bildirim Silinsin mi?"
                description="Bu geri bildirim kaydı kalıcı olarak silinecektir."
                loading={deleteMutation.isPending}
            />
        </div>
    );
}
