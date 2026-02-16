"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save, Clock, CheckCircle2, XCircle, Loader2, Edit3, Users, List } from 'lucide-react';
import Image from 'next/image';
import { useUpdateSyllabus, useCreateSession, useRecordAttendance } from '@/app/hooks/use-academy-data';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { AcademySyllabus as SyllabusType, AcademySession, AcademySyllabusItem, AcademyAssignment } from '@/types/academy';

export function AcademySyllabus({ lessonId, syllabus, canManage }: { lessonId: string, syllabus: SyllabusType | null, canManage: boolean }) {
    const [items, setItems] = useState<Partial<AcademySyllabusItem>[]>(syllabus?.items || []);
    const [open, setOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<{ index: number, title: string, description: string } | null>(null);
    const syllabusMutation = useUpdateSyllabus();
    const { toast } = useToast();

    function handleAddItem(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;

        if (!title) return;

        let newItems = [...items];
        if (editingItem !== null) {
            newItems[editingItem.index] = { ...newItems[editingItem.index], title, description };
            setItems(newItems);
            setEditingItem(null);
        } else {
            const newItem = { title, description, orderIndex: items.length + 1 };
            newItems = [...items, newItem];
            setItems(newItems);
        }

        // Auto-save: Trigger mutation immediately
        syllabusMutation.mutate({ lessonId, items: newItems as any[] });
        setOpen(false);
    }

    function removeItem(index: number) {
        const newItems = items.filter((_, i) => i !== index)
            .map((item, i) => ({ ...item, orderIndex: i + 1 }));

        setItems(newItems);
        // Auto-save: Trigger mutation immediately
        syllabusMutation.mutate({ lessonId, items: newItems as any[] });
    }

    return (
        <div className="space-y-10 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        Eğitim Müfredatı
                        {syllabusMutation.isPending && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                    </h2>
                    <p className="text-gray-500 mt-1">Öğrenme yolculuğunun adım adım planı. Değişiklikler anında kaydedilir.</p>
                </div>
                {canManage && (
                    <Dialog open={open} onOpenChange={(val) => {
                        setOpen(val);
                        if (!val) setEditingItem(null);
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-white text-blue-600 border-2 border-blue-50 hover:bg-blue-50 hover:border-blue-100 rounded-2xl px-6 py-6 font-bold transition-all shadow-sm active:scale-95">
                                <Plus className="h-5 w-5 mr-2" />
                                Yeni Konu Ekle
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl">
                            <form onSubmit={handleAddItem}>
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold text-gray-900">
                                        {editingItem !== null ? 'Konuyu Düzenle' : 'Müfredata Ekle'}
                                    </DialogTitle>
                                    <DialogDescription className="text-gray-500">
                                        Eğitim içeriğini zenginleştirecek konu detaylarını girin.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 py-6">
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-bold text-gray-700 ml-1">Konu Başlığı</Label>
                                        <Input name="title" defaultValue={editingItem?.title || ''} placeholder="Örn: Limit ve Süreklilik" required className="rounded-2xl border-gray-200 focus:ring-blue-500" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-bold text-gray-700 ml-1">İçerik Detayları</Label>
                                        <Textarea name="description" defaultValue={editingItem?.description || ''} placeholder="Bu bölümde neler öğrenilecek?.." className="rounded-2xl border-gray-200 min-h-[120px]" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={syllabusMutation.isPending} className="w-full bg-blue-600 text-white hover:bg-blue-700 py-6 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all">
                                        {syllabusMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                                        {editingItem !== null ? 'Güncelle ve Kaydet' : 'Konuyu Kaydet'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="relative space-y-12 pl-4 sm:pl-0">
                {/* Timeline vertical connector */}
                {items.length > 1 && (
                    <div className="absolute left-9 sm:left-1/2 top-4 bottom-4 w-1 bg-gradient-to-b from-blue-500 via-indigo-400 to-indigo-600 rounded-full opacity-20 -translate-x-1/2 hidden sm:block"></div>
                )}

                {/* Mobile vertical line */}
                {items.length > 1 && (
                    <div className="absolute left-9 top-4 bottom-4 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full opacity-20 sm:hidden"></div>
                )}

                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100 text-center">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                            <List className="h-10 w-10 text-blue-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz müfredat girilmemiş</h3>
                        <p className="text-gray-500 max-w-xs mx-auto mb-8">Dersin işleyişini ve konularını belirlemek için ilk konuyu ekleyerek başlayın.</p>
                        {canManage && (
                            <Button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 py-6 font-bold shadow-lg shadow-blue-100">
                                İlk Konuyu Ekle
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-12">
                        {items.map((item, index) => (
                            <div key={index} className={`relative flex flex-col sm:flex-row items-center gap-8 ${index % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                                {/* Center Node */}
                                <div className="absolute left-5 sm:left-1/2 top-0 sm:top-auto w-8 h-8 rounded-full bg-white border-4 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10 -translate-x-1/2 flex items-center justify-center text-[10px] font-black text-blue-600">
                                    {item.orderIndex}
                                </div>

                                {/* Content Card */}
                                <div className={`w-full sm:w-[45%] group`}>
                                    <div className={`p-8 bg-white rounded-[2.5rem] border border-blue-50/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group`}>
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {canManage && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 w-9 p-0 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100"
                                                        onClick={() => {
                                                            setEditingItem({ index, title: item.title || '', description: item.description || '' });
                                                            setOpen(true);
                                                        }}
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-9 w-9 p-0 rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle className="text-xl font-bold">Konuyu Kaldır?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    "{item.title}" konusunu müfredattan silmek istediğinize emin misiniz?
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel className="rounded-xl">Vazgeç</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => removeItem(index)}
                                                                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                                                                >
                                                                    Sil
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-xs font-black text-blue-600/30 uppercase tracking-[0.2em]">Öğrenme Adımı {item.orderIndex}</span>
                                        </div>

                                        <h4 className="text-xl font-black text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">{item.title}</h4>
                                        <p className="text-gray-500 text-sm leading-relaxed mb-4">
                                            {item.description || 'Bu konu için detaylı açıklama girilmemiş.'}
                                        </p>

                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-8 rounded-full bg-blue-500"></div>
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-100"></div>
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-100"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Spacer for the other side on desktop */}
                                <div className="hidden sm:block w-[45%]"></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export function AcademySessions({
    lessonId,
    sessions,
    canManage,
    students,
    assignments
}: {
    lessonId: string,
    sessions: AcademySession[],
    canManage: boolean,
    students: { id: string, firstName: string | null, lastName: string | null }[],
    assignments: AcademyAssignment[]
}) {
    const sessionMutation = useCreateSession();
    const [open, setOpen] = useState(false);
    const [selectedTutorId, setSelectedTutorId] = useState<string>("");

    async function handleCreateSession(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const title = formData.get('title') as string;
        const dateInput = formData.get('date') as string;

        if (!title || !selectedTutorId || !dateInput) return;

        const payload = {
            lessonId: lessonId.toString(),
            tutorId: selectedTutorId.toString(),
            title: title.toString(),
            description: (formData.get('description')?.toString()) || "",
            date: new Date(dateInput).toISOString(),
            startTime: (formData.get('startTime')?.toString()) || "",
            endTime: (formData.get('endTime')?.toString()) || "",
        };

        sessionMutation.mutate(payload, {
            onSuccess: (result) => {
                if (!result.error) {
                    setOpen(false);
                    setSelectedTutorId("");
                }
            }
        });
    }

    // Sort sessions by date (descending)
    const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Oturumlar ve Yoklama</h2>
                    <p className="text-gray-500 mt-1">Ders planını ve katılım durumlarını buradan yönetin.</p>
                </div>
                {canManage && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200/50 rounded-2xl px-6 py-6 font-bold transition-all hover:scale-105 active:scale-95 group">
                                <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                                Yeni Oturum Oluştur
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl">
                            <form onSubmit={handleCreateSession}>
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold text-gray-900">Yeni Oturum Planla</DialogTitle>
                                    <DialogDescription className="text-gray-500">
                                        Ders oturumu için zaman ve eğitmen planlayın.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 py-6">
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-bold text-gray-700 ml-1">Oturum Başlığı</Label>
                                        <Input name="title" placeholder="Haftalık Ders veya Konu Adı" required className="rounded-2xl border-gray-200 focus:ring-blue-500" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-sm font-bold text-gray-700 ml-1">Tarih</Label>
                                            <Input name="date" type="date" required className="rounded-2xl border-gray-200 focus:ring-blue-500" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-sm font-bold text-gray-700 ml-1">Eğitmen</Label>
                                            <Select value={selectedTutorId} onValueChange={setSelectedTutorId} required>
                                                <SelectTrigger className="rounded-2xl border-gray-200">
                                                    <SelectValue placeholder="Eğitmen seçin" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                                    {assignments.map(a => (
                                                        <SelectItem key={a.userId} value={a.userId} className="rounded-lg">
                                                            {a.user.firstName} {a.user.lastName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-sm font-bold text-gray-700 ml-1">Başlangıç</Label>
                                            <Input name="startTime" type="time" required className="rounded-2xl border-gray-200 focus:ring-blue-500" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-sm font-bold text-gray-700 ml-1">Bitiş</Label>
                                            <Input name="endTime" type="time" required className="rounded-2xl border-gray-200 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-bold text-gray-700 ml-1">Notlar / Açıklama</Label>
                                        <Textarea name="description" placeholder="Oturum hakkında detaylı bilgi (isteğe bağlı)..." className="rounded-2xl border-gray-200 min-h-[100px]" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={sessionMutation.isPending} className="w-full bg-blue-600 text-white hover:bg-blue-700 py-6 rounded-2xl font-bold shadow-lg shadow-blue-200 mb-2 transition-all">
                                        {sessionMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                                        Oturumu Kaydet
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {sortedSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100 text-center">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                            <Clock className="h-10 w-10 text-blue-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz oturum yok</h3>
                        <p className="text-gray-500 max-w-xs mx-auto mb-8">Henüz bu ders için bir oturum planlanmamış. Yeni bir tane oluşturarak başlayın.</p>
                        {canManage && (
                            <Button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 py-6 font-bold shadow-lg shadow-blue-100">
                                İlk Oturumu Oluştur
                            </Button>
                        )}
                    </div>
                ) : (
                    sortedSessions.map((session) => {
                        const tutor = assignments.find(a => a.userId === session.tutorId)?.user;
                        const sessionDate = new Date(session.date);
                        const isToday = new Date().toDateString() === sessionDate.toDateString();

                        return (
                            <div key={session.id} className="group relative bg-white rounded-[2rem] border border-blue-50/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                                {isToday && (
                                    <div className="absolute top-0 right-10 bg-blue-600 text-white px-6 py-1.5 rounded-b-2xl text-[10px] font-black uppercase tracking-widest shadow-lg z-10">
                                        BUGÜN
                                    </div>
                                )}

                                <div className="flex flex-col md:flex-row items-stretch min-h-[140px]">
                                    {/* Date Block */}
                                    <div className={`p-4 md:w-32 flex flex-col items-center justify-center text-center transition-colors duration-500 ${isToday ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-900 group-hover:bg-blue-50'}`}>
                                        <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                                            {sessionDate.toLocaleDateString('tr-TR', { month: 'short' })}
                                        </span>
                                        <span className="text-3xl md:text-4xl font-black leading-none my-1">
                                            {sessionDate.getDate()}
                                        </span>
                                        <span className="text-[10px] font-medium opacity-70">
                                            {sessionDate.toLocaleDateString('tr-TR', { weekday: 'long' })}
                                        </span>
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 p-6 flex flex-col justify-center">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                                                    {session.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-4 mt-2">
                                                    <div className="flex items-center text-gray-500 text-sm bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                                        <Clock className="h-3.5 w-3.5 mr-2 text-blue-500" />
                                                        <span className="font-semibold">{session.startTime || '--:--'} - {session.endTime || '--:--'}</span>
                                                    </div>
                                                    {tutor && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700 overflow-hidden border border-blue-200 relative">
                                                                {tutor.avatarUrl ? (
                                                                    <Image src={tutor.avatarUrl} alt={tutor.firstName || ''} fill className="object-cover" />
                                                                ) : (
                                                                    <span>{tutor.firstName?.[0]}</span>
                                                                )}
                                                            </div>
                                                            <span className="font-medium">{tutor.firstName} {tutor.lastName}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {canManage && (
                                                <AttendanceDialog
                                                    session={session}
                                                    students={students}
                                                    lessonId={lessonId}
                                                />
                                            )}
                                        </div>

                                        {session.description && (
                                            <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 italic border-l-2 border-blue-50 pl-4 py-1">
                                                {session.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function AttendanceDialog({ session, students, lessonId }: { session: AcademySession, students: { id: string, firstName: string | null, lastName: string | null }[], lessonId: string }) {
    const [attendances, setAttendances] = useState<Record<string, boolean>>(
        session.attendances?.reduce((acc: Record<string, boolean>, curr) => {
            acc[curr.studentId] = curr.status;
            return acc;
        }, {}) || {}
    );
    const attendanceMutation = useRecordAttendance();

    async function handleSave() {
        const data = students.map(s => ({
            studentId: s.id,
            status: !!attendances[s.id]
        }));
        attendanceMutation.mutate({ sessionId: session.id, lessonId, attendances: data });
    }

    const presentCount = Object.values(attendances).filter(Boolean).length;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-blue-200 hover:bg-blue-50 text-blue-700 font-bold rounded-xl px-5 h-10 transition-all active:scale-95 shadow-sm">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Yoklama Al
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-slate-50">
                <div className="bg-white p-8 border-b border-gray-100">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-2xl">
                                    <CheckCircle2 className="h-6 w-6 text-blue-600" />
                                </div>
                                Yoklama: {session.title}
                            </DialogTitle>
                            <Badge className={`${presentCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} border-0 px-4 py-1.5 rounded-full font-bold`}>
                                {presentCount} / {students.length} Katılımcı
                            </Badge>
                        </div>
                        <DialogDescription className="text-gray-500 mt-2">
                            {new Date(session.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihli oturum.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
                    {students.length === 0 ? (
                        <div className="py-20 text-center">
                            <Users className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-400 italic font-medium">Bu derse kayıtlı öğrenci bulunmuyor.</p>
                        </div>
                    ) : (
                        students.map(student => (
                            <div key={student.id} className={`flex items-center justify-between p-4 rounded-3xl transition-all duration-300 border ${attendances[student.id] === true ? 'bg-green-50/50 border-green-100 shadow-sm' : attendances[student.id] === false ? 'bg-red-50/50 border-red-100 opacity-80' : 'bg-white border-gray-100 hover:border-blue-200'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-2xl flex items-center justify-center font-bold text-sm ${attendances[student.id] === true ? 'bg-green-600 text-white' : attendances[student.id] === false ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        {student.firstName?.[0]}{student.lastName?.[0]}
                                    </div>
                                    <span className="font-bold text-gray-800">{student.firstName} {student.lastName}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className={`rounded-xl h-10 w-10 p-0 transition-all ${attendances[student.id] === true ? 'bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-100' : 'text-gray-400 hover:bg-green-100 hover:text-green-600'}`}
                                        onClick={() => setAttendances({ ...attendances, [student.id]: true })}
                                    >
                                        <CheckCircle2 className="h-5 w-5" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className={`rounded-xl h-10 w-10 p-0 transition-all ${attendances[student.id] === false ? 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-100' : 'text-gray-400 hover:bg-red-100 hover:text-red-600'}`}
                                        onClick={() => setAttendances({ ...attendances, [student.id]: false })}
                                    >
                                        <XCircle className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-8 bg-white border-t border-gray-100">
                    <DialogFooter>
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 text-lg font-black rounded-2xl shadow-xl shadow-blue-100 active:scale-[0.98] transition-all disabled:opacity-50"
                            onClick={handleSave}
                            disabled={attendanceMutation.isPending || students.length === 0}
                        >
                            {attendanceMutation.isPending ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                "Yoklamayı Tamamla ve Kaydet"
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
