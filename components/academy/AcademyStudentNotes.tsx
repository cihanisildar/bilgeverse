"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Loader2, Edit3, ClipboardList, MessageSquare, Eye, Star } from 'lucide-react';
import { useCreateNote, useUpdateNote, useDeleteNote } from '@/app/hooks/use-academy-data';
import toast from 'react-hot-toast';
import { AcademyStudentNote, AcademyNoteType, AcademyStudent } from '@/types/academy';

const NOTE_META: Record<AcademyNoteType, { label: string; icon: any; color: string }> = {
    NOTE: { label: 'Not', icon: MessageSquare, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    EVALUATION: { label: 'Değerlendirme', icon: Star, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    OBSERVATION: { label: 'Gözlem', icon: Eye, color: 'text-purple-600 bg-purple-50 border-purple-100' },
};

export function AcademyStudentNotes({
    lessonId,
    notes,
    students,
}: {
    lessonId: string;
    notes: AcademyStudentNote[];
    students: AcademyStudent[];
}) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AcademyStudentNote | null>(null);
    const [studentId, setStudentId] = useState('');
    const [type, setType] = useState<AcademyNoteType>('NOTE');
    const createMutation = useCreateNote();
    const updateMutation = useUpdateNote();
    const deleteMutation = useDeleteNote();

    function openCreate() {
        setEditing(null);
        setStudentId('');
        setType('NOTE');
        setOpen(true);
    }

    function openEdit(note: AcademyStudentNote) {
        setEditing(note);
        setStudentId(note.studentId);
        setType(note.type);
        setOpen(true);
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const content = (new FormData(e.currentTarget).get('content') as string)?.trim();
        if (!content) return;

        if (editing) {
            updateMutation.mutate({ id: editing.id, lessonId, data: { type, content } }, {
                onSuccess: (r) => { if (!r.error) setOpen(false); },
            });
        } else {
            if (!studentId) {
                toast.error('Lütfen bir öğrenci seçin.');
                return;
            }
            createMutation.mutate({ lessonId, studentId, type, content }, {
                onSuccess: (r) => { if (!r.error) setOpen(false); },
            });
        }
    }

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Öğrenci Değerlendirmeleri</h2>
                    <p className="text-gray-500 mt-1">Öğrenciler hakkında not, değerlendirme ve gözlemlerinizi kaydedin.</p>
                </div>
                <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200/50 rounded-2xl px-6 py-6 font-bold transition-all hover:scale-105 active:scale-95">
                    <Plus className="h-5 w-5 mr-2" />
                    Değerlendirme Ekle
                </Button>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-gray-900">{editing ? 'Değerlendirmeyi Düzenle' : 'Yeni Değerlendirme'}</DialogTitle>
                            <DialogDescription className="text-gray-500">Öğrenci hakkındaki gözlem ve değerlendirmenizi girin.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-5 py-6">
                            {!editing && (
                                <div className="grid gap-2">
                                    <Label className="text-sm font-bold text-gray-700 ml-1">Öğrenci</Label>
                                    <Select value={studentId} onValueChange={setStudentId}>
                                        <SelectTrigger className="rounded-2xl border-gray-200"><SelectValue placeholder="Öğrenci seçin" /></SelectTrigger>
                                        <SelectContent className="rounded-xl max-h-[260px]">
                                            {students.map((s) => (
                                                <SelectItem key={s.studentId} value={s.studentId}>
                                                    {s.student?.firstName} {s.student?.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label className="text-sm font-bold text-gray-700 ml-1">Tür</Label>
                                <Select value={type} onValueChange={(v) => setType(v as AcademyNoteType)}>
                                    <SelectTrigger className="rounded-2xl border-gray-200"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="NOTE">Not</SelectItem>
                                        <SelectItem value="EVALUATION">Değerlendirme</SelectItem>
                                        <SelectItem value="OBSERVATION">Gözlem</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-sm font-bold text-gray-700 ml-1">İçerik</Label>
                                <Textarea name="content" defaultValue={editing?.content || ''} placeholder="Yazınız..." required className="rounded-2xl border-gray-200 min-h-[120px]" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isPending} className="w-full bg-blue-600 text-white hover:bg-blue-700 py-6 rounded-2xl font-bold shadow-lg shadow-blue-200">
                                {isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                                {editing ? 'Güncelle' : 'Kaydet'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100 text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                        <ClipboardList className="h-10 w-10 text-blue-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz değerlendirme yok</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">Öğrenciler hakkında ilk notunuzu ekleyerek başlayın.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notes.map((note) => {
                        const meta = NOTE_META[note.type] || NOTE_META.NOTE;
                        const Icon = meta.icon;
                        return (
                            <div key={note.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            <span className="font-bold text-gray-900">{note.student?.firstName} {note.student?.lastName}</span>
                                            <Badge variant="outline" className={`text-[11px] px-2 py-0.5 border ${meta.color}`}>
                                                <Icon className="h-3 w-3 mr-1" />{meta.label}
                                            </Badge>
                                        </div>
                                        <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{note.content}</p>
                                        <p className="text-xs text-gray-400 mt-3">
                                            {note.author?.firstName} {note.author?.lastName} · {new Date(note.createdAt).toLocaleDateString('tr-TR')}
                                        </p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-blue-600 hover:bg-blue-50 rounded-xl" onClick={() => openEdit(note)}>
                                            <Edit3 className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-red-500 hover:bg-red-50 rounded-xl">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="rounded-[2rem]">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Değerlendirmeyi Sil?</AlertDialogTitle>
                                                    <AlertDialogDescription>Bu kaydı silmek istediğinize emin misiniz?</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="rounded-xl">Vazgeç</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deleteMutation.mutate({ id: note.id, lessonId })} className="bg-red-600 hover:bg-red-700 text-white rounded-xl">Sil</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
