'use client';

import { Lock } from 'lucide-react';
import { useLessonContext } from './LessonShell';
import { AcademyLessonOverview } from './AcademyLessonOverview';
import { AcademyAssignments, AcademyStudents } from './AcademyManagement';
import { AcademySyllabus, AcademySessions } from './AcademyCurriculum';
import { AcademyMaterials } from './AcademyMaterials';
import { AcademyTasks } from './AcademyTasks';
import { AcademyStudentNotes } from './AcademyStudentNotes';
import { AcademyReports } from './AcademyReports';

export type LessonSectionKey =
    | 'overview' | 'sessions' | 'syllabus' | 'materials'
    | 'tasks' | 'students' | 'notes' | 'report' | 'management';

function NoAccess() {
    return (
        <div className="flex flex-col items-center justify-center py-24 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Lock className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Bu bölüme erişiminiz yok</h3>
            <p className="text-gray-500 max-w-xs mx-auto">Bu bölümü görüntülemek için yetkiniz bulunmuyor.</p>
        </div>
    );
}

export function LessonSection({ section }: { section: LessonSectionKey }) {
    const { lesson, userId, canManage, isStudent, isMember, isAdminOrBoard } = useLessonContext();

    switch (section) {
        case 'overview':
            return <AcademyLessonOverview />;

        case 'sessions':
            return (
                <AcademySessions
                    lessonId={lesson.id}
                    sessions={lesson.sessions}
                    canManage={canManage}
                    assignments={lesson.assignments}
                    students={lesson.students.map((s) => ({
                        id: s.studentId,
                        firstName: s.student.firstName,
                        lastName: s.student.lastName,
                    }))}
                />
            );

        case 'syllabus':
            return <AcademySyllabus lessonId={lesson.id} syllabus={lesson.syllabus} canManage={canManage} />;

        case 'materials':
            return <AcademyMaterials lessonId={lesson.id} materials={lesson.materials || []} canManage={canManage} />;

        case 'tasks':
            return (
                <AcademyTasks
                    lessonId={lesson.id}
                    tasks={lesson.tasks || []}
                    students={lesson.students}
                    canManage={canManage}
                    currentUserId={userId}
                    isStudent={isStudent && !canManage}
                />
            );

        case 'students':
            if (isStudent && !isMember && !canManage) return <NoAccess />;
            return (
                <AcademyStudents
                    lessonId={lesson.id}
                    students={lesson.students}
                    sessions={lesson.sessions}
                    canManage={canManage}
                />
            );

        case 'notes':
            if (!canManage) return <NoAccess />;
            return <AcademyStudentNotes lessonId={lesson.id} notes={lesson.notes || []} students={lesson.students} />;

        case 'report':
            if (!canManage) return <NoAccess />;
            return <AcademyReports lessonId={lesson.id} />;

        case 'management':
            if (!isAdminOrBoard) return <NoAccess />;
            return <AcademyAssignments lessonId={lesson.id} assignments={lesson.assignments} />;

        default:
            return <AcademyLessonOverview />;
    }
}
