'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useMeeting, useGenerateQRCode } from '@/app/hooks/use-meetings';
import { useMeetingAttendance, useManualCheckIn, useRemoveAttendance } from '@/app/hooks/use-attendance';
import {
  useMeetingDecisions,
  useCreateDecision,
  useUpdateDecision,
  useUpdateDecisionStatus,
  useDeleteDecision,
} from '@/app/hooks/use-decisions';
import { Button } from '@/components/ui/button';
import { getBaseUrl, cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin, Users, FileText, QrCode, UserPlus, ClipboardList, CheckCircle2, Clock, AlertCircle, Check, X, ChevronsUpDown, Search, Plus, Edit2, Trash2, Eye, User } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DecisionStatus } from '@prisma/client';
import { DecisionWithUser, AttendanceWithUser, BoardMemberUser } from '@/app/types/meetings';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MeetingStatus } from '@prisma/client';
import QRCode from 'qrcode';
import { useQuery } from '@tanstack/react-query';
import { getAllUsers, getAdminUsers } from '@/app/actions/users';
import { getBoardMembers } from '@/app/actions/board-members';
import Loading from '@/app/components/Loading';
import { Checkbox } from '@/components/ui/checkbox';

const statusColors: Record<MeetingStatus, string> = {
  PLANNED: 'bg-blue-50 text-blue-700 border-blue-200',
  ONGOING: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED: 'bg-slate-50 text-slate-700 border-slate-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const statusLabels: Record<MeetingStatus, string> = {
  PLANNED: 'Planlandı',
  ONGOING: 'Devam Ediyor',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
};

export default function MeetingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = params.id as string;
  const { user, isAdmin, isTutor } = useAuth();
  const { data: meeting, isLoading } = useMeeting(meetingId);
  const { data: attendance, isLoading: attendanceLoading } = useMeetingAttendance(meetingId);
  const { data: decisions, isLoading: decisionsLoading } = useMeetingDecisions(meetingId);
  const generateQR = useGenerateQRCode();
  const manualCheckIn = useManualCheckIn();
  const removeAttendance = useRemoveAttendance();
  const createDecision = useCreateDecision();
  const updateDecision = useUpdateDecision();
  const updateStatus = useUpdateDecisionStatus();
  const deleteDecision = useDeleteDecision();

  // All hooks must be called before any conditional returns
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [manualCheckInDialogOpen, setManualCheckInDialogOpen] = useState(false);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [selectedGuestUserId, setSelectedGuestUserId] = useState<string>('');
  const [guestSearchQuery, setGuestSearchQuery] = useState<string>('');
  const [guestDropdownOpen, setGuestDropdownOpen] = useState(false);
  // Decision states
  const [createDecisionDialogOpen, setCreateDecisionDialogOpen] = useState(false);
  const [editDecisionDialogOpen, setEditDecisionDialogOpen] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<any>(null);
  const [activeDecisionId, setActiveDecisionId] = useState<string | null>(null);
  const [deleteDecisionDialogOpen, setDeleteDecisionDialogOpen] = useState(false);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  const [detailDecisionDialogOpen, setDetailDecisionDialogOpen] = useState(false);
  const [selectedDecisionForDetail, setSelectedDecisionForDetail] = useState<any>(null);
  const [allAttendeesDialogOpen, setAllAttendeesDialogOpen] = useState(false);

  // Get admin users for board member check-in
  const { data: adminUsersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const result = await getAdminUsers();
      if (result.error) {
        return [];
      }
      return result.data || [];
    },
    enabled: isAdmin && manualCheckInDialogOpen,
  });

  // Get all users for guest check-in
  const { data: usersData } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const result = await getAllUsers();
      if (result.error) {
        return [];
      }
      return result.data || [];
    },
    enabled: isAdmin && guestDialogOpen,
  });

  const handleGenerateQR = async () => {
    const result = await generateQR.mutateAsync(meetingId);
    if (!result.error && result.data) {
      const baseUrl = getBaseUrl();
      const qrData = `${baseUrl}/dashboard/part1/meetings/${meetingId}/check-in`;
      const url = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 400,
      });
      setQrImageUrl(url);
      setQrDialogOpen(true);
    }
  };

  const handleToggleUser = async (userId: string) => {
    const isCheckedIn = attendance?.some((a) => a.userId === userId);

    if (isCheckedIn) {
      // Remove attendance
      const attendanceRecord = attendance?.find((a) => a.userId === userId);
      if (attendanceRecord) {
        await removeAttendance.mutateAsync(attendanceRecord.id);
      }
    } else {
      // Add attendance
      await manualCheckIn.mutateAsync({ meetingId, userId });
    }
  };

  const handleBulkCheckIn = async () => {
    if (!adminUsersData) return;

    for (const user of adminUsersData) {
      const isCheckedIn = attendance?.some((a) => a.userId === user.id);
      if (!isCheckedIn) {
        await manualCheckIn.mutateAsync({ meetingId, userId: user.id });
      }
    }
  };

  const handleBulkCheckOut = async () => {
    if (!attendance || !adminUsersData) return;

    const adminAttendanceIds = attendance
      .filter((a) => adminUsersData.some((admin) => admin.id === a.userId))
      .map((a) => a.id);

    for (const attendanceId of adminAttendanceIds) {
      await removeAttendance.mutateAsync(attendanceId);
    }
  };

  const handleGuestCheckIn = async () => {
    if (!selectedGuestUserId) return;
    await manualCheckIn.mutateAsync({ meetingId, userId: selectedGuestUserId });
    setGuestDialogOpen(false);
    setSelectedGuestUserId('');
    setGuestSearchQuery('');
    setGuestDropdownOpen(false);
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-red-600">Toplantı bulunamadı</div>
        </div>
      </div>
    );
  }

  const isCheckedIn = attendance?.some((a) => a.user.id === user?.id);

  // Decision board setup
  const statusColumns: DecisionStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
  const decisionStatusLabels: Record<DecisionStatus, string> = {
    TODO: 'Yapılacak',
    IN_PROGRESS: 'Devam',
    DONE: 'Tamam',
  };
  const decisionStatusColors: Record<DecisionStatus, string> = {
    TODO: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    DONE: 'bg-green-100 text-green-800',
  };

  const decisionsByStatus = {
    TODO: decisions?.filter((d) => d.status === 'TODO') || [],
    IN_PROGRESS: decisions?.filter((d) => d.status === 'IN_PROGRESS') || [],
    DONE: decisions?.filter((d) => d.status === 'DONE') || [],
  };

  const handleDecisionDragStart = (event: DragStartEvent) => {
    setActiveDecisionId(event.active.id as string);
  };

  const handleDecisionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDecisionId(null);

    if (!over || active.id === over.id) return;

    const decisionId = active.id as string;
    const newStatus = over.id as DecisionStatus;

    if (statusColumns.includes(newStatus)) {
      const decision = decisions?.find((d) => d.id === decisionId);
      if (decision && decision.status !== newStatus) {
        updateStatus.mutate({ id: decisionId, status: newStatus });
      }
    }
  };

  const handleCreateDecision = async (data: {
    title: string;
    description: string | null;
    targetDate: string | null;
    responsibleUserIds: string[];
  }) => {
    await createDecision.mutateAsync({ meetingId, data });
    setCreateDecisionDialogOpen(false);
  };

  const handleEditDecision = async (data: {
    title: string;
    description: string | null;
    targetDate: string | null;
    responsibleUserIds: string[];
  }) => {
    if (selectedDecision) {
      await updateDecision.mutateAsync({ id: selectedDecision.id, data });
      setEditDecisionDialogOpen(false);
      setSelectedDecision(null);
    }
  };

  const handleDeleteDecisionClick = (id: string) => {
    setSelectedDecisionId(id);
    setDeleteDecisionDialogOpen(true);
  };

  const handleDeleteDecisionConfirm = () => {
    if (!selectedDecisionId) return;

    const decisionId = String(selectedDecisionId);
    deleteDecision.mutate(decisionId, {
      onSuccess: (result) => {
        if (result && !result.error) {
          setDeleteDecisionDialogOpen(false);
          setSelectedDecisionId(null);
        }
      },
    });
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    setDeleteDecisionDialogOpen(open);
    if (!open) {
      // Reset state when dialog closes
      setSelectedDecisionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => {
            // Redirect based on user role
            if (isAdmin) {
              router.push('/dashboard/part1/meetings');
            } else if (isTutor) {
              router.push('/dashboard/part7/tutor');
            } else {
              router.push('/dashboard/part7/student');
            }
          }}
          className="mb-6 hover:bg-gray-100 text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>

        {/* Meeting Info and Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <CardTitle className="text-3xl font-bold text-gray-800 mb-3">
                      {meeting.title}
                    </CardTitle>
                    <Badge className={`${statusColors[meeting.status]} border text-sm px-3 py-1`}>
                      {statusLabels[meeting.status]}
                    </Badge>
                  </div>
                </div>
                {meeting.description && (
                  <CardDescription className="text-base text-gray-600 mt-3 leading-relaxed">
                    {meeting.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl border border-indigo-100">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500 text-white mr-4 shadow-lg shadow-indigo-500/30">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Tarih & Saat</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {format(new Date(meeting.meetingDate), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-100">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500 text-white mr-4 shadow-lg shadow-purple-500/30">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Konum</p>
                      <p className="text-sm font-semibold text-gray-800">{meeting.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-100">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500 text-white mr-4 shadow-lg shadow-emerald-500/30">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Katılımcı</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {meeting._count?.attendees || 0} kişi
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500 text-white mr-4 shadow-lg shadow-blue-500/30">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Karar</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {meeting._count?.decisions || 0} adet
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-gray-800">İşlemler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isCheckedIn && meeting.status !== 'COMPLETED' && meeting.status !== 'CANCELLED' && (
                  <Button
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/50 transition-all duration-200 hover:shadow-xl"
                    onClick={() => router.push(`/dashboard/part1/meetings/${meetingId}/check-in`)}
                    disabled={!meeting.qrCodeToken || (meeting.qrCodeExpiresAt ? new Date(meeting.qrCodeExpiresAt) < new Date() : false)}
                    title={!meeting.qrCodeToken ? 'QR kod henüz oluşturulmadı' : (meeting.qrCodeExpiresAt && new Date(meeting.qrCodeExpiresAt) < new Date() ? 'QR kod süresi dolmuş' : '')}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    QR ile Giriş Yap
                  </Button>
                )}
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
                      onClick={handleGenerateQR}
                      disabled={generateQR.isPending}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      {generateQR.isPending ? 'Oluşturuluyor...' : 'QR Kod Oluştur'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Attendance List */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-800">Katılımcılar</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {attendance?.length || 0} kişi katılım sağladı
                    </p>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setManualCheckInDialogOpen(true)}
                      className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Manuel Giriş
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <Loading message="Katılımcılar yükleniyor..." />
                ) : !attendance || attendance.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium mb-1">Henüz katılımcı yok</p>
                    <p className="text-sm text-gray-500">Toplantıya katılım sağlayan kişiler burada görünecek</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attendance.slice(0, 2).map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-semibold shadow-lg">
                            {a.user.firstName?.[0]?.toUpperCase() || a.user.username[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {a.user.firstName && a.user.lastName
                                ? `${a.user.firstName} ${a.user.lastName}`
                                : a.user.username}
                            </p>
                            {a.user.boardMemberTitle && (
                              <p className="text-xs text-indigo-600 font-medium mt-0.5">
                                {a.user.boardMemberTitle}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(a.checkInTime), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={a.checkInMethod === 'QR'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-blue-200 bg-blue-50 text-blue-700'
                          }
                        >
                          {a.checkInMethod === 'QR' ? 'QR Kod' : 'Manuel'}
                        </Badge>
                      </div>
                    ))}
                    {attendance.length > 2 && (
                      <Button
                        variant="outline"
                        className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
                        onClick={() => setAllAttendeesDialogOpen(true)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Tüm Katılımcıları Göster ({attendance.length})
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Decisions Board - Full Width */}
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">Kararlar</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {decisions?.length || 0} karar
                </p>
              </div>
              {isAdmin && (
                <Button
                  onClick={() => setCreateDecisionDialogOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Karar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {decisionsLoading ? (
              <Loading message="Kararlar yükleniyor..." />
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDecisionDragStart}
                onDragEnd={handleDecisionDragEnd}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {statusColumns.map((status) => (
                    <StatusColumn
                      key={status}
                      status={status}
                      decisions={decisionsByStatus[status]}
                      onEdit={(decision) => {
                        setSelectedDecision(decision);
                        setEditDecisionDialogOpen(true);
                      }}
                      onDelete={handleDeleteDecisionClick}
                      onView={(decision) => {
                        setSelectedDecisionForDetail(decision);
                        setDetailDecisionDialogOpen(true);
                      }}
                      isAdmin={isAdmin || false}
                    />
                  ))}
                </div>
                <DragOverlay>
                  {activeDecisionId ? (
                    <Card className="opacity-50">
                      <CardHeader>
                        <CardTitle>
                          {decisions?.find((d) => d.id === activeDecisionId)?.title}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {/* QR Code Dialog */}
        <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-800">QR Kod</DialogTitle>
              <DialogDescription className="text-gray-600">
                Bu QR kodu katılımcılar tarayarak giriş yapabilir
              </DialogDescription>
            </DialogHeader>
            {qrImageUrl && (
              <div className="flex flex-col items-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                <div className="bg-white p-4 rounded-xl shadow-lg mb-4">
                  <img src={qrImageUrl} alt="QR Code" className="w-64 h-64" />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  QR kodu tarayarak toplantıya katılabilirsiniz
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Manual Check-in Dialog - Board Members */}
        <Dialog open={manualCheckInDialogOpen} onOpenChange={setManualCheckInDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-800">Yönetim Kurulu Katılım Takibi</DialogTitle>
              <DialogDescription className="text-gray-600">
                Yönetim kurulu üyelerinin katılım durumunu işaretleyin (✔)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Bulk Actions */}
              <div className="flex gap-2 pb-3 border-b">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkCheckIn}
                  disabled={manualCheckIn.isPending || removeAttendance.isPending}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Tümünü İşaretle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkCheckOut}
                  disabled={manualCheckIn.isPending || removeAttendance.isPending}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Tümünü Kaldır
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setManualCheckInDialogOpen(false);
                    setGuestDialogOpen(true);
                  }}
                  className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Misafir Ekle
                </Button>
              </div>

              {/* Board Members List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {adminUsersData && adminUsersData.length > 0 ? (
                  adminUsersData.map((user) => {
                    const isCheckedIn = attendance?.some((a) => a.user.id === user.id);
                    const displayName = user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.username;

                    return (
                      <div
                        key={user.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-colors",
                          isCheckedIn
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50 border-gray-200"
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox
                            checked={isCheckedIn}
                            onCheckedChange={() => handleToggleUser(user.id)}
                            disabled={manualCheckIn.isPending || removeAttendance.isPending}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{displayName}</p>
                            <p className="text-xs text-gray-500">{user.username}</p>
                          </div>
                        </div>
                        {isCheckedIn && (
                          <Badge className="bg-green-500 text-white">
                            <Check className="h-3 w-3 mr-1" />
                            Katıldı
                          </Badge>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Yönetim kurulu üyesi bulunamadı
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t">
                <Button
                  variant="outline"
                  onClick={() => setManualCheckInDialogOpen(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Kapat
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Guest Check-in Dialog */}
        <Dialog open={guestDialogOpen} onOpenChange={(open) => {
          setGuestDialogOpen(open);
          if (!open) {
            setSelectedGuestUserId('');
            setGuestSearchQuery('');
            setGuestDropdownOpen(false);
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-800">Misafir Katılımcı Ekle</DialogTitle>
              <DialogDescription className="text-gray-600">
                Yönetim kurulu dışından bir katılımcı ekleyin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              <div className="relative">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Kullanıcı</label>
                {usersData && usersData.length > 0 ? (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-between mt-2"
                      type="button"
                      onClick={() => setGuestDropdownOpen(!guestDropdownOpen)}
                    >
                      {selectedGuestUserId ? (
                        (() => {
                          const selectedUser = usersData.find((u) => u.id === selectedGuestUserId);
                          return selectedUser
                            ? (selectedUser.firstName && selectedUser.lastName
                              ? `${selectedUser.firstName} ${selectedUser.lastName}`
                              : selectedUser.username)
                            : 'Kullanıcı seçin...';
                        })()
                      ) : (
                        'Kullanıcı seçin...'
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>

                    {guestDropdownOpen && (
                      <div className="absolute z-[100] w-full mt-1 bg-popover border rounded-md shadow-md">
                        {/* Search Input */}
                        <div className="flex items-center border-b px-3 py-2">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          <Input
                            placeholder="Kullanıcı ara..."
                            value={guestSearchQuery}
                            onChange={(e) => setGuestSearchQuery(e.target.value)}
                            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9"
                            autoFocus
                          />
                        </div>

                        {/* User List */}
                        <div className="max-h-[300px] overflow-y-auto p-1">
                          {usersData
                            .filter((user) => {
                              if (!guestSearchQuery) return true;
                              const displayName = user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user.username;
                              const searchLower = guestSearchQuery.toLowerCase();
                              return (
                                displayName.toLowerCase().includes(searchLower) ||
                                user.username.toLowerCase().includes(searchLower) ||
                                (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
                                (user.lastName && user.lastName.toLowerCase().includes(searchLower))
                              );
                            })
                            .length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              Kullanıcı bulunamadı.
                            </div>
                          ) : (
                            usersData
                              .filter((user) => {
                                if (!guestSearchQuery) return true;
                                const displayName = user.firstName && user.lastName
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.username;
                                const searchLower = guestSearchQuery.toLowerCase();
                                return (
                                  displayName.toLowerCase().includes(searchLower) ||
                                  user.username.toLowerCase().includes(searchLower) ||
                                  (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
                                  (user.lastName && user.lastName.toLowerCase().includes(searchLower))
                                );
                              })
                              .map((user) => {
                                const isSelected = selectedGuestUserId === user.id;
                                const displayName = user.firstName && user.lastName
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.username;

                                return (
                                  <div
                                    key={user.id}
                                    className={cn(
                                      "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                                      "hover:bg-accent hover:text-accent-foreground",
                                      isSelected && "bg-accent text-accent-foreground"
                                    )}
                                    onClick={() => {
                                      setSelectedGuestUserId(user.id);
                                      setGuestDropdownOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4 flex-shrink-0",
                                        isSelected ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex-1">
                                      <p className="font-medium">{displayName}</p>
                                      <p className="text-xs text-muted-foreground">{user.username}</p>
                                    </div>
                                  </div>
                                );
                              })
                          )}
                        </div>
                      </div>
                    )}

                    {/* Click outside to close */}
                    {guestDropdownOpen && (
                      <div
                        className="fixed inset-0 z-[90]"
                        onClick={() => setGuestDropdownOpen(false)}
                      />
                    )}
                  </>
                ) : (
                  <Input
                    value={selectedGuestUserId}
                    onChange={(e) => setSelectedGuestUserId(e.target.value)}
                    placeholder="Kullanıcı ID"
                    className="mt-1"
                  />
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setGuestDialogOpen(false);
                    setSelectedGuestUserId('');
                    setGuestSearchQuery('');
                    setGuestDropdownOpen(false);
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  İptal
                </Button>
                <Button
                  onClick={handleGuestCheckIn}
                  disabled={!selectedGuestUserId || manualCheckIn.isPending}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/50"
                >
                  {manualCheckIn.isPending ? 'Ekleniyor...' : 'Ekle'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Decision Dialogs */}
        {isAdmin && (
          <CreateDecisionDialog
            open={createDecisionDialogOpen}
            onOpenChange={setCreateDecisionDialogOpen}
            onSubmit={handleCreateDecision}
          />
        )}

        {isAdmin && selectedDecision && (
          <EditDecisionDialog
            open={editDecisionDialogOpen}
            onOpenChange={setEditDecisionDialogOpen}
            decision={selectedDecision}
            onSubmit={handleEditDecision}
            isPending={updateDecision.isPending}
          />
        )}

        <AlertDialog open={deleteDecisionDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Kararı Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu kararı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={deleteDecision.isPending}
                onClick={() => {
                  setDeleteDecisionDialogOpen(false);
                  setSelectedDecisionId(null);
                }}
              >
                İptal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteDecisionConfirm}
                disabled={deleteDecision.isPending}
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteDecision.isPending ? 'Siliniyor...' : 'Sil'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* All Attendees Dialog */}
        <Dialog open={allAttendeesDialogOpen} onOpenChange={setAllAttendeesDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-800">Tüm Katılımcılar</DialogTitle>
              <DialogDescription className="text-gray-600">
                Toplantıya katılım sağlayan tüm katılımcılar ({attendance?.length || 0} kişi)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {attendanceLoading ? (
                <Loading message="Katılımcılar yükleniyor..." />
              ) : !attendance || attendance.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-1">Henüz katılımcı yok</p>
                  <p className="text-sm text-gray-500">Toplantıya katılım sağlayan kişiler burada görünecek</p>
                </div>
              ) : (
                attendance.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-semibold shadow-lg">
                        {a.user.firstName?.[0]?.toUpperCase() || a.user.username[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {a.user.firstName && a.user.lastName
                            ? `${a.user.firstName} ${a.user.lastName}`
                            : a.user.username}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(a.checkInTime), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={a.checkInMethod === 'QR'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-blue-200 bg-blue-50 text-blue-700'
                      }
                    >
                      {a.checkInMethod === 'QR' ? 'QR Kod' : 'Manuel'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {selectedDecisionForDetail && (
          <DecisionDetailDialog
            open={detailDecisionDialogOpen}
            onOpenChange={setDetailDecisionDialogOpen}
            decision={selectedDecisionForDetail}
            onEdit={() => {
              setDetailDecisionDialogOpen(false);
              setSelectedDecision(selectedDecisionForDetail);
              setEditDecisionDialogOpen(true);
            }}
            isAdmin={isAdmin || false}
          />
        )}
      </div>
    </div>
  );
}

// Decision Board Components
function StatusColumn({
  status,
  decisions,
  onEdit,
  onDelete,
  onView,
  isAdmin,
}: {
  status: DecisionStatus;
  decisions: DecisionWithUser[];
  onEdit: (decision: DecisionWithUser) => void;
  onDelete: (id: string) => void;
  onView: (decision: DecisionWithUser) => void;
  isAdmin: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const decisionStatusLabels: Record<DecisionStatus, string> = {
    TODO: 'Yapılacak',
    IN_PROGRESS: 'Devam',
    DONE: 'Tamam',
  };
  const decisionStatusColors: Record<DecisionStatus, string> = {
    TODO: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    DONE: 'bg-green-100 text-green-800',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
        <h3 className="font-semibold">{decisionStatusLabels[status]}</h3>
        <Badge className={decisionStatusColors[status]}>
          {decisions.length}
        </Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${isOver ? 'bg-indigo-50 border-2 border-indigo-300 border-dashed' : 'bg-gray-50'
          }`}
      >
        <SortableContext
          items={decisions.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {decisions.map((decision) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              onEdit={() => onEdit(decision)}
              onDelete={() => onDelete(decision.id)}
              onView={() => onView(decision)}
              isAdmin={isAdmin}
            />
          ))}
        </SortableContext>
        {decisions.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            Bu kolonda karar yok
          </div>
        )}
      </div>
    </div>
  );
}

function DecisionCard({
  decision,
  onEdit,
  onDelete,
  onView,
  isAdmin,
}: {
  decision: DecisionWithUser;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  isAdmin: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: decision.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-move hover:shadow-md transition-shadow"
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{decision.title}</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              className="text-gray-600 hover:text-gray-700"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {isAdmin && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        {decision.description && (
          <CardDescription>{decision.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {decision.responsibleUsers && decision.responsibleUsers.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <Users className="h-4 w-4 mr-2" />
                <span className="font-medium">Sorumlu Üyeler:</span>
              </div>
              {decision.responsibleUsers.map((user) => (
                <div key={user.id} className="text-sm text-gray-600 ml-6">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.username}
                </div>
              ))}
            </div>
          )}
          {decision.targetDate && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              {format(new Date(decision.targetDate as string), 'dd MMMM yyyy', { locale: tr })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Decision Dialog Components
function CreateDecisionDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    description: string | null;
    targetDate: string | null;
    responsibleUserIds: string[];
  }) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [adminUsers, setAdminUsers] = useState<BoardMemberUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load board members when dialog opens
  useEffect(() => {
    if (open) {
      setLoadingUsers(true);
      getBoardMembers().then((result) => {
        if (result.error === null && result.data) {
          const mappedBoardMembers: BoardMemberUser[] = result.data
            .filter((member) => member.isActive)
            .map((member) => ({
              id: member.user.id,
              username: member.user.username,
              firstName: member.user.firstName,
              lastName: member.user.lastName,
              boardMemberTitle: member.title,
              isActive: member.isActive,
            }));

          setAdminUsers(mappedBoardMembers);
        } else {
          setAdminUsers([]);
        }
        setLoadingUsers(false);
      }).catch(() => {
        setAdminUsers([]);
        setLoadingUsers(false);
      });
    } else {
      // Reset when closing
      setTitle('');
      setDescription('');
      setTargetDate('');
      setSelectedUserIds([]);
      setSearchQuery('');
      setComboboxOpen(false);
      setAdminUsers([]);
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  const handleSubmit = () => {
    if (!title.trim() || selectedUserIds.length === 0) return;
    onSubmit({
      title,
      description: description || null,
      targetDate: targetDate || null,
      responsibleUserIds: selectedUserIds,
    });
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Karar</DialogTitle>
          <DialogDescription>Toplantı için yeni bir karar ekleyin</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Başlık *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Karar başlığı"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Açıklama</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Karar açıklaması"
              rows={3}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Hedef Tarih</Label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="relative">
            <Label>Sorumlu Yönetim Kurulu Üyeleri *</Label>
            <Button
              variant="outline"
              className="w-full justify-between mt-2"
              type="button"
              onClick={() => setComboboxOpen(!comboboxOpen)}
            >
              {selectedUserIds.length > 0
                ? `${selectedUserIds.length} üye seçildi`
                : 'Üye seçin...'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {comboboxOpen && (
              <div className="absolute z-[100] w-full mt-1 bg-popover border rounded-md shadow-md">
                <div className="flex items-center border-b px-3 py-2">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <Input
                    placeholder="Üye ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9"
                    autoFocus
                  />
                </div>

                <div className="max-h-[300px] overflow-y-auto p-1">
                  {loadingUsers ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Yükleniyor...
                    </div>
                  ) : adminUsers.filter((user) => {
                    if (!searchQuery) return true;
                    const displayName = user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.username;
                    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
                  }).length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Üye bulunamadı.
                    </div>
                  ) : (
                    adminUsers
                      .filter((user) => {
                        if (!searchQuery) return true;
                        const displayName = user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.username;
                        return displayName.toLowerCase().includes(searchQuery.toLowerCase());
                      })
                      .map((user) => {
                        const isSelected = selectedUserIds.includes(user.id);
                        const displayName = user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.username;
                        return (
                          <div
                            key={user.id}
                            className={cn(
                              "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                              "hover:bg-accent hover:text-accent-foreground",
                              isSelected && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => {
                              handleUserToggle(user.id);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 flex-shrink-0",
                                isSelected ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="flex-1">{displayName}</span>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            )}

            {comboboxOpen && (
              <div
                className="fixed inset-0 z-[90]"
                onClick={() => setComboboxOpen(false)}
              />
            )}
            {selectedUserIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedUserIds.map((userId) => {
                  const user = adminUsers.find((u) => u.id === userId);
                  if (!user) return null;
                  const displayName = user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.username;
                  return (
                    <Badge
                      key={userId}
                      variant="secondary"
                      className="text-sm"
                    >
                      {displayName}
                      <button
                        type="button"
                        className="ml-2 hover:text-red-500"
                        onClick={() => handleUserToggle(userId)}
                      >
                        ×
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
            {selectedUserIds.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                En az bir sorumlu yönetim kurulu üyesi seçmelisiniz
              </p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || selectedUserIds.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Oluştur
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditDecisionDialog({
  open,
  onOpenChange,
  decision,
  onSubmit,
  isPending = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decision: DecisionWithUser;
  onSubmit: (data: {
    title: string;
    description: string | null;
    targetDate: string | null;
    responsibleUserIds: string[];
  }) => void;
  isPending?: boolean;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [adminUsers, setAdminUsers] = useState<BoardMemberUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Load board members when dialog opens
  useEffect(() => {
    if (open) {
      setTitle(decision?.title || '');
      setDescription(decision?.description || '');
      setTargetDate(
        decision?.targetDate ? format(new Date(decision.targetDate), 'yyyy-MM-dd') : ''
      );
      setSelectedUserIds(decision?.responsibleUsers?.map((u) => u.id) || []);
      setSearchQuery('');
      setComboboxOpen(false);
      setInitialized(true);
      setLoadingUsers(true);
      getBoardMembers().then((result) => {
        if (result.error === null && result.data) {
          const mappedBoardMembers: BoardMemberUser[] = result.data
            .filter((member) => member.isActive)
            .map((member) => ({
              id: member.user.id,
              username: member.user.username,
              firstName: member.user.firstName,
              lastName: member.user.lastName,
              boardMemberTitle: member.title,
              isActive: member.isActive,
            }));

          setAdminUsers(mappedBoardMembers);
        } else {
          setAdminUsers([]);
        }
        setLoadingUsers(false);
      }).catch(() => {
        setAdminUsers([]);
        setLoadingUsers(false);
      });
    } else {
      // Reset when closing
      setInitialized(false);
      setTitle('');
      setDescription('');
      setTargetDate('');
      setSelectedUserIds([]);
      setAdminUsers([]);
      setSearchQuery('');
      setComboboxOpen(false);
    }
  }, [open, decision]);

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  // Get current decision data (use prop if dialog is open and initialized, otherwise use state)
  const currentDecision = open && decision ? decision : null;
  const displayTitle = currentDecision?.title || title;
  const displayDescription = currentDecision?.description || description;
  const displayTargetDate = currentDecision?.targetDate
    ? format(new Date(currentDecision.targetDate), 'yyyy-MM-dd')
    : targetDate;
  const displayUserIds = currentDecision?.responsibleUsers?.map((u) => u.id) || selectedUserIds;

  const handleSubmit = () => {
    if (!title.trim() || selectedUserIds.length === 0) return;
    onSubmit({
      title,
      description: description || null,
      targetDate: targetDate || null,
      responsibleUserIds: selectedUserIds,
    });
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kararı Düzenle</DialogTitle>
          <DialogDescription>Karar bilgilerini güncelleyin</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Başlık *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Karar başlığı"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Açıklama</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Karar açıklaması"
              rows={3}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Hedef Tarih</Label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="relative">
            <Label>Sorumlu Yönetim Kurulu Üyeleri *</Label>
            <Button
              variant="outline"
              className="w-full justify-between mt-2"
              type="button"
              onClick={() => setComboboxOpen(!comboboxOpen)}
            >
              {selectedUserIds.length > 0
                ? `${selectedUserIds.length} üye seçildi`
                : 'Üye seçin...'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {comboboxOpen && (
              <div className="absolute z-[100] w-full mt-1 bg-popover border rounded-md shadow-md">
                <div className="flex items-center border-b px-3 py-2">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <Input
                    placeholder="Üye ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9"
                    autoFocus
                  />
                </div>

                <div className="max-h-[300px] overflow-y-auto p-1">
                  {loadingUsers ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Yükleniyor...
                    </div>
                  ) : adminUsers.filter((user) => {
                    if (!searchQuery) return true;
                    const displayName = user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.username;
                    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
                  }).length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Üye bulunamadı.
                    </div>
                  ) : (
                    adminUsers
                      .filter((user) => {
                        if (!searchQuery) return true;
                        const displayName = user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.username;
                        return displayName.toLowerCase().includes(searchQuery.toLowerCase());
                      })
                      .map((user) => {
                        const isSelected = selectedUserIds.includes(user.id);
                        const displayName = user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.username;
                        return (
                          <div
                            key={user.id}
                            className={cn(
                              "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                              "hover:bg-accent hover:text-accent-foreground",
                              isSelected && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => {
                              handleUserToggle(user.id);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 flex-shrink-0",
                                isSelected ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="flex-1">{displayName}</span>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            )}

            {comboboxOpen && (
              <div
                className="fixed inset-0 z-[90]"
                onClick={() => setComboboxOpen(false)}
              />
            )}
            {selectedUserIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedUserIds.map((userId) => {
                  const user = adminUsers.find((u) => u.id === userId);
                  if (!user) return null;
                  const displayName = user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.username;
                  return (
                    <Badge
                      key={userId}
                      variant="secondary"
                      className="text-sm"
                    >
                      {displayName}
                      <button
                        type="button"
                        className="ml-2 hover:text-red-500"
                        onClick={() => handleUserToggle(userId)}
                      >
                        ×
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
            {selectedUserIds.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                En az bir sorumlu yönetim kurulu üyesi seçmelisiniz
              </p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              İptal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || selectedUserIds.length === 0 || isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Güncelleniyor...' : 'Güncelle'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DecisionDetailDialog({
  open,
  onOpenChange,
  decision,
  onEdit,
  isAdmin,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decision: DecisionWithUser | { status: DecisionStatus;[key: string]: any };
  onEdit: () => void;
  isAdmin: boolean;
}) {
  const decisionStatusLabels: Record<DecisionStatus, string> = {
    TODO: 'Yapılacak',
    IN_PROGRESS: 'Devam',
    DONE: 'Tamam',
  };
  const decisionStatusColors: Record<DecisionStatus, string> = {
    TODO: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    DONE: 'bg-green-100 text-green-800',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{decision.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={decisionStatusColors[decision.status]}>
                  {decisionStatusLabels[decision.status]}
                </Badge>
              </div>
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="ml-4"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Düzenle
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {decision.description && (
            <div className="space-y-2">
              <div className="flex items-center text-sm font-semibold text-gray-700">
                <FileText className="h-4 w-4 mr-2" />
                Açıklama
              </div>
              <p className="text-gray-600 whitespace-pre-wrap pl-6">
                {decision.description}
              </p>
            </div>
          )}

          {decision.responsibleUsers && decision.responsibleUsers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center text-sm font-semibold text-gray-700">
                <Users className="h-4 w-4 mr-2" />
                Sorumlu Üyeler
              </div>
              <div className="space-y-2 pl-6">
                {decision.responsibleUsers.map((user: { id: string; username: string; firstName: string | null; lastName: string | null }) => (
                  <div key={user.id} className="flex items-center text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                      <Users className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span>
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.username}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {decision.targetDate && (
            <div className="space-y-2">
              <div className="flex items-center text-sm font-semibold text-gray-700">
                <Calendar className="h-4 w-4 mr-2" />
                Hedef Tarih
              </div>
              <p className="text-gray-600 pl-6">
                {format(new Date(decision.targetDate), 'dd MMMM yyyy', { locale: tr })}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                Oluşturulma Tarihi
              </div>
              <p className="text-sm text-gray-600">
                {format(new Date(decision.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
              </p>
            </div>
            {decision.updatedAt && new Date(decision.updatedAt).getTime() !== new Date(decision.createdAt).getTime() && (
              <div className="space-y-1">
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  Son Güncelleme
                </div>
                <p className="text-sm text-gray-600">
                  {format(new Date(decision.updatedAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

