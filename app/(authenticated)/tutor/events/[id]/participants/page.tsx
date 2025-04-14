'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Check,
  CheckCircle,
  ChevronLeft,
  GraduationCap,
  RefreshCw,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'next/navigation';

type Participant = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  status: 'REGISTERED' | 'ATTENDED' | 'ABSENT';
  registeredAt: string;
};

type Event = {
  id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  capacity: number;
  points: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
};

type Student = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  points: number;
};

export default function EventParticipantsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [changeStatusDialog, setChangeStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<'REGISTERED' | 'ATTENDED' | 'ABSENT'>('REGISTERED');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [addParticipantsDialog, setAddParticipantsDialog] = useState(false);
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [isAddingParticipants, setIsAddingParticipants] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);

  useEffect(() => {
    fetchEventAndParticipants();
    fetchStudents();
  }, [eventId]);

  const fetchEventAndParticipants = async () => {
    try {
      setLoading(true);

      // Fetch event details
      const eventResponse = await fetch(`/api/events/${eventId}`);
      if (!eventResponse.ok) {
        throw new Error('Etkinlik bilgileri yüklenirken bir hata oluştu');
      }
      const eventData = await eventResponse.json();
      setEvent(eventData.event);

      // Fetch participants
      const participantsResponse = await fetch(`/api/events/${eventId}/participants`);
      if (!participantsResponse.ok) {
        throw new Error('Katılımcı bilgileri yüklenirken bir hata oluştu');
      }
      const participantsData = await participantsResponse.json();
      setParticipants(participantsData.participants);

    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Hata",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/tutor/students');
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      setStudents(data.students || []);
    } catch (err: any) {
      console.error('Error fetching students:', err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Öğrenciler yüklenirken bir hata oluştu.",
      });
    }
  };

  const updateParticipantStatus = async (participantId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/participants/${participantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Katılımcı durumu güncellenirken bir hata oluştu');
      }

      // Refresh participants list
      fetchEventAndParticipants();

      toast({
        title: "Başarılı",
        description: "Katılımcı durumu güncellendi",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: err.message,
      });
    }
  };

  const removeParticipant = async (participantId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/participants?userId=${participantId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Katılımcı kaldırılırken bir hata oluştu');
      }

      // Refresh participants list
      fetchEventAndParticipants();

      toast({
        title: "Başarılı",
        description: "Katılımcı etkinlikten kaldırıldı",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: err.message,
      });
    }
  };

  const getFilteredParticipants = () => {
    return participants.filter(participant => {
      const matchesSearch = 
        participant.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (participant.firstName && participant.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (participant.lastName && participant.lastName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || participant.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredStudents = () => {
    return students.filter(student => {
      const searchMatch = 
        student.username.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
        (student.firstName && student.firstName.toLowerCase().includes(searchStudentQuery.toLowerCase())) ||
        (student.lastName && student.lastName.toLowerCase().includes(searchStudentQuery.toLowerCase()));
      
      // Also filter out students who are already participants
      const isNotParticipant = !participants.some(p => p.id === student.id);
      
      return searchMatch && isNotParticipant;
    });
  };

  const getInitials = (participant: Participant) => {
    if (participant.firstName && participant.lastName) {
      return `${participant.firstName[0]}${participant.lastName[0]}`.toUpperCase();
    } else if (participant.firstName) {
      return participant.firstName[0].toUpperCase();
    } else if (participant.lastName) {
      return participant.lastName[0].toUpperCase();
    } else {
      return participant.username[0].toUpperCase();
    }
  };

  const getFullName = (participant: Participant) => {
    if (participant.firstName && participant.lastName) {
      return `${participant.firstName} ${participant.lastName}`;
    } else if (participant.firstName) {
      return participant.firstName;
    } else if (participant.lastName) {
      return participant.lastName;
    } else {
      return participant.username;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REGISTERED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Kayıtlı</Badge>;
      case 'ATTENDED':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Katıldı</Badge>;
      case 'ABSENT':
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Katılmadı</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleChangeStatus = (participant: Participant) => {
    setSelectedParticipant(participant);
    setNewStatus(participant.status);
    setChangeStatusDialog(true);
  };

  const saveStatusChange = async () => {
    if (!selectedParticipant) return;
    
    try {
      // In a real app, send to API
      // Here, we'll just update the local state
      const updatedParticipants = participants.map(p => 
        p.id === selectedParticipant.id ? { ...p, status: newStatus } : p
      );
      
      setParticipants(updatedParticipants);
      
      toast({
        title: "Durum güncellendi",
        description: `${selectedParticipant.username} için katılım durumu güncellendi.`,
      });
      
      setChangeStatusDialog(false);
    } catch (error) {
      console.error('Error updating participant status:', error);
      toast({
        title: "Hata",
        description: "Katılımcı durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleExportParticipants = () => {
    // In a real app, generate CSV/Excel file and download
    toast({
      title: "Katılımcılar dışa aktarıldı",
      description: "Katılımcı listesi başarıyla dışa aktarıldı.",
    });
  };

  const handleAddParticipants = async () => {
    try {
      setIsAddingParticipants(true);
      
      // Add each selected student as a participant
      for (const studentId of selectedStudents) {
        const response = await fetch(`/api/events/${eventId}/participants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: studentId }),
        });

        if (!response.ok) {
          throw new Error('Failed to add participant');
        }
      }

      // Refresh participants list
      await fetchEventAndParticipants();
      
      // Reset selection
      setSelectedStudents([]);
      setAddParticipantsDialog(false);
      
      toast({
        title: "Başarılı",
        description: "Seçilen öğrenciler etkinliğe eklendi.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Katılımcılar eklenirken bir hata oluştu.",
      });
    } finally {
      setIsAddingParticipants(false);
    }
  };

  const getStudentInitials = (student: Student) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
    } else if (student.firstName) {
      return student.firstName[0].toUpperCase();
    } else if (student.lastName) {
      return student.lastName[0].toUpperCase();
    } else {
      return student.username[0].toUpperCase();
    }
  };

  const getStudentFullName = (student: Student) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    } else if (student.firstName) {
      return student.firstName;
    } else if (student.lastName) {
      return student.lastName;
    } else {
      return student.username;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p>{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/tutor/events')}
            >
              Etkinliklere Dön
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const filteredParticipants = getFilteredParticipants();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/tutor/events/${eventId}`}>
              <Button variant="ghost" size="sm" className="text-gray-500">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Geri Dön
              </Button>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <Users className="mr-2 h-8 w-8 text-blue-600" />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Katılımcılar
                </span>
              </h1>
              <p className="text-gray-500 mt-1">
                {event.title}
              </p>
            </div>
            <Dialog open={addParticipantsDialog} onOpenChange={setAddParticipantsDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Katılımcı Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Katılımcı Ekle</DialogTitle>
                  <DialogDescription>
                    Etkinliğe eklemek istediğiniz öğrencileri seçin.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder="Öğrenci ara..."
                    value={searchStudentQuery}
                    onChange={(e) => setSearchStudentQuery(e.target.value)}
                    className="mb-4"
                  />
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {getFilteredStudents().map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg"
                      >
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={(checked) => {
                            setSelectedStudents(prev =>
                              checked
                                ? [...prev, student.id]
                                : prev.filter(id => id !== student.id)
                            );
                          }}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-50 text-blue-600">
                            {getStudentInitials(student)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{getStudentFullName(student)}</div>
                          <div className="text-sm text-gray-500">{student.username}</div>
                        </div>
                      </div>
                    ))}
                    {getFilteredStudents().length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        Eklenebilecek öğrenci bulunamadı.
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setAddParticipantsDialog(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleAddParticipants}
                    disabled={selectedStudents.length === 0 || isAddingParticipants}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    {isAddingParticipants ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Ekleniyor...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {selectedStudents.length} Öğrenci Ekle
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Toplam Katılımcı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-6 w-6 text-blue-600 mr-2" />
                <span className="text-2xl font-bold">{participants.length} / {event.capacity}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Katılım Oranı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                <span className="text-2xl font-bold">
                  {participants.length > 0
                    ? Math.round((participants.filter(p => p.status === 'ATTENDED').length / participants.length) * 100)
                    : 0}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Kazanılan Puan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <GraduationCap className="h-6 w-6 text-purple-600 mr-2" />
                <span className="text-2xl font-bold">{event.points}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Katılımcı ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Durum Filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="REGISTERED">Kayıtlı</SelectItem>
                <SelectItem value="ATTENDED">Katıldı</SelectItem>
                <SelectItem value="ABSENT">Katılmadı</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Participants List */}
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {filteredParticipants.length > 0 ? (
            filteredParticipants.map((participant) => (
              <div key={participant.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-50 text-blue-600">
                        {getInitials(participant)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{getFullName(participant)}</div>
                      <div className="text-sm text-gray-500">{participant.username}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(participant.status)}
                    
                    <Select
                      value={participant.status}
                      onValueChange={(value) => updateParticipantStatus(participant.id, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REGISTERED">Kayıtlı</SelectItem>
                        <SelectItem value="ATTENDED">Katıldı</SelectItem>
                        <SelectItem value="ABSENT">Katılmadı</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setParticipantToDelete(participant)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="mx-auto rounded-full bg-gray-100 w-12 h-12 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Katılımcı Bulunamadı</h3>
              <p className="text-gray-500 mb-4">Bu etkinlik için henüz katılımcı bulunmuyor.</p>
              <Link href={`/tutor/events/${eventId}/participants/add`}>
                <Button variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Katılımcı Ekle
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!participantToDelete} onOpenChange={(open: boolean) => !open && setParticipantToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Katılımcıyı Kaldır</AlertDialogTitle>
              <AlertDialogDescription>
                {participantToDelete && (
                  <>
                    <span className="font-medium">{getFullName(participantToDelete)}</span> adlı katılımcıyı etkinlikten kaldırmak istediğinize emin misiniz?
                    <br />
                    Bu işlem geri alınamaz.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  if (participantToDelete) {
                    removeParticipant(participantToDelete.id);
                    setParticipantToDelete(null);
                  }
                }}
              >
                Kaldır
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      <Dialog open={changeStatusDialog} onOpenChange={setChangeStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Katılım Durumu Değiştir</DialogTitle>
            <DialogDescription>
              {selectedParticipant?.username} için katılım durumunu değiştir.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REGISTERED">Kayıtlı</SelectItem>
                  <SelectItem value="ATTENDED">Katıldı</SelectItem>
                  <SelectItem value="ABSENT">Katılmadı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeStatusDialog(false)}>
              İptal
            </Button>
            <Button onClick={saveStatusChange}>
              Değişiklikleri Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 