"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    List,
    Plus,
    CheckCircle2,
    Circle,
    Clock,
    MoreVertical,
    Edit2,
    Trash2,
    CalendarDays,
    Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AddPlanModal } from './AddPlanModal';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

interface Course {
    id: string;
    title: string;
    description: string | null;
    date: Date | string;
    isCompleted: boolean;
}

export function WorkshopPlan({
    workshopId,
    courses,
    isPrivileged
}: {
    workshopId: string;
    courses: Course[];
    isPrivileged: boolean;
}) {
    const [view, setView] = useState<'list' | 'timeline'>('timeline');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState<string | null>(null);
    const router = useRouter();

    const completedCount = courses.filter(c => c.isCompleted).length;
    const progress = courses.length > 0 ? (completedCount / courses.length) * 100 : 0;

    const handleToggleComplete = async (courseId: string, currentStatus: boolean) => {
        setLoading(courseId);
        try {
            const res = await fetch(`/api/workshops/plan/${courseId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isCompleted: !currentStatus }),
            });

            if (!res.ok) throw new Error('Toggle failed');

            toast.success(currentStatus ? "Kurs tamamlanmadı olarak işaretlendi." : "Kurs tamamlandı!");
            router.refresh();
        } catch (error) {
            toast.error("İşlem başarısız oldu.");
        } finally {
            setLoading(null);
        }
    };

    const handleDelete = async (courseId: string) => {
        if (!confirm("Bu kurs planını silmek istediğinizden emin misiniz?")) return;

        try {
            const res = await fetch(`/api/workshops/plan/${courseId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Delete failed');

            toast.success("Kurs planı silindi.");
            router.refresh();
        } catch (error) {
            toast.error("Silme işlemi başarısız oldu.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div className="space-y-1 flex-1 w-full">
                        <div className="flex justify-between items-end mb-2">
                            <h3 className="text-xl font-bold text-gray-900">Müfredat İlerlemesi</h3>
                            <span className="text-sm font-bold text-amber-600">%{Math.round(progress)}</span>
                        </div>
                        <Progress
                            value={progress}
                            className="h-4 bg-amber-50 rounded-full border border-amber-100/50"
                            indicatorClassName="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            {courses.length} kurstan {completedCount} tanesi tamamlandı.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {isPrivileged && (
                            <Button
                                onClick={() => {
                                    setEditingCourse(null);
                                    setIsAddOpen(true);
                                }}
                                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md border-0"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Plan Ekle
                            </Button>
                        )}
                    </div>
                </div>

                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                    {courses.length === 0 ? (
                        <div className="py-12 text-center relative z-10 bg-white">
                            <CalendarDays className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-500">Henüz bir kurs planı oluşturulmamış.</p>
                        </div>
                    ) : (
                        courses.map((course, index) => (
                            <div key={course.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                {/* Dot */}
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full border border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors ${course.isCompleted ? "bg-green-500 text-white" : "bg-white text-amber-500"
                                    }`}>
                                    {course.isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                </div>

                                {/* Content */}
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase">
                                                Ders {index + 1}
                                            </span>
                                            <time className="text-xs font-medium text-gray-400">
                                                {new Date(course.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                            </time>
                                        </div>
                                        {isPrivileged && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                        <MoreVertical className="h-4 w-4 text-gray-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl border-gray-100 shadow-xl">
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setEditingCourse(course);
                                                            setIsAddOpen(true);
                                                        }}
                                                        className="gap-2 cursor-pointer"
                                                    >
                                                        <Edit2 className="h-4 w-4" /> Düzenle
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(course.id)}
                                                        className="gap-2 cursor-pointer text-red-600 focus:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" /> Sil
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                    <h4 className={`font-bold text-gray-900 mb-1 ${course.isCompleted ? "line-through text-gray-400" : ""}`}>
                                        {course.title}
                                    </h4>
                                    <p className="text-sm text-gray-500 line-clamp-2">
                                        {course.description || "İçerik belirtilmemiş."}
                                    </p>

                                    {isPrivileged && (
                                        <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                                            <Button
                                                size="sm"
                                                variant={course.isCompleted ? "outline" : "default"}
                                                disabled={loading === course.id}
                                                onClick={() => handleToggleComplete(course.id, course.isCompleted)}
                                                className={`rounded-xl text-xs ${course.isCompleted
                                                    ? "border-green-100 text-green-600 hover:bg-green-50"
                                                    : "bg-gray-900 hover:bg-gray-800 text-white border-0"
                                                    }`}
                                            >
                                                {loading === course.id ? (
                                                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                                ) : course.isCompleted ? (
                                                    <CheckCircle2 className="h-3 w-3 mr-2" />
                                                ) : (
                                                    <Circle className="h-3 w-3 mr-2" />
                                                )}
                                                {course.isCompleted ? "Tamamlandı" : "Tamamlandı Olarak İşaretle"}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <AddPlanModal
                workshopId={workshopId}
                course={editingCourse}
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
            />
        </div>
    );
}
