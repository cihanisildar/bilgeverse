'use client';

import { createContext, useContext } from 'react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { UserRole } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft, Calendar, Users, CalendarDays, Loader2,
    LayoutDashboard, List, FileBox, Target, ClipboardList, BarChart3, Briefcase
} from 'lucide-react';
import { useAcademyLessonDetails } from '@/app/hooks/use-academy-data';
import { AcademyLesson } from '@/types/academy';
import { EditLessonModal } from './EditLessonModal';

interface LessonContextValue {
    lesson: AcademyLesson;
    userId: string;
    userRoles: UserRole[];
    basePath: string;
    canManage: boolean;
    isStudent: boolean;
    isMember: boolean;
    isAdminOrBoard: boolean;
}

const LessonContext = createContext<LessonContextValue | null>(null);

export function useLessonContext() {
    const ctx = useContext(LessonContext);
    if (!ctx) throw new Error('useLessonContext must be used within LessonShell');
    return ctx;
}

interface NavItem {
    key: string;
    label: string;
    icon: any;
    segment: string; // '' for overview
    show: boolean;
}

interface LessonShellProps {
    lessonId: string;
    userId: string;
    userRoles: UserRole[];
    basePath: string;
    children: React.ReactNode;
}

export function LessonShell({ lessonId, userId, userRoles, basePath, children }: LessonShellProps) {
    const { data: lesson, isLoading, error } = useAcademyLessonDetails(lessonId);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && (error || !lesson)) {
            const timer = setTimeout(() => router.push(basePath), 3000);
            return () => clearTimeout(timer);
        }
    }, [isLoading, error, lesson, router, basePath]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                <p className="text-blue-600 font-medium italic">Ders yükleniyor...</p>
            </div>
        );
    }

    if (error || !lesson) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center">
                <p className="text-red-500 font-bold mb-2">Ders bulunamadı veya bir hata oluştu.</p>
                <p className="text-gray-500">Akademi ana sayfasına yönlendiriliyorsunuz...</p>
            </div>
        );
    }

    const isAdminOrBoard = userRoles.includes(UserRole.ADMIN) || userRoles.includes(UserRole.BOARD_MEMBER);
    const isAssigned = lesson.assignments.some((a) => a.userId === userId);
    const isStudent = userRoles.includes(UserRole.STUDENT);
    const isMember = lesson.students.some((s) => s.studentId === userId);
    const canManage = isAdminOrBoard || isAssigned;

    const lessonBase = `${basePath}/lesson/${lesson.id}`;

    const navItems: NavItem[] = [
        { key: 'overview', label: 'Genel', icon: LayoutDashboard, segment: '', show: true },
        { key: 'sessions', label: 'Oturumlar', icon: Calendar, segment: 'sessions', show: true },
        { key: 'syllabus', label: 'Müfredat', icon: List, segment: 'syllabus', show: true },
        { key: 'materials', label: 'Materyaller', icon: FileBox, segment: 'materials', show: true },
        { key: 'tasks', label: 'Görevler', icon: Target, segment: 'tasks', show: true },
        { key: 'students', label: 'Öğrenciler', icon: Users, segment: 'students', show: !isStudent || isMember || canManage },
        { key: 'notes', label: 'Değerlendirme', icon: ClipboardList, segment: 'notes', show: canManage },
        { key: 'report', label: 'Rapor', icon: BarChart3, segment: 'report', show: canManage },
        { key: 'management', label: 'Yönetim', icon: Briefcase, segment: 'management', show: isAdminOrBoard },
    ];

    const ctxValue: LessonContextValue = {
        lesson, userId, userRoles, basePath, canManage, isStudent, isMember, isAdminOrBoard,
    };

    return (
        <LessonContext.Provider value={ctxValue}>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <Link href={basePath}>
                        <Button variant="ghost" className="mb-6 hover:bg-gray-100 transition-all duration-200">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Akademiye Dön
                        </Button>
                    </Link>

                    {/* Header card */}
                    <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-blue-100 overflow-hidden relative mb-6">
                        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-500 to-indigo-500"></div>
                        <div className="flex flex-col md:flex-row gap-6 md:items-center">
                            {lesson.imageUrl && (
                                <div className="relative w-full md:w-32 h-32 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                                    <Image src={lesson.imageUrl} alt={lesson.name} fill className="object-cover" />
                                </div>
                            )}
                            <div className="space-y-3 flex-1">
                                <div className="flex justify-between items-start gap-4">
                                    <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">{lesson.name}</h1>
                                    {canManage && <EditLessonModal lesson={lesson} />}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Badge variant="outline" className="px-3 py-1 rounded-full border-blue-200 text-blue-700 bg-blue-50">
                                        <Users className="h-3.5 w-3.5 mr-1.5" />
                                        {lesson.capacity != null ? `${lesson.students.length} / ${lesson.capacity}` : `${lesson.students.length} Öğrenci`}
                                    </Badge>
                                    <Badge variant="outline" className="px-3 py-1 rounded-full border-indigo-200 text-indigo-700 bg-indigo-50">
                                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                        {lesson.sessions.length} Oturum
                                    </Badge>
                                    {lesson.startDate && (
                                        <Badge variant="outline" className="px-3 py-1 rounded-full border-emerald-200 text-emerald-700 bg-emerald-50">
                                            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                                            {new Date(lesson.startDate).toLocaleDateString('tr-TR')}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
                        {/* Sidebar nav */}
                        <nav className="lg:sticky lg:top-8 h-max">
                            <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible bg-white rounded-2xl border border-blue-100 p-2 shadow-sm">
                                {navItems.filter((i) => i.show).map((item) => {
                                    const href = item.segment ? `${lessonBase}/${item.segment}` : lessonBase;
                                    const active = pathname === href;
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.key}
                                            href={href}
                                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${active
                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}
                                        >
                                            <Icon className="h-4 w-4 flex-shrink-0" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </nav>

                        {/* Content */}
                        <div className="min-w-0">{children}</div>
                    </div>
                </div>
            </div>
        </LessonContext.Provider>
    );
}
