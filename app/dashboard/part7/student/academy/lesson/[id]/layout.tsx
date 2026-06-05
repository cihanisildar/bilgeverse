import { requireAuth } from '@/app/lib/auth-utils';
import { LessonShell } from '@/components/academy/LessonShell';

export default async function StudentLessonLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { id: string };
}) {
    const session = await requireAuth({ partId: 11 });
    const userRoles = session.user.roles || [session.user.role];

    return (
        <LessonShell
            lessonId={params.id}
            userId={session.user.id}
            userRoles={userRoles}
            basePath="/dashboard/part7/student/academy"
        >
            {children}
        </LessonShell>
    );
}
