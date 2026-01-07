'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Users,
    UserMinus,
    Crown,
    Network,
    TrendingUp,
    Calendar,
    AlertCircle,
    Loader2,
    Tag,
    Settings,
    UserPlus
} from 'lucide-react';
import { getSociometricData } from '@/app/actions/sociometric';
import StudentTagsView from '@/app/components/student/StudentTagsView';
import TagTemplateManager from '@/app/components/admin/TagTemplateManager';
import QuickTagAssigner from '@/app/components/student/QuickTagAssigner';
import FavoriteActivitiesDialog from '@/app/components/sociometric/FavoriteActivitiesDialog';

interface SociometricAnalysisProps {
    userId: string;
    userRole: string;
}

interface ClassroomOption {
    id: string;
    name: string;
    tutorName: string;
}

interface SociometricData {
    groupLeaders: GroupLeader[];
    isolatedStudents: IsolatedStudent[];
    friendGroups: FriendGroup[];
    activityStats: ActivityStats;
    students: any[];
    classroomInfo: {
        name: string;
        totalStudents: number;
        tutorName: string;
    };
}

interface GroupLeader {
    id: string;
    name: string;
    avatarUrl?: string;
    attendanceCount: number;
    participationCount: number;
    participationRate: number;
}

interface IsolatedStudent {
    id: string;
    name: string;
    avatarUrl?: string;
    attendanceCount: number;
    participationCount: number;
    lastActivityDate?: string;
}

interface FriendGroup {
    students: {
        id: string;
        name: string;
        avatarUrl?: string;
    }[];
    commonActivities: number;
    activityNames: string[];
}

interface ActivityStats {
    totalActivities: number;
    totalParticipations: number;
    averageParticipationRate: number;
    mostPopularActivity?: string;
    leastPopularActivity?: string;
    topActivities: { name: string; participationCount: number }[];
    weeklyTrend: { week: string; count: number }[];
}

export default function SociometricAnalysis({ userId, userRole }: SociometricAnalysisProps) {
    const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
    const [selectedClassroom, setSelectedClassroom] = useState<string>('');
    const [data, setData] = useState<SociometricData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadClassrooms();
    }, []);

    useEffect(() => {
        if (selectedClassroom) {
            loadSociometricData(selectedClassroom);
        }
    }, [selectedClassroom]);

    const loadClassrooms = async () => {
        try {
            const response = await fetch('/api/classrooms');
            const result = await response.json();
            setClassrooms(result.classrooms || []);

            // Auto-select first classroom for tutors
            if (userRole === 'TUTOR' && result.classrooms?.length > 0) {
                setSelectedClassroom(result.classrooms[0].id);
            }
        } catch (error) {
            console.error('Error loading classrooms:', error);
        }
    };

    const loadSociometricData = async (classroomId: string) => {
        setLoading(true);
        try {
            const result = await getSociometricData(classroomId);
            setData(result);
        } catch (error) {
            console.error('Error loading sociometric data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const [tagManagementOpen, setTagManagementOpen] = useState(false);

    return (
        <div className="space-y-6">
            {/* Admin Header with Tag Management Button */}
            {userRole === 'ADMIN' && (
                <div className="flex justify-end gap-2">
                    <Dialog open={tagManagementOpen} onOpenChange={setTagManagementOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="flex items-center gap-2 border-violet-200 hover:bg-violet-50"
                            >
                                <Settings className="h-4 w-4 text-violet-600" />
                                Etiket Yönetimi
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5 text-violet-600" />
                                    Etiket Şablonları Yönetimi
                                </DialogTitle>
                                <DialogDescription>
                                    Tüm sınıflar için geçerli etiket şablonlarını oluşturun ve yönetin
                                </DialogDescription>
                            </DialogHeader>
                            <TagTemplateManager embedded />
                        </DialogContent>
                    </Dialog>
                    {selectedClassroom && data?.activityStats && (
                        <FavoriteActivitiesDialog activities={data.activityStats.topActivities} />
                    )}
                    {selectedClassroom && data?.students && (
                        <QuickTagAssigner
                            classroomId={selectedClassroom}
                            students={data.students}
                            onTagsChange={() => loadSociometricData(selectedClassroom)}
                        />
                    )}
                </div>
            )}

            {/* Tutor Header with Quick Tag Assign Button */}
            {userRole === 'TUTOR' && selectedClassroom && data && (
                <div className="flex justify-end gap-2">
                    {data.activityStats && (
                        <FavoriteActivitiesDialog activities={data.activityStats.topActivities} />
                    )}
                    {data.students && (
                        <QuickTagAssigner
                            classroomId={selectedClassroom}
                            students={data.students}
                            onTagsChange={() => loadSociometricData(selectedClassroom)}
                        />
                    )}
                </div>
            )}

            {/* Classroom Selector - Only for Admin */}
            {userRole === 'ADMIN' && (
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-violet-600" />
                            Sınıf Seçimi
                        </CardTitle>
                        <CardDescription>
                            Analiz etmek istediğiniz sınıfı seçin
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
                            <SelectTrigger className="w-full md:w-96">
                                <SelectValue placeholder="Sınıf seçiniz..." />
                            </SelectTrigger>
                            <SelectContent>
                                {classrooms.map((classroom) => (
                                    <SelectItem key={classroom.id} value={classroom.id}>
                                        {classroom.name} - {classroom.tutorName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            )}

            {/* Classroom Info - For Tutor */}
            {userRole === 'TUTOR' && data && (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 to-purple-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-violet-600" />
                            {data.classroomInfo.name}
                        </CardTitle>
                        <CardDescription>
                            Sınıfınızın sosyometrik analiz raporu
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                </div>
            )}

            {/* Data Display */}
            {!loading && data && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-0 shadow-md bg-gradient-to-br from-violet-50 to-purple-50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600">Toplam Öğrenci</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-violet-600">
                                    {data.classroomInfo.totalStudents}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-cyan-50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600">Toplam Etkinlik</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-600">
                                    {data.activityStats.totalActivities}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600">Ortalama Katılım</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-600">
                                    {data.activityStats.averageParticipationRate.toFixed(0)}%
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-gray-600">İzole Öğrenci</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-orange-600">
                                    {data.isolatedStudents.length}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs for Different Views */}
                    <Tabs defaultValue="leaders" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
                            <TabsTrigger value="leaders" className="flex items-center gap-2">
                                <Crown className="h-4 w-4" />
                                Grup Liderleri
                            </TabsTrigger>
                            <TabsTrigger value="isolated" className="flex items-center gap-2">
                                <UserMinus className="h-4 w-4" />
                                İzole Öğrenciler
                            </TabsTrigger>
                            <TabsTrigger value="groups" className="flex items-center gap-2">
                                <Network className="h-4 w-4" />
                                Arkadaş Grupları
                            </TabsTrigger>
                            <TabsTrigger value="tags" className="flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                Etiketler
                            </TabsTrigger>
                        </TabsList>

                        {/* Group Leaders Tab */}
                        <TabsContent value="leaders" className="space-y-4">
                            <Card className="border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Crown className="h-5 w-5 text-yellow-600" />
                                        Grup Liderleri
                                    </CardTitle>
                                    <CardDescription>
                                        En çok etkinliğe katılan ve grubu yönlendiren öğrenciler
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {data.groupLeaders.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>Henüz yeterli veri bulunmuyor</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {data.groupLeaders.map((leader, index) => (
                                                <div
                                                    key={leader.id}
                                                    className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <Avatar className="h-12 w-12 border-2 border-yellow-400">
                                                                <AvatarImage src={leader.avatarUrl} />
                                                                <AvatarFallback className="bg-yellow-100 text-yellow-700">
                                                                    {getInitials(leader.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            {index === 0 && (
                                                                <Crown className="h-5 w-5 text-yellow-600 absolute -top-1 -right-1" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{leader.name}</p>
                                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {leader.participationCount} etkinlik
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <TrendingUp className="h-3 w-3" />
                                                                    {leader.participationRate.toFixed(0)}% katılım
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
                                                        #{index + 1} Lider
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Isolated Students Tab */}
                        <TabsContent value="isolated" className="space-y-4">
                            <Card className="border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <UserMinus className="h-5 w-5 text-orange-600" />
                                        İzole Öğrenciler
                                    </CardTitle>
                                    <CardDescription>
                                        Yoklamaya katılmasına rağmen etkinliklere katılmayan öğrenciler
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {data.isolatedStudents.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>İzole öğrenci tespit edilmedi</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {data.isolatedStudents.map((student) => (
                                                <div
                                                    key={student.id}
                                                    className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <Avatar className="h-12 w-12 border-2 border-orange-400">
                                                            <AvatarImage src={student.avatarUrl} />
                                                            <AvatarFallback className="bg-orange-100 text-orange-700">
                                                                {getInitials(student.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{student.name}</p>
                                                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {student.attendanceCount} yoklama
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    {student.participationCount} etkinlik
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="border-orange-300 text-orange-700">
                                                        Dikkat Gerekli
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Friend Groups Tab */}
                        <TabsContent value="groups" className="space-y-4">
                            <Card className="border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Network className="h-5 w-5 text-blue-600" />
                                        Ortak Arkadaş Grupları
                                    </CardTitle>
                                    <CardDescription>
                                        Birlikte etkinliklere katılan öğrenci grupları
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {data.friendGroups.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>Henüz ortak grup tespit edilmedi</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {data.friendGroups.map((group, groupIndex) => (
                                                <div
                                                    key={groupIndex}
                                                    className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-semibold text-gray-800">
                                                            Grup {groupIndex + 1}
                                                        </h4>
                                                        <Badge className="bg-blue-100 text-blue-700">
                                                            {group.commonActivities} ortak etkinlik
                                                        </Badge>
                                                    </div>

                                                    <div className="flex flex-wrap gap-3 mb-3">
                                                        {group.students.map((student) => (
                                                            <div
                                                                key={student.id}
                                                                className="flex items-center gap-2 bg-white rounded-full py-1 px-3 border border-blue-200"
                                                            >
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarImage src={student.avatarUrl} />
                                                                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                                                        {getInitials(student.name)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-sm font-medium text-gray-700">
                                                                    {student.name}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {group.activityNames.length > 0 && (
                                                        <div className="text-xs text-gray-600">
                                                            <span className="font-medium">Ortak Etkinlikler:</span>{' '}
                                                            {group.activityNames.slice(0, 3).join(', ')}
                                                            {group.activityNames.length > 3 && ` +${group.activityNames.length - 3} daha`}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Student Tags Tab */}
                        <TabsContent value="tags" className="space-y-4">
                            <StudentTagsView classroomId={selectedClassroom} />
                        </TabsContent>
                    </Tabs>
                </>
            )}

            {/* Empty State */}
            {!loading && !data && selectedClassroom && (
                <Card className="border-0 shadow-lg">
                    <CardContent className="text-center py-12">
                        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            Veri bulunamadı
                        </h3>
                        <p className="text-gray-500">
                            Seçilen sınıf için henüz yeterli etkinlik veya yoklama verisi bulunmuyor.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
