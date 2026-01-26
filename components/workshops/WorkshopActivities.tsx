"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar, CheckCircle2, Clock, MapPin, QrCode, User, Pencil, Trash2, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AddActivityModal } from './AddActivityModal';
import { AttendanceModal } from './AttendanceModal';
import { EditActivityDialog } from './EditActivityDialog';
import { DeleteActivityDialog } from './DeleteActivityDialog';
import { Badge } from '@/components/ui/badge';

interface Activity {
    id: string;
    title: string;
    description: string | null;
    date: Date;
    startTime: string | null;
    endTime: string | null;
    location: string | null;
    qrCodeToken: string | null;
    tutor: { firstName: string; lastName: string };
    _count: { attendances: number };
}

interface StudentAttendance {
    [activityId: string]: boolean;
}

export function WorkshopActivities({
    workshopId,
    activities,
    isPrivileged,
    currentUserId,
    isStudent
}: {
    workshopId: string;
    activities: any[];
    isPrivileged: boolean;
    currentUserId?: string;
    isStudent?: boolean;
}) {
    const [selectedActivity, setSelectedActivity] = useState<any>(null);
    const [attendanceOpen, setAttendanceOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [activityToEdit, setActivityToEdit] = useState<any>(null);
    const [activityToDelete, setActivityToDelete] = useState<any>(null);
    const [studentAttendance, setStudentAttendance] = useState<StudentAttendance>({});
    const [loadingAttendance, setLoadingAttendance] = useState(false);

    // Fetch student's attendance status for all activities
    useEffect(() => {
        if (isStudent && currentUserId && activities.length > 0) {
            fetchStudentAttendance();
        }
    }, [isStudent, currentUserId, activities]);

    const fetchStudentAttendance = async () => {
        setLoadingAttendance(true);
        try {
            const attendanceMap: StudentAttendance = {};

            // Fetch attendance for each activity
            await Promise.all(
                activities.map(async (activity) => {
                    const res = await fetch(`/api/workshops/activities/${activity.id}/attendance/student`);
                    if (res.ok) {
                        const data = await res.json();
                        attendanceMap[activity.id] = data.attended;
                    } else {
                        attendanceMap[activity.id] = false;
                    }
                })
            );

            setStudentAttendance(attendanceMap);
        } catch (error) {
            console.error('Error fetching student attendance:', error);
        } finally {
            setLoadingAttendance(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Faaliyet Planı</h2>
                {isPrivileged && <AddActivityModal workshopId={workshopId} />}
            </div>

            {activities.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-amber-200">
                    <Calendar className="h-12 w-12 text-amber-200 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Henüz Faaliyet Yok</h3>
                    <p className="text-gray-500">Bu atölye için henüz planlanmış bir faaliyet bulunmuyor.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {activities.map((activity) => (
                        <Card key={activity.id} className="border-0 shadow-sm hover:shadow-md transition-all bg-white overflow-hidden group">
                            <CardContent className="p-0 flex flex-col md:flex-row">
                                <div className="bg-amber-50 p-6 flex flex-col items-center justify-center min-w-[120px] text-center shrink-0 border-r border-amber-100/50">
                                    <span className="text-xs font-bold text-amber-600 uppercase tracking-tighter">
                                        {format(new Date(activity.date), 'MMMM', { locale: tr })}
                                    </span>
                                    <span className="text-3xl font-black text-amber-700">
                                        {format(new Date(activity.date), 'dd')}
                                    </span>
                                    <span className="text-xs text-amber-600">
                                        {format(new Date(activity.date), 'EEEE', { locale: tr })}
                                    </span>
                                </div>

                                <div className="p-6 flex-1 space-y-3">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                                                {activity.title}
                                            </h3>
                                            <p className="text-gray-600 text-sm line-clamp-1">{activity.description}</p>
                                        </div>
                                        {isPrivileged && (
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => {
                                                        setActivityToEdit(activity);
                                                        setEditOpen(true);
                                                    }}
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    onClick={() => {
                                                        setActivityToDelete(activity);
                                                        setDeleteOpen(true);
                                                    }}
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-red-200 text-red-700 hover:bg-red-50 rounded-xl"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    onClick={() => {
                                                        setSelectedActivity(activity);
                                                        setAttendanceOpen(true);
                                                    }}
                                                    className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm"
                                                >
                                                    <QrCode className="h-4 w-4 mr-2" />
                                                    Yoklama & QR
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <Clock className="h-4 w-4 mr-2 text-amber-500" />
                                            {activity.startTime || "??:??"} - {activity.endTime || "??:??"}
                                        </div>
                                        {activity.location && (
                                            <div className="flex items-center">
                                                <MapPin className="h-4 w-4 mr-2 text-orange-500" />
                                                {activity.location}
                                            </div>
                                        )}
                                        <div className="flex items-center">
                                            <User className="h-4 w-4 mr-2 text-amber-500" />
                                            {activity.tutor?.firstName || ''} {activity.tutor?.lastName || ''}
                                        </div>
                                        <div className="flex items-center text-green-600 font-medium">
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            {activity._count.attendances} Katılımcı
                                        </div>
                                        {isStudent && currentUserId && (
                                            <div className="ml-auto">
                                                {loadingAttendance ? (
                                                    <Badge variant="outline" className="text-gray-400">
                                                        Kontrol ediliyor...
                                                    </Badge>
                                                ) : studentAttendance[activity.id] ? (
                                                    <Badge className="bg-green-600 hover:bg-green-700 text-white">
                                                        <Check className="h-3 w-3 mr-1" />
                                                        Katıldınız
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-gray-300 text-gray-600">
                                                        <X className="h-3 w-3 mr-1" />
                                                        Katılmadınız
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {selectedActivity && (
                <AttendanceModal
                    open={attendanceOpen}
                    onOpenChange={setAttendanceOpen}
                    activity={selectedActivity}
                />
            )}

            {activityToEdit && (
                <EditActivityDialog
                    activity={activityToEdit}
                    open={editOpen}
                    onOpenChange={setEditOpen}
                />
            )}

            {activityToDelete && (
                <DeleteActivityDialog
                    activity={activityToDelete}
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                />
            )}
        </div>
    );
}
