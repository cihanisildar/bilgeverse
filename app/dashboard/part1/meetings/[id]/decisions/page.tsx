'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useMeeting } from '@/app/hooks/use-meetings';
import {
  useMeetingDecisions,
  useCreateDecision,
  useUpdateDecision,
  useUpdateDecisionStatus,
  useDeleteDecision,
} from '@/app/hooks/use-decisions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit2, Trash2, User, Calendar, Check, ChevronsUpDown, Search, X, Clock, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { getAdminUsers } from '@/app/actions/users';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DecisionStatus } from '@prisma/client';
import Loading from '@/app/components/Loading';
import { DecisionWithUser } from '@/app/types/meetings';

const statusColumns: DecisionStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
const statusLabels: Record<DecisionStatus, string> = {
  TODO: 'Yapılacak',
  IN_PROGRESS: 'Devam',
  DONE: 'Tamam',
};

const statusColors: Record<DecisionStatus, string> = {
  TODO: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  DONE: 'bg-green-100 text-green-800',
};

function StatusColumn({
  status,
  decisions,
  onEdit,
  onDelete,
  onView,
  isAdmin,
}: {
  status: DecisionStatus;
  decisions: any[];
  onEdit: (decision: any) => void;
  onDelete: (id: string) => void;
  onView: (decision: any) => void;
  isAdmin: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: 'column',
      status,
      accepts: ['TODO', 'IN_PROGRESS', 'DONE'], // Accept items from any status
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
        <h3 className="font-semibold">{statusLabels[status]}</h3>
        <Badge className={statusColors[status]}>
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
  decision: any;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  isAdmin: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: decision.id,
    data: {
      type: 'decision',
      status: decision.status,
    },
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
                <User className="h-4 w-4 mr-2" />
                <span className="font-medium">Sorumlu Üyeler:</span>
              </div>
              {decision.responsibleUsers.map((user: any) => (
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

export default function DecisionsPage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = params.id as string;
  const { user, isAdmin } = useAuth();
  const { data: meeting } = useMeeting(meetingId);
  const { data: decisions, isLoading } = useMeetingDecisions(meetingId);
  const createDecision = useCreateDecision();
  const updateDecision = useUpdateDecision();
  const updateStatus = useUpdateDecisionStatus();
  const deleteDecision = useDeleteDecision();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedDecisionForDetail, setSelectedDecisionForDetail] = useState<any>(null);

  // Reset dialog state when it closes
  useEffect(() => {
    if (!deleteDialogOpen) {
      setSelectedDecisionId(null);
    }
  }, [deleteDialogOpen]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const decisionsByStatus = {
    TODO: decisions?.filter((d) => d.status === 'TODO') || [],
    IN_PROGRESS: decisions?.filter((d) => d.status === 'IN_PROGRESS') || [],
    DONE: decisions?.filter((d) => d.status === 'DONE') || [],
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const decisionId = active.id as string;
    const newStatus = over.id as DecisionStatus;

    if (statusColumns.includes(newStatus)) {
      // Optimistically update local state immediately
      const decision = decisions?.find((d) => d.id === decisionId);
      if (decision && decision.status !== newStatus) {
        // Update the decision status immediately for instant UI feedback
        updateStatus.mutate({ id: decisionId, status: newStatus });
      }
    }
  };

  const handleCreate = async (data: any) => {
    await createDecision.mutateAsync({ meetingId, data });
    setCreateDialogOpen(false);
  };

  const handleEdit = async (data: any) => {
    if (selectedDecision) {
      await updateDecision.mutateAsync({ id: selectedDecision.id, data });
      setEditDialogOpen(false);
      setSelectedDecision(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setSelectedDecisionId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedDecisionId) return;

    // Ensure we pass a plain string
    const decisionId = String(selectedDecisionId);

    // Use mutate instead of mutateAsync to avoid serialization issues
    deleteDecision.mutate(decisionId, {
      onSuccess: (result) => {
        // Only close dialog if deletion was successful (no error)
        if (result && !result.error) {
          setDeleteDialogOpen(false);
          setSelectedDecisionId(null);
        }
      },
    });
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/part1/meetings/${meetingId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
          {isAdmin && (
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Karar
            </Button>
          )}
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{meeting?.title} - Kararlar</CardTitle>
            <CardDescription>Toplantı kararlarını takip edin</CardDescription>
          </CardHeader>
        </Card>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statusColumns.map((status) => (
              <StatusColumn
                key={status}
                status={status}
                decisions={decisionsByStatus[status]}
                onEdit={(decision) => {
                  setSelectedDecision(decision);
                  setEditDialogOpen(true);
                }}
                onDelete={handleDeleteClick}
                onView={(decision) => {
                  setSelectedDecisionForDetail(decision);
                  setDetailDialogOpen(true);
                }}
                isAdmin={isAdmin || false}
              />
            ))}
          </div>
          <DragOverlay>
            {activeId ? (
              <Card className="opacity-50">
                <CardHeader>
                  <CardTitle>
                    {decisions?.find((d) => d.id === activeId)?.title}
                  </CardTitle>
                </CardHeader>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Create Decision Dialog */}
        {isAdmin && (
          <CreateDecisionDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onSubmit={handleCreate}
          />
        )}

        {/* Edit Decision Dialog */}
        {isAdmin && selectedDecision && (
          <EditDecisionDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            decision={selectedDecision}
            onSubmit={handleEdit}
            isPending={updateDecision.isPending}
          />
        )}

        {/* Delete Decision Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
                  setDeleteDialogOpen(false);
                  setSelectedDecisionId(null);
                }}
              >
                İptal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleteDecision.isPending}
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteDecision.isPending ? 'Siliniyor...' : 'Sil'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Decision Detail Dialog */}
        {selectedDecisionForDetail && (
          <DecisionDetailDialog
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
            decision={selectedDecisionForDetail}
            onEdit={() => {
              setDetailDialogOpen(false);
              setSelectedDecision(selectedDecisionForDetail);
              setEditDialogOpen(true);
            }}
            isAdmin={isAdmin || false}
          />
        )}
      </div>
    </div>
  );
}

function CreateDecisionDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      setLoadingUsers(true);
      getAdminUsers().then((result) => {
        if (result.error === null && result.data) {
          setAdminUsers(result.data);
        }
        setLoadingUsers(false);
      });
    } else {
      // Reset form when dialog closes
      setTitle('');
      setDescription('');
      setTargetDate('');
      setSelectedUserIds([]);
      setSearchQuery('');
      setComboboxOpen(false);
    }
  }, [open]);

  const handleSubmit = () => {
    if (!title.trim() || selectedUserIds.length === 0) return;
    onSubmit({
      title,
      description: description || null,
      targetDate: targetDate || null,
      responsibleUserIds: selectedUserIds,
    });
    setTitle('');
    setDescription('');
    setTargetDate('');
    setSelectedUserIds([]);
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                {/* Search Input */}
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

                {/* User List */}
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

            {/* Click outside to close */}
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
  decision: any;
  onSubmit: (data: any) => void;
  isPending?: boolean;
}) {
  const [title, setTitle] = useState(decision?.title || '');
  const [description, setDescription] = useState(decision?.description || '');
  const [targetDate, setTargetDate] = useState(
    decision?.targetDate ? format(new Date(decision.targetDate as string), 'yyyy-MM-dd') : ''
  );
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    decision?.responsibleUsers?.map((u: any) => u.id) || []
  );
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(decision?.title || '');
      setDescription(decision?.description || '');
      setTargetDate(
        decision?.targetDate ? format(new Date(decision.targetDate as string), 'yyyy-MM-dd') : ''
      );
      setSelectedUserIds(decision?.responsibleUsers?.map((u: any) => u.id) || []);
      setSearchQuery('');
      setComboboxOpen(false);
      setLoadingUsers(true);
      getAdminUsers().then((result) => {
        if (result.error === null && result.data) {
          setAdminUsers(result.data);
        }
        setLoadingUsers(false);
      });
    }
  }, [open, decision]);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                {/* Search Input */}
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

                {/* User List */}
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

            {/* Click outside to close */}
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{decision.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={statusColors[decision.status]}>
                  {statusLabels[decision.status]}
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
          {/* Description */}
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

          {/* Responsible Users */}
          {decision.responsibleUsers && decision.responsibleUsers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center text-sm font-semibold text-gray-700">
                <User className="h-4 w-4 mr-2" />
                Sorumlu Üyeler
              </div>
              <div className="space-y-2 pl-6">
                {decision.responsibleUsers.map((user: any) => (
                  <div key={user.id} className="flex items-center text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                      <User className="h-4 w-4 text-indigo-600" />
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

          {/* Target Date */}
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

          {/* Created and Updated Dates */}
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

