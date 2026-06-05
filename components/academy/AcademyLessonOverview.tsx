'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Users, Calendar, FileBox, Target } from 'lucide-react';
import { useLessonContext } from './LessonShell';

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
        </div>
    );
}

export function AcademyLessonOverview() {
    const { lesson } = useLessonContext();

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Ders Hakkında</h2>
                <p className="text-gray-600 leading-relaxed">
                    {lesson.description || 'Bu ders için henüz bir açıklama girilmemiş.'}
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Öğrenci" value={lesson.students.length} color="bg-blue-50 text-blue-600" />
                <StatCard icon={Calendar} label="Oturum" value={lesson.sessions.length} color="bg-indigo-50 text-indigo-600" />
                <StatCard icon={FileBox} label="Materyal" value={(lesson.materials || []).length} color="bg-emerald-50 text-emerald-600" />
                <StatCard icon={Target} label="Görev" value={(lesson.tasks || []).length} color="bg-purple-50 text-purple-600" />
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
                    Eğitmenler
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {lesson.assignments.length > 0 ? (
                        lesson.assignments.map((assignment) => (
                            <div key={assignment.id} className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-50">
                                <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                                    {assignment.user.avatarUrl ? (
                                        <Image src={assignment.user.avatarUrl} alt={assignment.user.firstName || ''} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                                            {assignment.user.firstName ? assignment.user.firstName[0] : (assignment.user.username ? assignment.user.username[0] : '?')}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">
                                        {assignment.user.firstName} {assignment.user.lastName}
                                    </p>
                                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider p-0 h-auto text-blue-600 border-0">
                                        {assignment.role === 'ADMIN' ? 'Admin' :
                                            assignment.role === 'TUTOR' ? 'Eğitmen' :
                                                assignment.role === 'ASISTAN' ? 'Asistan' : assignment.role}
                                    </Badge>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm italic">Henüz atanmış eğitmen bulunmuyor.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
