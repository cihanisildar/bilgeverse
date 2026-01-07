'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getClassroomSyllabusDetail } from '@/app/actions/syllabus';
import { CheckCircle2, Circle, Clock, MessageSquare, Loader2, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
    classroomId: string;
    classroomName: string;
    syllabusId: string;
    children: React.ReactNode;
}

export default function SyllabusProgressDialog({ classroomId, classroomName, syllabusId, children }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<{ syllabusTitle: string; lessons: any[] } | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchDetail();
        }
    }, [isOpen]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const result = await getClassroomSyllabusDetail(classroomId, syllabusId);
            if (result.data) {
                setData(result.data);
            }
        } catch (error) {
            console.error('Error fetching detail:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-0 shadow-2xl">
                <DialogHeader className="p-6 bg-gradient-to-r from-cyan-600 to-teal-600 text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">
                                {data?.syllabusTitle || 'Yükleniyor...'}
                            </DialogTitle>
                            <p className="text-cyan-50 text-sm mt-0.5">
                                {classroomName} - Detaylı İlerleme
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden bg-gray-50/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="h-10 w-10 text-cyan-600 animate-spin" />
                            <p className="text-gray-500 font-medium">Dersler yükleniyor...</p>
                        </div>
                    ) : data ? (
                        <div className="h-full px-6 py-4 overflow-y-auto">
                            <div className="space-y-4 pb-6">
                                {data.lessons.map((lesson, index) => (
                                    <div
                                        key={lesson.id}
                                        className={`p-4 rounded-xl border-2 transition-all ${lesson.isTaught
                                            ? 'bg-green-50/50 border-green-100 shadow-sm'
                                            : 'bg-white border-gray-100'
                                            }`}
                                    >
                                        <div className="flex gap-4">
                                            <div className="shrink-0 pt-1">
                                                {lesson.isTaught ? (
                                                    <div className="bg-green-100 p-1.5 rounded-full">
                                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                    </div>
                                                ) : (
                                                    <div className="bg-gray-100 p-1.5 rounded-full">
                                                        <Circle className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <h4 className={`font-bold text-base ${lesson.isTaught ? 'text-green-900' : 'text-gray-800'}`}>
                                                        {index + 1}. {lesson.title}
                                                    </h4>
                                                    {lesson.isTaught && (
                                                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 shrink-0">
                                                            Tamamlandı
                                                        </Badge>
                                                    )}
                                                </div>

                                                {lesson.description && (
                                                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                                        {lesson.description}
                                                    </p>
                                                )}

                                                {(lesson.taughtDate || lesson.notes) && (
                                                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                                                        {lesson.taughtDate && (
                                                            <div className="flex items-center gap-2 text-xs font-semibold text-green-700">
                                                                <Clock className="h-3.5 w-3.5" />
                                                                <span>
                                                                    {new Date(lesson.taughtDate).toLocaleDateString('tr-TR', {
                                                                        day: 'numeric',
                                                                        month: 'long',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })} tarihinde işlendi.
                                                                </span>
                                                            </div>
                                                        )}
                                                        {lesson.notes && (
                                                            <div className="bg-white/60 p-3 rounded-lg border border-gray-100">
                                                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                                                                    <MessageSquare className="h-3 w-3" />
                                                                    Öğretmen Notu
                                                                </div>
                                                                <p className="text-sm text-gray-700 italic leading-relaxed">
                                                                    "{lesson.notes}"
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <BookOpen className="h-12 w-12 mb-3 opacity-20" />
                            <p>Veri çekilemedi.</p>
                        </div>
                    )}
                </div>

                <div className="shrink-0 p-4 bg-white border-t flex justify-end">
                    <Button onClick={() => setIsOpen(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0">
                        Kapat
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
