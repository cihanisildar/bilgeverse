"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Loader2, Coins, CheckCircle2, Circle, ChevronDown, Target, CalendarClock } from 'lucide-react';
import { useCreateTask, useDeleteTask, useCompleteTask, useUncompleteTask } from '@/app/hooks/use-academy-data';
import { AcademyTask, AcademyStudent } from '@/types/academy';

export function AcademyTasks({
    lessonId,
    tasks,
    students,
    canManage,
    currentUserId,
    isStudent,
}: {
    lessonId: string;
    tasks: AcademyTask[];
    students: AcademyStudent[];
    canManage: boolean;
    currentUserId: string;
    isStudent: boolean;
}) {
    const [open, setOpen] = useState(false);
    const createMutation = useCreateTask();
    const deleteMutation = useDeleteTask();

    function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const title = (fd.get('title') as string)?.trim();
        if (!title) return;
        createMutation.mutate({
            lessonId,
            title,
            description: (fd.get('description') as string) || undefined,
            points: parseInt((fd.get('points') as string) || '0', 10) || 0,
            dueDate: (fd.get('dueDate') as string) || null,
        }, {
            onSuccess: (r) => { if (!r.error) setOpen(false); },
        });
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Görevler ve Bilge Para</h2>
                    <p className="text-gray-500 mt-1">Görev tamamlayan öğrenciler Bilge Para kazanır.</p>
                </div>
                {canManage && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200/50 rounded-2xl px-6 py-6 font-bold transition-all hover:scale-105 active:scale-95">
                                <Plus className="h-5 w-5 mr-2" />
                                Yeni Görev
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl">
                            <form onSubmit={handleCreate}>
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold text-gray-900">Yeni Görev</DialogTitle>
                                    <DialogDescription className="text-gray-500">Tamamlandığında Bilge Para kazandıracak görevi tanımlayın.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-5 py-6">
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-bold text-gray-700 ml-1">Görev Başlığı</Label>
                                        <Input name="title" placeholder="Örn: Ödev 1 - Problem Seti" required className="rounded-2xl border-gray-200" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-bold text-gray-700 ml-1">Açıklama</Label>
                                        <Textarea name="description" placeholder="Görev detayları..." className="rounded-2xl border-gray-200 min-h-[80px]" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-sm font-bold text-gray-700 ml-1">Bilge Para</Label>
                                            <Input name="points" type="number" min="0" defaultValue="10" required className="rounded-2xl border-gray-200" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-sm font-bold text-gray-700 ml-1">Son Tarih</Label>
                                            <Input name="dueDate" type="date" className="rounded-2xl border-gray-200" />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={createMutation.isPending} className="w-full bg-blue-600 text-white hover:bg-blue-700 py-6 rounded-2xl font-bold shadow-lg shadow-blue-200">
                                        {createMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                                        Görevi Oluştur
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100 text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                        <Target className="h-10 w-10 text-blue-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz görev yok</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">Bu ders için henüz bir görev tanımlanmamış.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            lessonId={lessonId}
                            students={students}
                            canManage={canManage}
                            currentUserId={currentUserId}
                            isStudent={isStudent}
                            onDelete={() => deleteMutation.mutate({ id: task.id, lessonId })}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function TaskCard({
    task, lessonId, students, canManage, currentUserId, isStudent, onDelete,
}: {
    task: AcademyTask;
    lessonId: string;
    students: AcademyStudent[];
    canManage: boolean;
    currentUserId: string;
    isStudent: boolean;
    onDelete: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const completeMutation = useCompleteTask();
    const uncompleteMutation = useUncompleteTask();

    const completedIds = new Set(task.completions.map((c) => c.studentId));
    const myCompleted = completedIds.has(currentUserId);
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;

    function toggle(studentId: string) {
        if (completedIds.has(studentId)) {
            uncompleteMutation.mutate({ taskId: task.id, studentId, lessonId });
        } else {
            completeMutation.mutate({ taskId: task.id, studentId, lessonId });
        }
    }

    const pending = completeMutation.isPending || uncompleteMutation.isPending;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                            <Badge className="bg-amber-50 text-amber-700 border border-amber-100 rounded-full font-bold">
                                <Coins className="h-3.5 w-3.5 mr-1" />{task.points} BP
                            </Badge>
                            {isStudent && (
                                <Badge className={`rounded-full font-bold border ${myCompleted ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                    {myCompleted ? 'Tamamlandı' : 'Bekliyor'}
                                </Badge>
                            )}
                        </div>
                        {task.description && <p className="text-sm text-gray-500 mb-2">{task.description}</p>}
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                            {dueDate && (
                                <span className="flex items-center gap-1">
                                    <CalendarClock className="h-3.5 w-3.5" />
                                    Son: {dueDate.toLocaleDateString('tr-TR')}
                                </span>
                            )}
                            {!isStudent && (
                                <span className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {completedIds.size} / {students.length} tamamladı
                                </span>
                            )}
                        </div>
                    </div>

                    {canManage && (
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="rounded-xl text-gray-500 hover:bg-gray-50" onClick={() => setExpanded((e) => !e)}>
                                <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                Tamamlama
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-red-500 hover:bg-red-50 rounded-xl">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-[2rem]">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Görevi Sil?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            "{task.title}" görevini silmek istediğinize emin misiniz? Verilmiş Bilge Para kayıtları değişmez.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-xl">Vazgeç</AlertDialogCancel>
                                        <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700 text-white rounded-xl">Sil</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </div>
            </div>

            {canManage && expanded && (
                <div className="border-t border-gray-100 bg-slate-50/50 p-4 space-y-2 max-h-[320px] overflow-y-auto">
                    {students.length === 0 ? (
                        <p className="text-center text-gray-400 italic py-6 text-sm">Bu derse kayıtlı öğrenci yok.</p>
                    ) : (
                        students.map((s) => {
                            const done = completedIds.has(s.studentId);
                            return (
                                <button
                                    key={s.studentId}
                                    type="button"
                                    disabled={pending}
                                    onClick={() => toggle(s.studentId)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${done ? 'bg-green-50/70 border-green-100' : 'bg-white border-gray-100 hover:border-blue-200'}`}
                                >
                                    <span className="font-semibold text-gray-800 text-sm">
                                        {s.student?.firstName} {s.student?.lastName}
                                    </span>
                                    {done ? (
                                        <span className="flex items-center gap-1.5 text-green-600 text-xs font-bold">
                                            <CheckCircle2 className="h-5 w-5" /> +{task.points} BP
                                        </span>
                                    ) : (
                                        <Circle className="h-5 w-5 text-gray-300" />
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
