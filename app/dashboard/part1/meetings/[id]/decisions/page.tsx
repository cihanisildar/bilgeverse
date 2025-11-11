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
import { ArrowLeft, Plus, Edit2, Trash2, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import Loading from '@/app/components/Loading';

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
  isAdmin,
}: {
  status: DecisionStatus;
  decisions: any[];
  onEdit: (decision: any) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
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
        className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
          isOver ? 'bg-indigo-50 border-2 border-indigo-300 border-dashed' : 'bg-gray-50'
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
  isAdmin,
}: {
  decision: any;
  onEdit: () => void;
  onDelete: () => void;
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
          {isAdmin && (
            <div className="flex space-x-2">
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
            </div>
          )}
        </div>
        {decision.description && (
          <CardDescription>{decision.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {decision.responsibleUser && (
            <div className="flex items-center text-sm text-gray-600">
              <User className="h-4 w-4 mr-2" />
              {decision.responsibleUser.firstName && decision.responsibleUser.lastName
                ? `${decision.responsibleUser.firstName} ${decision.responsibleUser.lastName}`
                : decision.responsibleUser.username}
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

  const handleDelete = async (id: string) => {
    if (confirm('Bu kararı silmek istediğinizden emin misiniz?')) {
      await deleteDecision.mutateAsync(id);
    }
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
          collisionDetection={closestCorners}
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
                onDelete={handleDelete}
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

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({ title, description: description || null, targetDate: targetDate || null });
    setTitle('');
    setDescription('');
    setTargetDate('');
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
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim()}
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decision: any;
  onSubmit: (data: any) => void;
}) {
  const [title, setTitle] = useState(decision?.title || '');
  const [description, setDescription] = useState(decision?.description || '');
    const [targetDate, setTargetDate] = useState(
      decision?.targetDate ? format(new Date(decision.targetDate as string), 'yyyy-MM-dd') : ''
    );

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({ title, description: description || null, targetDate: targetDate || null });
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
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Güncelle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

