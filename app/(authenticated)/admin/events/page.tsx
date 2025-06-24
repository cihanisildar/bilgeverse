'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, 
  Edit, 
  Loader2, 
  Search, 
  Trash, 
  User, 
  X, 
  Users, 
  MapPin, 
  Clock, 
  Star,
  Eye,
  Tag,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { EventCardSkeleton, HeaderSkeleton, SearchFilterSkeleton } from '../../../components/ui/skeleton-shimmer';

type Event = {
  id: string;
  title: string;
  description: string;
  startDateTime: string;
  location: string;
  type: 'YUZ_YUZE' | 'ONLINE';
  capacity: number;
  points: number;
  experience: number;
  tags: string[];
  createdBy: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  status: 'YAKINDA' | 'DEVAM_EDIYOR' | 'TAMAMLANDI' | 'IPTAL_EDILDI';
  eventScope: 'GLOBAL' | 'GROUP';
  createdAt: string;
  enrolledStudents?: number;
};

type Tutor = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
};

export default function AdminEventsPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [tutorFilter, setTutorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    location: '',
    type: 'YUZ_YUZE' as 'YUZ_YUZE' | 'ONLINE',
    capacity: 20,
    points: 0,
    experience: 0,
    eventScope: 'GLOBAL' as 'GLOBAL' | 'GROUP',
    tags: [] as string[],
    createdForTutorId: ''
  });
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    createdForTutorId: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; eventId: string; title: string }>({
    isOpen: false,
    eventId: '',
    title: ''
  });
  const [initialEventScope, setInitialEventScope] = useState<'GLOBAL' | 'GROUP'>('GLOBAL');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user || !isAdmin) {
        throw new Error('Unauthorized access');
      }

      const response = await fetch('/api/events', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data.events || []);
      setFilteredEvents(data.events || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTutors = async () => {
    try {
      console.log('Fetching tutors...');
      const response = await fetch('/api/admin/tutors', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Tutor fetch error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch tutors');
      }

      const data = await response.json();
      console.log('Fetched tutors data:', data);
      
      if (!data.tutors || !Array.isArray(data.tutors)) {
        throw new Error('Invalid tutor data received');
      }
      
      setTutors(data.tutors);
    } catch (err: any) {
      console.error('Error fetching tutors:', err);
      toast.error('Eğitmenler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      setTutors([]); // Set empty array to prevent undefined errors
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchTutors();
    }
  }, [user]);

  useEffect(() => {
    let filtered = [...events];
    
    if (searchQuery) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (dateFilter) {
      filtered = filtered.filter(event => 
        event.startDateTime.includes(dateFilter)
      );
    }

    if (scopeFilter !== 'all') {
      filtered = filtered.filter(event => 
        event.eventScope === scopeFilter
      );
    }

    if (tutorFilter !== 'all') {
      filtered = filtered.filter(event => 
        event.createdBy.username === tutorFilter
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => 
        event.status === statusFilter
      );
    }
    
    setFilteredEvents(filtered);
  }, [events, searchQuery, dateFilter, scopeFilter, tutorFilter, statusFilter]);

  useEffect(() => {
    if (isModalOpen) {
      console.log('Modal opened with initialEventScope:', initialEventScope);
      setEventForm(prev => {
        const newForm = {
          ...prev,
          eventScope: initialEventScope,
          createdForTutorId: initialEventScope === 'GROUP' ? '' : prev.createdForTutorId
        };
        console.log('Updated event form:', newForm);
        return newForm;
      });
    }
  }, [isModalOpen, initialEventScope]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleDateFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateFilter(e.target.value);
  };

  const handleDeleteEvent = async (eventId: string, title: string) => {
    setDeleteDialog({
      isOpen: true,
      eventId,
      title
    });
  };

  const confirmDelete = async () => {
    try {
      const loadingToast = toast.loading('Etkinlik siliniyor...');
      
      const response = await fetch(`/api/events/${deleteDialog.eventId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Etkinlik silinirken bir hata oluştu');
      }
      
      // Remove event from state
      setEvents(events.filter(event => event.id !== deleteDialog.eventId));
      setFilteredEvents(filteredEvents.filter(event => event.id !== deleteDialog.eventId));
      
      toast.dismiss(loadingToast);
      toast.success(`"${deleteDialog.title}" etkinliği başarıyla silindi`);
    } catch (error) {
      console.error('Delete event error:', error);
      toast.error((error as Error).message || 'Etkinlik silinirken bir hata oluştu');
    } finally {
      setDeleteDialog({ isOpen: false, eventId: '', title: '' });
    }
  };

  const openAddEventModal = () => {
    console.log('Opening add event modal with scope:', initialEventScope);
    setCurrentEventId(null);
    setEventForm({
      title: '',
      description: '',
      startDate: '',
      startTime: '',
      location: '',
      type: 'YUZ_YUZE',
      capacity: 20,
      points: 0,
      experience: 0,
      eventScope: initialEventScope,
      tags: [],
      createdForTutorId: ''
    });
    setFormErrors({
      title: '',
      description: '',
      startDate: '',
      startTime: '',
      createdForTutorId: ''
    });
    setIsModalOpen(true);
  };

  const openEditEventModal = (event: Event) => {
    setCurrentEventId(event.id);
    setEventForm({
      title: event.title,
      description: event.description,
      startDate: event.startDateTime.split('T')[0],
      startTime: event.startDateTime.split('T')[1],
      location: event.location,
      type: event.type,
      capacity: event.capacity,
      points: event.points,
      experience: event.experience || 0,
      eventScope: event.eventScope,
      tags: event.tags,
      createdForTutorId: ''
    });
    setFormErrors({
      title: '',
      description: '',
      startDate: '',
      startTime: '',
      createdForTutorId: ''
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // If points are being changed, update experience to match (unless user has manually set experience)
    if (name === 'points') {
      const numericValue = Number(value) || 0;
      setEventForm(prev => ({
        ...prev,
        points: numericValue,
        experience: numericValue // Auto-sync XP with points
      }));
    } else if (name === 'experience' || name === 'capacity') {
      // Handle numeric fields
      const numericValue = Number(value) || 0;
      setEventForm(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setEventForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for the field being edited
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {
      title: '',
      description: '',
      startDate: '',
      startTime: '',
      createdForTutorId: ''
    };
    let isValid = true;
    
    if (!eventForm.title.trim()) {
      errors.title = 'Başlık gereklidir';
      isValid = false;
    }
    
    if (!eventForm.description.trim()) {
      errors.description = 'Açıklama gereklidir';
      isValid = false;
    }
    
    if (!eventForm.startDate) {
      errors.startDate = 'Başlangıç tarihi gereklidir';
      isValid = false;
    }

    if (!eventForm.startTime) {
      errors.startTime = 'Başlangıç saati gereklidir';
      isValid = false;
    }

    if (eventForm.eventScope === 'GROUP' && !eventForm.createdForTutorId) {
      errors.createdForTutorId = 'Eğitmen seçimi gereklidir';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setFormSubmitting(true);
      
      if (!user || !isAdmin) {
        throw new Error('Unauthorized: Only admin users can create events');
      }
      
      const startDateTime = new Date(`${eventForm.startDate}T${eventForm.startTime}`).toISOString();
      
      const eventData = {
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        startDateTime,
        location: eventForm.location?.trim() || 'Online',
        type: eventForm.type,
        capacity: Number(eventForm.capacity),
        points: Number(eventForm.points),
        experience: Number(eventForm.experience),
        eventScope: eventForm.eventScope,
        status: 'YAKINDA',
        tags: eventForm.tags || [],
        createdForTutorId: eventForm.eventScope === 'GROUP' ? eventForm.createdForTutorId : undefined
      };
      
      console.log('Submitting event data:', eventData);
      
      const method = currentEventId ? 'PUT' : 'POST';
      const url = currentEventId ? `/api/events/${currentEventId}` : '/api/events';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData),
        credentials: 'include'
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || responseData.details || 'Etkinlik kaydedilirken bir hata oluştu');
      }
      
      // Fetch fresh events data after successful creation/update
      await fetchEvents();
      
      setIsModalOpen(false);
      toast.success(currentEventId ? 'Etkinlik başarıyla güncellendi' : 'Etkinlik başarıyla oluşturuldu');
    } catch (err: any) {
      console.error('Save event error:', err);
      toast.error(err.message || 'Etkinlik kaydedilirken bir hata oluştu');
    } finally {
      setFormSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'YAKINDA':
        return <Clock className="h-4 w-4" />;
      case 'DEVAM_EDIYOR':
        return <PlayCircle className="h-4 w-4" />;
      case 'TAMAMLANDI':
        return <CheckCircle className="h-4 w-4" />;
      case 'IPTAL_EDILDI':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'YAKINDA':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DEVAM_EDIYOR':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'TAMAMLANDI':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'IPTAL_EDILDI':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'YAKINDA':
        return 'Yakında';
      case 'DEVAM_EDIYOR':
        return 'Devam Ediyor';
      case 'TAMAMLANDI':
        return 'Tamamlandı';
      case 'IPTAL_EDILDI':
        return 'İptal Edildi';
      default:
        return 'Yakında';
    }
  };

  const openDetailsModal = (event: Event) => {
    setSelectedEvent(event);
    setIsDetailsModalOpen(true);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        <HeaderSkeleton />
        <SearchFilterSkeleton />
        
        {/* Events Grid */}
        <div className="grid gap-6">
          {[1, 2, 3, 4].map((i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-red-200 text-red-700 p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <XCircle className="h-8 w-8 mr-3 text-red-500" />
            <h3 className="text-lg font-semibold">Bir Hata Oluştu</h3>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Sayfayı Yenile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-center" />
      
      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialog.isOpen} 
        onOpenChange={(isOpen: boolean) => setDeleteDialog(prev => ({ ...prev, isOpen }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash className="h-5 w-5 text-red-500" />
              Etkinliği Sil
            </DialogTitle>
            <DialogDescription>
              <strong>&quot;{deleteDialog.title}&quot;</strong> etkinliğini silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm katılımcı verileri silinecektir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ isOpen: false, eventId: '', title: '' })}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              <Trash className="h-4 w-4 mr-2" />
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-bold mb-2">
                      {selectedEvent.title}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant={selectedEvent.eventScope === 'GLOBAL' ? 'default' : 'secondary'}>
                        {selectedEvent.eventScope === 'GLOBAL' ? 'Genel Etkinlik' : 'Grup Etkinliği'}
                      </Badge>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedEvent.status)}`}>
                        {getStatusIcon(selectedEvent.status)}
                        {getStatusText(selectedEvent.status)}
                      </div>
                      <Badge variant={selectedEvent.type === 'ONLINE' ? 'outline' : 'secondary'}>
                        {selectedEvent.type === 'ONLINE' ? 'Online' : 'Yüz Yüze'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h4 className="font-semibold mb-2">Açıklama</h4>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {selectedEvent.description}
                  </p>
                </div>

                {/* Event Details Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">Tarih ve Saat</p>
                        <p className="text-blue-700">
                          {formatDateTime(selectedEvent.startDateTime).date} • {formatDateTime(selectedEvent.startDateTime).time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <MapPin className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Konum</p>
                        <p className="text-green-700">{selectedEvent.location || 'Belirtilmemiş'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-purple-900">Katılımcılar</p>
                        <p className="text-purple-700">
                          {selectedEvent.enrolledStudents || 0} / {selectedEvent.capacity} kişi
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <Star className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-900">Ödüller</p>
                        <p className="text-orange-700">
                          {selectedEvent.points === (selectedEvent.experience || 0) 
                            ? `${selectedEvent.points} puan/XP` 
                            : `${selectedEvent.points} puan • ${selectedEvent.experience || 0} XP`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Oluşturan</p>
                        <p className="text-gray-700">
                          {selectedEvent.createdBy.firstName && selectedEvent.createdBy.lastName 
                            ? `${selectedEvent.createdBy.firstName} ${selectedEvent.createdBy.lastName}`
                            : selectedEvent.createdBy.username}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-indigo-600" />
                      <div>
                        <p className="font-medium text-indigo-900">Oluşturulma Tarihi</p>
                        <p className="text-indigo-700">
                          {new Date(selectedEvent.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Etiketler
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                  Kapat
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsDetailsModalOpen(false);
                  openEditEventModal(selectedEvent);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Düzenle
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="px-4 py-16">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex-1">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Etkinlik Yönetimi
              </h1>
              <p className="text-xl text-blue-100 mb-2">
                Tüm etkinlikleri yönetin ve kontrol edin
              </p>
              <div className="flex items-center gap-6 text-blue-200">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>{events.length} Toplam Etkinlik</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>{filteredEvents.length} Filtrelenmiş</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => {
                  setInitialEventScope('GLOBAL');
                  openAddEventModal();
                }} 
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Genel Etkinlik Oluştur
              </Button>
              <Button 
                onClick={() => {
                  setInitialEventScope('GROUP');
                  openAddEventModal();
                }} 
                size="lg"
                className="bg-blue-500 text-white hover:bg-blue-600 border border-blue-400 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Users className="h-5 w-5 mr-2" />
                Grup İçi Etkinlik Oluştur
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 -mt-8 pb-8">
        {/* Enhanced Search and Filter Card */}
        <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Etkinlik ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
              <Select value={scopeFilter} onValueChange={setScopeFilter}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Tür" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Türler</SelectItem>
                  <SelectItem value="GLOBAL">Genel</SelectItem>
                  <SelectItem value="GROUP">Grup</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="YAKINDA">Yakında</SelectItem>
                  <SelectItem value="DEVAM_EDIYOR">Devam Ediyor</SelectItem>
                  <SelectItem value="TAMAMLANDI">Tamamlandı</SelectItem>
                  <SelectItem value="IPTAL_EDILDI">İptal Edildi</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tutorFilter} onValueChange={setTutorFilter}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Eğitmen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Eğitmenler</SelectItem>
                  {tutors.map(tutor => (
                    <SelectItem key={tutor.id} value={tutor.username}>
                      {tutor.firstName && tutor.lastName 
                        ? `${tutor.firstName} ${tutor.lastName}`
                        : tutor.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Events Grid */}
        <div className="grid gap-6">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="mx-auto w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                <Calendar className="h-16 w-16 text-blue-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                {events.length === 0 ? 'Henüz Etkinlik Yok' : 'Etkinlik Bulunamadı'}
              </h3>
              <p className="text-gray-500 text-lg max-w-md mx-auto">
                {events.length === 0 
                  ? "İlk etkinliğinizi oluşturmak için yukarıdaki butonları kullanın." 
                  : "Arama kriterlerinize uygun etkinlik bulunamadı. Filtreleri değiştirmeyi deneyin."}
              </p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <Card key={event.id} className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-600"></div>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge 
                          variant={event.eventScope === 'GLOBAL' ? 'default' : 'secondary'}
                          className="text-xs font-medium"
                        >
                          {event.eventScope === 'GLOBAL' ? 'Genel' : 'Grup'}
                        </Badge>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
                          {getStatusIcon(event.status)}
                          {getStatusText(event.status)}
                        </div>
                        <Badge variant={event.type === 'ONLINE' ? 'outline' : 'secondary'} className="text-xs">
                          {event.type === 'ONLINE' ? 'Online' : 'Yüz Yüze'}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {event.title}
                      </CardTitle>
                      <p className="text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatDateTime(event.startDateTime).date}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {formatDateTime(event.startDateTime).time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium text-gray-900 truncate">
                          {event.location || 'Online'}
                        </p>
                        <p className="text-gray-500 text-xs">Konum</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {event.enrolledStudents || 0}/{event.capacity}
                        </p>
                        <p className="text-gray-500 text-xs">Katılımcı</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {event.points === (event.experience || 0) 
                            ? `${event.points} Puan/XP` 
                            : `${event.points}P / ${event.experience || 0}XP`}
                        </p>
                        <p className="text-gray-500 text-xs">Ödüller</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User className="h-4 w-4" />
                        <span>
                          {event.createdBy.firstName && event.createdBy.lastName 
                            ? `${event.createdBy.firstName} ${event.createdBy.lastName}`
                            : event.createdBy.username}
                        </span>
                      </div>
                      
                      {event.tags && event.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {event.tags.length} etiket
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2 bg-gray-50 py-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => openDetailsModal(event)}
                    className="flex-1 hover:bg-blue-100 hover:text-blue-700"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Detaylar
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => openEditEventModal(event)}
                    className="flex-1 hover:bg-amber-100 hover:text-amber-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Düzenle
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteEvent(event.id, event.title)}
                    className="flex-1 hover:bg-red-100 hover:text-red-700"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Sil
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  {currentEventId ? 'Etkinliği Düzenle' : eventForm.eventScope === 'GLOBAL' ? 'Yeni Genel Etkinlik' : 'Grup İçi Etkinlik'}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="text-white hover:bg-white/20">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleSubmitEvent}>
                <div className="space-y-6">
                  {eventForm.eventScope === 'GROUP' && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="text-sm font-semibold text-blue-900 mb-2 block">Eğitmen Seç *</label>
                      <Select
                        value={eventForm.createdForTutorId}
                        onValueChange={(value) => {
                          setEventForm(prev => ({ ...prev, createdForTutorId: value }));
                          if (formErrors.createdForTutorId) {
                            setFormErrors(prev => ({ ...prev, createdForTutorId: '' }));
                          }
                        }}
                      >
                        <SelectTrigger className={`h-11 ${formErrors.createdForTutorId ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Eğitmen seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {tutors.length === 0 ? (
                            <SelectItem value="" disabled>Eğitmen bulunamadı</SelectItem>
                          ) : (
                            tutors.map(tutor => (
                              <SelectItem key={tutor.id} value={tutor.id}>
                                {tutor.firstName && tutor.lastName 
                                  ? `${tutor.firstName} ${tutor.lastName} (${tutor.username})`
                                  : tutor.username}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {formErrors.createdForTutorId && (
                        <p className="text-sm text-red-500 mt-2">{formErrors.createdForTutorId}</p>
                      )}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Başlık *</label>
                        <Input
                          name="title"
                          value={eventForm.title}
                          onChange={handleFormChange}
                          placeholder="Etkinlik başlığı"
                          required
                          className="h-11"
                        />
                        {formErrors.title && (
                          <p className="text-sm text-red-500 mt-1">{formErrors.title}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Açıklama *</label>
                        <Textarea
                          name="description"
                          value={eventForm.description}
                          onChange={handleFormChange}
                          placeholder="Etkinlik açıklaması"
                          required
                          className="min-h-[120px] resize-none"
                        />
                        {formErrors.description && (
                          <p className="text-sm text-red-500 mt-1">{formErrors.description}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Konum</label>
                        <Input
                          name="location"
                          value={eventForm.location}
                          onChange={handleFormChange}
                          placeholder="Etkinlik konumu"
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">Tarih *</label>
                          <Input
                            type="date"
                            name="startDate"
                            value={eventForm.startDate}
                            onChange={handleFormChange}
                            required
                            className="h-11"
                          />
                          {formErrors.startDate && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.startDate}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">Saat *</label>
                          <Input
                            type="time"
                            name="startTime"
                            value={eventForm.startTime}
                            onChange={handleFormChange}
                            required
                            className="h-11"
                          />
                          {formErrors.startTime && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.startTime}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">Tür</label>
                          <Select
                            value={eventForm.type}
                            onValueChange={(value) => setEventForm(prev => ({ ...prev, type: value as 'YUZ_YUZE' | 'ONLINE' }))}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Etkinlik türü seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="YUZ_YUZE">Yüz yüze</SelectItem>
                              <SelectItem value="ONLINE">Online</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">Kapasite</label>
                          <Input
                            type="number"
                            name="capacity"
                            value={eventForm.capacity}
                            onChange={handleFormChange}
                            min={1}
                            className="h-11"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">Puan</label>
                          <Input
                            type="number"
                            name="points"
                            value={eventForm.points}
                            onChange={handleFormChange}
                            min={0}
                            className="h-11"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">Deneyim (XP)</label>
                          <Input
                            type="number"
                            name="experience"
                            value={eventForm.experience}
                            onChange={handleFormChange}
                            min={0}
                            className="h-11"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Etiketler</label>
                        <Textarea
                          name="tags"
                          value={eventForm.tags.join('\n')}
                          onChange={(e) => setEventForm(prev => ({ ...prev, tags: e.target.value.split('\n').filter(tag => tag.trim()) }))}
                          placeholder="Her satıra bir etiket yazın"
                          className="min-h-[80px] resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} size="lg">
                İptal
              </Button>
              <Button 
                type="submit" 
                disabled={formSubmitting} 
                onClick={handleSubmitEvent}
                size="lg"
                className="min-w-[120px]"
              >
                {formSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : currentEventId ? 'Güncelle' : 'Oluştur'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 