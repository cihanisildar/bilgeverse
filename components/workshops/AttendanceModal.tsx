"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, QrCode as QrIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

export function AttendanceModal({
    open,
    onOpenChange,
    activity
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    activity: any;
}) {
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        if (open && activity.qrCodeToken) {
            // Generate QR code for: current_url_origin + /attendance?token=...
            const url = `${window.location.origin}/attendance?token=${activity.qrCodeToken}`;
            QRCode.toDataURL(url, { width: 300, margin: 2 })
                .then(setQrDataUrl)
                .catch(console.error);

            fetchAttendance();
        }
    }, [open, activity]);

    const fetchAttendance = async () => {
        setFetching(true);
        try {
            const res = await fetch(`/api/workshops/activities/${activity.id}/attendance`);
            if (!res.ok) throw new Error('Failed to fetch attendance');
            const data = await res.json();
            setStudents(data);
        } catch (error) {
            toast.error("Katılım listesi alınamadı.");
        } finally {
            setFetching(false);
        }
    };

    const toggleAttendance = async (studentId: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/workshops/activities/${activity.id}/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, status: !currentStatus }),
            });

            if (!res.ok) throw new Error('Failed to mark attendance');

            setStudents(students.map(s =>
                s.studentId === studentId ? { ...s, status: !currentStatus } : s
            ));
            toast.success(currentStatus ? "Devamsız olarak işaretlendi" : "Geldi olarak işaretlendi");
        } catch (error) {
            toast.error("İşlem başarısız oldu.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{activity.title} - Yoklama</DialogTitle>
                    <DialogDescription>
                        QR kodu öğrencilere okutabilir veya listeden manuel işaretleme yapabilirsiniz.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                    {/* QR Code Section */}
                    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                            <QrIcon className="h-4 w-4 mr-2" />
                            Giriş QR Kodu
                        </h4>
                        {qrDataUrl ? (
                            <div className="relative w-64 h-64 bg-white p-4 rounded-2xl shadow-sm">
                                <img src={qrDataUrl} alt="Attendance QR Code" className="w-full h-full" />
                            </div>
                        ) : (
                            <div className="w-64 h-64 bg-gray-100 flex items-center justify-center rounded-2xl">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            </div>
                        )}
                        <p className="text-[10px] text-gray-400 mt-4 break-all text-center">
                            Token: {activity.qrCodeToken}
                        </p>
                    </div>

                    {/* Manual List Section */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-gray-900 flex justify-between items-center">
                            Öğrenci Listesi
                            <Badge variant="outline">{students.filter(s => s.status).length} / {students.length}</Badge>
                        </h4>

                        {fetching ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                            </div>
                        ) : students.length === 0 ? (
                            <p className="text-sm text-gray-500 italic py-4 text-center">Atölyede kayıtlı öğrenci bulunmuyor.</p>
                        ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                {students.map((record) => (
                                    <div key={record.student.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                                                {record.student.firstName ? record.student.firstName[0] : '?'}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">
                                                {record.student.firstName || ''} {record.student.lastName || ''}
                                            </span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={record.status ? "default" : "outline"}
                                            onClick={() => toggleAttendance(record.student.id, record.status)}
                                            className={record.status ? "bg-green-600 hover:bg-green-700" : "text-gray-400"}
                                        >
                                            {record.status ? (
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                            ) : (
                                                <XCircle className="h-4 w-4 mr-1" />
                                            )}
                                            {record.status ? "Geldi" : "Gelmedi"}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Button variant="outline" className="w-full text-xs" onClick={fetchAttendance}>
                            Listeyi Yenile
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
