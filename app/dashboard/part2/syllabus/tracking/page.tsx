import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, GraduationCap, CheckCircle2, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { getGlobalSyllabusProgress } from '@/app/actions/syllabus';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import TrackingControls from './TrackingControls';
import SyllabusProgressDialog from './SyllabusProgressDialog';

export default async function SyllabusTrackingPage({
    searchParams,
}: {
    searchParams: { q?: string; p?: string };
}) {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/dashboard/part2/syllabus');
    }

    const query = searchParams.q || '';
    const page = parseInt(searchParams.p || '1');
    const pageSize = 10;

    const result = await getGlobalSyllabusProgress({
        search: query,
        page,
        pageSize,
    });

    const { results: classrooms = [], pagination = { total: 0, totalPages: 0 } } = result.data || {};

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Link href="/dashboard/part2/syllabus">
                    <Button variant="ghost" className="mb-6 hover:bg-white/50">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Geri Dön
                    </Button>
                </Link>

                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-teal-600">
                                Sınıf Bazlı Müfredat Takibi
                            </span>
                        </h1>
                        <p className="text-gray-600">
                            Her sınıfın tüm global müfredatlardaki ilerleme durumunu buradan izleyebilirsiniz.
                        </p>
                    </div>
                    <TrackingControls />
                </div>

                {classrooms.length === 0 ? (
                    <Card className="bg-white/50 backdrop-blur-sm border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Users className="h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-500 text-lg">
                                {query ? 'Aramanızla eşleşen sınıf bulunamadı.' : 'Henüz tanımlanmış bir sınıf veya global müfredat bulunmuyor.'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {classrooms.map((classroom) => (
                            <Card key={classroom.classroomId} className="bg-white/80 backdrop-blur-sm border-cyan-100 overflow-hidden hover:shadow-md transition-shadow">
                                <CardHeader className="bg-gradient-to-r from-cyan-50/50 to-teal-50/50 border-b border-cyan-50 py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl text-cyan-900 flex items-center gap-2">
                                                <Users className="h-5 w-5 text-cyan-600" />
                                                {classroom.classroomName}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-1 mt-1 text-cyan-700/70">
                                                <GraduationCap className="h-3.5 w-3.5" />
                                                {classroom.tutorName}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                                        {classroom.syllabiProgress.map((prog) => (
                                            <SyllabusProgressDialog
                                                key={prog.syllabusId}
                                                classroomId={classroom.classroomId}
                                                classroomName={classroom.classroomName}
                                                syllabusId={prog.syllabusId}
                                            >
                                                <div className="bg-white/50 p-4 rounded-xl border border-cyan-50 space-y-3 cursor-pointer hover:bg-cyan-50/50 hover:border-cyan-200 transition-all group/card">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h4 className="font-semibold text-gray-800 text-sm line-clamp-2 min-h-[40px] group-hover/card:text-cyan-700 transition-colors">
                                                            {prog.syllabusTitle}
                                                        </h4>
                                                        <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-100 flex-shrink-0">
                                                            %{Math.round(prog.percentage)}
                                                        </Badge>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Progress value={prog.percentage} className="h-1.5" />
                                                        <div className="flex justify-between text-[10px] text-gray-500">
                                                            <span>Tamamlanan: {prog.completedCount} / {prog.totalCount}</span>
                                                            <span className="text-cyan-600 font-bold opacity-0 group-hover/card:opacity-100 transition-opacity">Detayları Gör →</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                                        <Clock className="h-3 w-3" />
                                                        <span>
                                                            {prog.lastUpdated
                                                                ? `Son: ${new Date(prog.lastUpdated).toLocaleDateString('tr-TR')}`
                                                                : 'Henüz işlem yok'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </SyllabusProgressDialog>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-8">
                                <Link
                                    href={`?q=${query}&p=${Math.max(1, page - 1)}`}
                                    className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                                >
                                    <Button variant="outline" size="sm" className="bg-white">
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Önceki
                                    </Button>
                                </Link>
                                <div className="text-sm text-gray-600 font-medium">
                                    Sayfa {page} / {pagination.totalPages}
                                </div>
                                <Link
                                    href={`?q=${query}&p=${Math.min(pagination.totalPages, page + 1)}`}
                                    className={page >= pagination.totalPages ? 'pointer-events-none opacity-50' : ''}
                                >
                                    <Button variant="outline" size="sm" className="bg-white">
                                        Sonraki
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
