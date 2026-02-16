'use client';

import { useExpelStudent, useFinalizeOrientation, useStudentDetail, useUpdateOrientationNotes } from '@/app/hooks/use-student-data';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea";
import { OrientationDecision } from '@prisma/client';
import { AlertTriangle, ArrowLeft, Calendar, CheckCircle, Loader2, Save, User as UserIcon, XCircle } from "lucide-react";
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function OrientationDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const studentId = params.id;
    const { data: session } = useSession();

    const { data: student, isLoading } = useStudentDetail(studentId);
    const updateNotesMutation = useUpdateOrientationNotes();
    const finalizeMutation = useFinalizeOrientation();
    const expelMutation = useExpelStudent();

    const [decision, setDecision] = useState<OrientationDecision | null>(null);
    const [decisionNotes, setDecisionNotes] = useState('');
    const [expelReason, setExpelReason] = useState('');
    const [showExpelDialog, setShowExpelDialog] = useState(false);

    const handleSaveNotes = async (week: 1 | 2 | 3, notes: string) => {
        await updateNotesMutation.mutateAsync({ studentId, week, notes });
    };

    const handleFinalize = async () => {
        if (!decision) return;
        const adminId = (session?.user as any)?.id;
        if (!adminId) return;

        if (decision === OrientationDecision.REJECTED) {
            setShowExpelDialog(true);
        } else {
            const result = await finalizeMutation.mutateAsync({
                studentId,
                decision: OrientationDecision.ACCEPTED,
                notes: decisionNotes,
                adminId
            });
            if (!result.error) {
                router.push('/dashboard/part10/admin');
            }
        }
    };

    const handleExpel = async () => {
        const adminId = (session?.user as any)?.id;
        if (!adminId || !expelReason) return;

        await finalizeMutation.mutateAsync({
            studentId,
            decision: OrientationDecision.REJECTED,
            notes: decisionNotes,
            adminId
        });

        const result = await expelMutation.mutateAsync({
            studentId,
            reason: expelReason,
            adminId,
            notes: decisionNotes
        });

        if (!result.error) {
            setShowExpelDialog(false);
            router.push('/dashboard/part10/admin');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-gray-500">Öğrenci verileri yükleniyor...</p>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="p-8 text-center bg-white min-h-screen">
                <p className="text-red-500">Öğrenci bulunamadı.</p>
                <Link href="/dashboard/part10/admin">
                    <Button variant="outline" className="mt-4">Geri Dön</Button>
                </Link>
            </div>
        );
    }

    const orientation = student.orientationProcess;

    return (
        <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link href="/dashboard/part10/admin">
                        <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-gray-500 hover:text-gray-800">
                            <ArrowLeft className="h-4 w-4 mr-1" /> Listeye Dön
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-800">Süreç Yönetimi</h1>
                        <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-200">
                            Oryantasyon
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Week 1 */}
                    <WeekNoteCard
                        week={1}
                        initialNotes={orientation?.week1Notes || ''}
                        onSave={handleSaveNotes}
                        isSaving={updateNotesMutation.isPending && updateNotesMutation.variables?.week === 1}
                    />

                    {/* Week 2 */}
                    <WeekNoteCard
                        week={2}
                        initialNotes={orientation?.week2Notes || ''}
                        onSave={handleSaveNotes}
                        isSaving={updateNotesMutation.isPending && updateNotesMutation.variables?.week === 2}
                    />

                    {/* Week 3 */}
                    <WeekNoteCard
                        week={3}
                        initialNotes={orientation?.week3Notes || ''}
                        onSave={handleSaveNotes}
                        isSaving={updateNotesMutation.isPending && updateNotesMutation.variables?.week === 3}
                    />

                    {/* Decision Section */}
                    <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white ring-1 ring-indigo-100">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                            <CardTitle className="flex items-center">
                                <CheckCircle className="h-5 w-5 mr-2 text-indigo-600" />
                                Nihai Karar
                            </CardTitle>
                            <CardDescription>3 haftalık süreci değerlendirin ve nihai kararı verin</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button
                                    variant={decision === OrientationDecision.ACCEPTED ? "default" : "outline"}
                                    className={`h-24 rounded-2xl flex flex-col items-center justify-center space-y-2 transition-all ${decision === OrientationDecision.ACCEPTED ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100' : 'hover:bg-green-50 hover:text-green-600 hover:border-green-200'}`}
                                    onClick={() => setDecision(OrientationDecision.ACCEPTED)}
                                >
                                    <CheckCircle className="h-8 w-8" />
                                    <span className="font-bold">KABUL ET</span>
                                </Button>
                                <Button
                                    variant={decision === OrientationDecision.REJECTED ? "destructive" : "outline"}
                                    className={`h-24 rounded-2xl flex flex-col items-center justify-center space-y-2 transition-all ${decision === OrientationDecision.REJECTED ? 'bg-red-600 shadow-lg shadow-red-100' : 'hover:bg-red-50 hover:text-red-600 hover:border-red-200'}`}
                                    onClick={() => setDecision(OrientationDecision.REJECTED)}
                                >
                                    <XCircle className="h-8 w-8" />
                                    <span className="font-bold">REDDET (İHRAÇ)</span>
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-gray-700">Karar Notları</Label>
                                <Textarea
                                    placeholder="Kabul veya red gerekçesini buraya yazın..."
                                    className="min-h-[120px] rounded-xl border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={decisionNotes}
                                    onChange={(e) => setDecisionNotes(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-gray-50/50 border-t border-gray-100 p-6 flex justify-end">
                            <Button
                                disabled={!decision || finalizeMutation.isPending}
                                onClick={handleFinalize}
                                className={`rounded-xl px-8 text-white shadow-md transition-all ${decision === OrientationDecision.ACCEPTED ? 'bg-green-600 hover:bg-green-700' : decision === OrientationDecision.REJECTED ? 'bg-red-600 hover:bg-red-700' : ''}`}
                            >
                                {finalizeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Süreci Sonuçlandır
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white">
                        <CardHeader className="bg-indigo-600 text-white">
                            <CardTitle className="text-lg">Öğrenci Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center gap-4 pb-4 border-b border-gray-50">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl">
                                    {student.firstName?.[0] || student.username[0].toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-800 text-lg">
                                        {student.firstName} {student.lastName}
                                    </div>
                                    <div className="text-sm text-gray-400">@{student.username}</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center text-sm">
                                    <UserIcon className="h-4 w-4 mr-3 text-indigo-400" />
                                    <span className="text-gray-500 mr-2">Rehber:</span>
                                    <span className="font-medium text-gray-800">
                                        {student.tutor ? `${student.tutor.firstName} ${student.tutor.lastName}` : 'Atanmamış'}
                                    </span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Calendar className="h-4 w-4 mr-3 text-indigo-400" />
                                    <span className="text-gray-500 mr-2">Başlangıç:</span>
                                    <span className="font-medium text-gray-800">
                                        {new Date(student.createdAt).toLocaleDateString('tr-TR')}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Başlangıç Notu</Label>
                                <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600 italic border border-gray-100">
                                    {student.firstImpressionNotes || 'Not bulunmuyor.'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-amber-50 border border-amber-100">
                        <CardContent className="p-4 flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                            <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                Öğrenciyi reddetmeniz durumunda sistem otomatik olarak bir <strong>İhraç Kaydı</strong> oluşturacaktır. Bu kayıt kalıcıdır.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Expel Dialog */}
            <Dialog open={showExpelDialog} onOpenChange={setShowExpelDialog}>
                <DialogContent className="sm:max-w-[425px] rounded-3xl border-0 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Öğrenci İhraç Kaydı
                        </DialogTitle>
                        <DialogDescription className="text-gray-500">
                            Bu öğrenciyi reddediyorsunuz. Lütfen resmi ihraç gerekçesini belirtin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason" className="text-sm font-bold text-gray-700">İhraç Gerekçesi</Label>
                            <Textarea
                                id="reason"
                                placeholder="Örn: Rehber olumsuz görüşü, devamsızlık vb."
                                className="rounded-xl border-gray-200 focus:ring-red-500 focus:border-red-500"
                                value={expelReason}
                                onChange={(e) => setExpelReason(e.target.value)}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 italic">
                            * Bu bilgi "İhraç Kayıtları" bölümünde kalıcı olarak saklanacaktır.
                        </p>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowExpelDialog(false)} className="rounded-xl border-gray-200">İptal</Button>
                        <Button
                            variant="destructive"
                            onClick={handleExpel}
                            className="bg-red-600 hover:bg-red-700 rounded-xl px-6 shadow-lg shadow-red-100"
                            disabled={!expelReason || expelMutation.isPending}
                        >
                            {expelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Kaydı Onayla ve İhraç Et
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function WeekNoteCard({ week, initialNotes, onSave, isSaving }: { week: number, initialNotes: string, onSave: (week: 1 | 2 | 3, notes: string) => void, isSaving: boolean }) {
    const [notes, setNotes] = useState(initialNotes);
    const [hasChanges, setHasChanges] = useState(false);

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
        setHasChanges(e.target.value !== initialNotes);
    };

    const handleSave = () => {
        onSave(week as 1 | 2 | 3, notes);
        setHasChanges(false);
    };

    return (
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-white transition-all duration-300 hover:shadow-xl group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-gray-50">
                <div>
                    <CardTitle className="text-lg flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3 font-bold text-sm">
                            {week}
                        </div>
                        Hafta Değerlendirmesi
                    </CardTitle>
                </div>
                {hasChanges && (
                    <Badge className="bg-amber-100 text-amber-700 border-0 flex items-center font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
                        Kaydedilmemiş Değişiklik
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="pt-4">
                <Textarea
                    placeholder={`Hafta ${week} için gözlemleri ve notları buraya girin...`}
                    className="min-h-[100px] border-0 bg-gray-50/50 rounded-xl focus-visible:ring-1 focus-visible:ring-indigo-100 transition-colors"
                    value={notes}
                    onChange={handleNotesChange}
                />
            </CardContent>
            <CardFooter className="py-3 px-6 bg-gray-50/30 flex justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    className={`rounded-lg transition-all ${hasChanges ? 'border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'opacity-50 pointer-events-none'}`}
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
                    Notları Kaydet
                </Button>
            </CardFooter>
        </Card>
    );
}
