'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Trophy, BarChart3 } from 'lucide-react';
import BranchList from './BranchList';
import AthleteList from './AthleteList';
import TrainingSchedule from './TrainingSchedule';
import AttendanceRecording from './AttendanceRecording';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/app/contexts/AuthContext';
import { UserRole } from '@prisma/client';

export default function DashboardContainer() {
    const { user } = useAuth();
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

    const roles = user?.roles && user.roles.length > 0 ? user.roles : [user?.role];
    const isOnlyAthlete = roles.length === 1 && roles.includes(UserRole.ATHLETE);
    const isAdminOrTutor = roles.some(r => r === UserRole.ADMIN || r === UserRole.TUTOR || r === UserRole.BOARD_MEMBER);

    if (selectedSessionId) {
        return (
            <AttendanceRecording
                trainingId={selectedSessionId}
                onBack={() => setSelectedSessionId(null)}
            />
        );
    }

    return (
        <Tabs defaultValue="schedule" className="space-y-6">
            <TabsList className="bg-white p-1 border shadow-sm h-12 w-full sm:w-auto justify-start inline-flex">
                <TabsTrigger value="schedule" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white h-full px-6">
                    <Calendar className="h-4 w-4 mr-2" /> Takvim
                </TabsTrigger>

                {!isOnlyAthlete && (
                    <>
                        <TabsTrigger value="athletes" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white h-full px-6">
                            <Users className="h-4 w-4 mr-2" /> Sporcular
                        </TabsTrigger>
                        <TabsTrigger value="branches" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white h-full px-6">
                            <Trophy className="h-4 w-4 mr-2" /> Branşlar
                        </TabsTrigger>
                    </>
                )}

                <TabsTrigger value="stats" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white h-full px-6">
                    <BarChart3 className="h-4 w-4 mr-2" /> {isOnlyAthlete ? 'Performansım' : 'Analiz'}
                </TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="space-y-4 outline-none">
                <TrainingSchedule onSelectSession={setSelectedSessionId} />
            </TabsContent>

            {!isOnlyAthlete && (
                <>
                    <TabsContent value="athletes" className="space-y-4 outline-none">
                        <AthleteList />
                    </TabsContent>

                    <TabsContent value="branches" className="space-y-4 outline-none">
                        <BranchList />
                    </TabsContent>
                </>
            )}

            <TabsContent value="stats" className="space-y-4 outline-none">
                <Card>
                    <CardHeader>
                        <CardTitle>{isOnlyAthlete ? 'Performans Metriklerim' : 'Gelişmiş İstatistikler'}</CardTitle>
                        <CardDescription>
                            {isOnlyAthlete
                                ? 'Gelişim grafikleriniz ve performans verileriniz yakında burada olacak.'
                                : 'Performans metrikleri yakında görselleştirilecek.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-64 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                            <p>Veriler toplandıkça burası dolacaktır.</p>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
