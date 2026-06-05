'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Gavel, Plus, Trash2, ScrollText, Pencil } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { UserRole } from '@prisma/client';
import { useAthletes } from '@/app/hooks/use-athlete-data';
import {
    useDisciplineRules, useUpsertDisciplineRule, useDeleteDisciplineRule,
    useDisciplineRecords, useCreateDisciplineRecord, useDeleteDisciplineRecord,
} from '@/app/hooks/use-sports';
import { ReqMark, RequiredLegend } from './ReqMark';
import { format } from 'date-fns';

export default function DisciplinePanel() {
    const { user } = useAuth();
    const roles = user?.roles && user.roles.length > 0 ? user.roles : user?.role ? [user.role] : [];
    const isManager = roles.some((r) => ([UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN, UserRole.BOARD_MEMBER] as UserRole[]).includes(r as UserRole));

    const { data: rules = [] } = useDisciplineRules();
    const { data: records = [] } = useDisciplineRecords();
    const { data: athletes = [] } = useAthletes();

    const upsertRuleMutation = useUpsertDisciplineRule();
    const deleteRuleMutation = useDeleteDisciplineRule();
    const createRecordMutation = useCreateDisciplineRecord();
    const deleteRecordMutation = useDeleteDisciplineRecord();

    const [ruleDialog, setRuleDialog] = useState(false);
    const [editRule, setEditRule] = useState<any>(null);
    const [rForm, setRForm] = useState({ code: '', offense: '', penalty: '' });

    const [recordDialog, setRecordDialog] = useState(false);
    const [recForm, setRecForm] = useState({ athleteId: '', ruleId: '', offense: '', penalty: '', date: '', note: '' });

    const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
    const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);

    const openRule = (rule?: any) => {
        setEditRule(rule ?? null);
        setRForm(rule ? { code: rule.code ?? '', offense: rule.offense, penalty: rule.penalty } : { code: '', offense: '', penalty: '' });
        setRuleDialog(true);
    };

    const saveRule = () => {
        upsertRuleMutation.mutate(
            { id: editRule?.id, code: rForm.code, offense: rForm.offense, penalty: rForm.penalty, order: editRule?.order ?? rules.length },
            { onSuccess: (res) => { if (!res.error) setRuleDialog(false); } }
        );
    };

    const confirmRemoveRule = () => {
        if (!deletingRuleId) return;
        deleteRuleMutation.mutate(deletingRuleId);
        setDeletingRuleId(null);
    };

    const onSelectRule = (ruleId: string) => {
        const rule = rules.find((x: any) => x.id === ruleId);
        setRecForm({ ...recForm, ruleId, offense: rule?.offense ?? recForm.offense, penalty: rule?.penalty ?? recForm.penalty });
    };

    const saveRecord = () => {
        createRecordMutation.mutate(
            {
                athleteId: recForm.athleteId,
                ruleId: recForm.ruleId || null,
                offense: recForm.offense,
                penalty: recForm.penalty,
                date: recForm.date ? new Date(recForm.date) : undefined,
                note: recForm.note,
            },
            {
                onSuccess: (res) => {
                    if (!res.error) {
                        setRecordDialog(false);
                        setRecForm({ athleteId: '', ruleId: '', offense: '', penalty: '', date: '', note: '' });
                    }
                }
            }
        );
    };

    const confirmRemoveRecord = () => {
        if (!deletingRecordId) return;
        deleteRecordMutation.mutate(deletingRecordId);
        setDeletingRecordId(null);
    };

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Gavel className="h-5 w-5 text-red-500" /> Disiplin
                </h2>
                <p className="text-sm text-gray-500">Disiplin yönetmeliği (suç/ceza) ve sporcu ihlal kayıtları.</p>
            </div>

            <Tabs defaultValue="rules">
                <TabsList>
                    <TabsTrigger value="rules">Yönetmelik</TabsTrigger>
                    <TabsTrigger value="records">İhlal Kayıtları</TabsTrigger>
                </TabsList>

                {/* RULES */}
                <TabsContent value="rules" className="space-y-3 mt-4">
                    {isManager && (
                        <Button onClick={() => openRule()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="h-4 w-4 mr-2" /> Madde Ekle
                        </Button>
                    )}
                    <Card className="border-gray-100 shadow-sm">
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                                        <th className="px-4 py-3 w-16">Kod</th>
                                        <th className="px-4 py-3">Kabahat</th>
                                        <th className="px-4 py-3">Ceza</th>
                                        {isManager && <th className="px-4 py-3 w-20"></th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rules.length === 0 ? (
                                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400"><ScrollText className="h-8 w-8 mx-auto mb-2 text-gray-300" />Yönetmelik maddesi yok.</td></tr>
                                    ) : rules.map((rule) => (
                                        <tr key={rule.id} className="border-b border-gray-50 group">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{rule.code || '-'}</td>
                                            <td className="px-4 py-3 text-gray-800">{rule.offense}</td>
                                            <td className="px-4 py-3 text-gray-600">{rule.penalty}</td>
                                            {isManager && (
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                                        <Button size="sm" variant="ghost" onClick={() => openRule(rule)}><Pencil className="h-3.5 w-3.5" /></Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setDeletingRuleId(rule.id)} className="text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* RECORDS */}
                <TabsContent value="records" className="space-y-3 mt-4">
                    {isManager && (
                        <Button onClick={() => setRecordDialog(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="h-4 w-4 mr-2" /> İhlal Kaydı Ekle
                        </Button>
                    )}
                    {records.length === 0 ? (
                        <Card className="border-gray-100"><CardContent className="p-10 text-center text-gray-400">İhlal kaydı yok.</CardContent></Card>
                    ) : (
                        <div className="space-y-2">
                            {records.map((rec) => (
                                <Card key={rec.id} className="border-gray-100 shadow-sm group">
                                    <CardContent className="p-4 flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                {rec.athlete?.user?.firstName} {rec.athlete?.user?.lastName}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-0.5">{rec.offense}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">{rec.penalty}</Badge>
                                                <span className="text-[11px] text-gray-400">{format(new Date(rec.date), 'dd.MM.yyyy')}</span>
                                            </div>
                                            {rec.note && <p className="text-xs text-gray-400 mt-1">{rec.note}</p>}
                                        </div>
                                        {isManager && (
                                            <Button size="sm" variant="ghost" onClick={() => setDeletingRecordId(rec.id)} className="text-red-500 opacity-0 group-hover:opacity-100">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Rule dialog */}
            <Dialog open={ruleDialog} onOpenChange={setRuleDialog}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader><DialogTitle>{editRule ? 'Madde Düzenle' : 'Yeni Madde'}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1.5"><Label>Kod</Label><Input value={rForm.code} onChange={(e) => setRForm({ ...rForm, code: e.target.value })} placeholder="Örn: D1" /></div>
                        <div className="space-y-1.5"><Label>Kabahat <ReqMark /></Label><Input value={rForm.offense} onChange={(e) => setRForm({ ...rForm, offense: e.target.value })} /></div>
                        <div className="space-y-1.5"><Label>Ceza <ReqMark /></Label><Input value={rForm.penalty} onChange={(e) => setRForm({ ...rForm, penalty: e.target.value })} /></div>
                        <RequiredLegend />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRuleDialog(false)}>İptal</Button>
                        <Button onClick={saveRule} className="bg-indigo-600 hover:bg-indigo-700 text-white">Kaydet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Record dialog */}
            <Dialog open={recordDialog} onOpenChange={setRecordDialog}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader><DialogTitle>İhlal Kaydı</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-1.5"><Label>Sporcu <ReqMark /></Label>
                            <Select value={recForm.athleteId} onValueChange={(v) => setRecForm({ ...recForm, athleteId: v })}>
                                <SelectTrigger><SelectValue placeholder="Sporcu seçin" /></SelectTrigger>
                                <SelectContent>{athletes.map((a) => (<SelectItem key={a.id} value={a.id}>{a.user.firstName} {a.user.lastName}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5"><Label>Yönetmelik Maddesi (opsiyonel)</Label>
                            <Select value={recForm.ruleId || 'none'} onValueChange={(v) => onSelectRule(v === 'none' ? '' : v)}>
                                <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Serbest giriş</SelectItem>
                                    {rules.map((rule) => (<SelectItem key={rule.id} value={rule.id}>{rule.code ? `${rule.code} · ` : ''}{rule.offense}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5"><Label>Kabahat <ReqMark /></Label><Input value={recForm.offense} onChange={(e) => setRecForm({ ...recForm, offense: e.target.value })} /></div>
                        <div className="space-y-1.5"><Label>Ceza <ReqMark /></Label><Input value={recForm.penalty} onChange={(e) => setRecForm({ ...recForm, penalty: e.target.value })} /></div>
                        <div className="space-y-1.5"><Label>Tarih</Label><Input type="date" value={recForm.date} onChange={(e) => setRecForm({ ...recForm, date: e.target.value })} /></div>
                        <div className="space-y-1.5"><Label>Not</Label><Textarea value={recForm.note} onChange={(e) => setRecForm({ ...recForm, note: e.target.value })} rows={2} /></div>
                        <RequiredLegend />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRecordDialog(false)}>İptal</Button>
                        <Button onClick={saveRecord} className="bg-indigo-600 hover:bg-indigo-700 text-white">Kaydet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deletingRuleId}
                onOpenChange={(open) => { if (!open) setDeletingRuleId(null); }}
                onConfirm={confirmRemoveRule}
                title="Yönetmelik Maddesi Silinsin mi?"
                description="Bu disiplin maddesi kalıcı olarak silinecektir."
                loading={deleteRuleMutation.isPending}
            />
            <ConfirmDialog
                open={!!deletingRecordId}
                onOpenChange={(open) => { if (!open) setDeletingRecordId(null); }}
                onConfirm={confirmRemoveRecord}
                title="İhlal Kaydı Silinsin mi?"
                description="Bu ihlal kaydı kalıcı olarak silinecektir."
                loading={deleteRecordMutation.isPending}
            />
        </div>
    );
}
