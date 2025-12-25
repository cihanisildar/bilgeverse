'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, GraduationCap, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getTutorStudents } from '@/app/actions/attendance-sessions';
import { useAuth } from '@/app/contexts/AuthContext';

type Student = {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    tutor: {
        id: string;
        firstName: string | null;
        lastName: string | null;
    } | null;
};

type TutorGroupInfoProps = {
    onStudentsLoaded?: (hasStudents: boolean) => void;
};

export default function TutorGroupInfo({ onStudentsLoaded }: TutorGroupInfoProps) {
    const { user } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            const result = await getTutorStudents();
            if (!result.error && result.data) {
                setStudents(result.data);
                onStudentsLoaded?.(result.data.length > 0);
            } else {
                onStudentsLoaded?.(false);
            }
            setLoading(false);
        };

        if (user) {
            fetchStudents();
        }
    }, [user, onStudentsLoaded]);

    if (loading) {
        return (
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                <CardContent className="p-6 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </CardContent>
            </Card>
        );
    }

    const activeStudents = students.filter(s => s !== null);
    const studentCount = activeStudents.length;

    // If no students, show warning message
    if (studentCount === 0) {
        return (
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-orange-500 to-red-500"></div>
                <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        Size Atanmış Sınıf Bulunmuyor
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Yoklama almak için öncelikle size bir sınıf atanması gerekmektedir.
                    </p>
                    <p className="text-sm text-gray-500">
                        Lütfen yönetici ile iletişime geçin.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl">
            <div className="h-1.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <CardHeader>
                <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">
                        <GraduationCap className="h-7 w-7" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">Sınıfınız</CardTitle>
                        <CardDescription className="mt-1">
                            Sizin sorumlu olduğunuz öğrenciler
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Users className="h-8 w-8 text-purple-600" />
                            <div>
                                <p className="text-2xl font-bold text-gray-800">{studentCount}</p>
                                <p className="text-sm text-gray-600">Öğrenci</p>
                            </div>
                        </div>
                        <UserCheck className="h-8 w-8 text-purple-400" />
                    </div>

                    <div className="pt-2">
                        <p className="text-sm font-medium text-gray-700 mb-2">Öğrencileriniz:</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {activeStudents.map((student) => (
                                <div
                                    key={student.id}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                            <span className="text-xs font-semibold text-purple-600">
                                                {student.firstName?.charAt(0) || student.username.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {student.firstName} {student.lastName}
                                            </p>
                                            <p className="text-xs text-gray-500">@{student.username}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
