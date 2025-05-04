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
import { Calendar, Edit, Loader2, Search, Trash, User, X, Users } from 'lucide-react';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    location: '',
    type: 'YUZ_YUZE' as 'YUZ_YUZE' | 'ONLINE',
    capacity: 20,
    points: 0,
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
    
    setFilteredEvents(filtered);
  }, [events, searchQuery, dateFilter, scopeFilter, tutorFilter]);

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
    setEventForm(prev => ({
      ...prev,
      [name]: value
    }));
    
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

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-8">
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
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <Toaster position="top-center" />
      
      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialog.isOpen} 
        onOpenChange={(isOpen: boolean) => setDeleteDialog(prev => ({ ...prev, isOpen }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Etkinliği Sil</DialogTitle>
            <DialogDescription>
              &quot;{deleteDialog.title}&quot; etkinliğini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
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
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Etkinlik Yönetimi</h1>
              <p className="text-white/80">Tüm etkinlikleri yönetin ve kontrol edin</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => {
                console.log('Clicked Genel Etkinlik Oluştur');
                setInitialEventScope('GLOBAL');
                openAddEventModal();
              }} className="bg-white text-blue-600 hover:bg-blue-50">
                Genel Etkinlik Oluştur
              </Button>
              <Button onClick={() => {
                console.log('Clicked Eğitmen Etkinliği Oluştur');
                setInitialEventScope('GROUP');
                openAddEventModal();
              }} className="bg-blue-500 text-white hover:bg-blue-600">
                Eğitmen Etkinliği Oluştur
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-8">
        {/* Search and Filter Card */}
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Etkinlik ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={scopeFilter} onValueChange={setScopeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Etkinlik Türü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Etkinlikler</SelectItem>
                  <SelectItem value="GLOBAL">Genel Etkinlikler</SelectItem>
                  <SelectItem value="GROUP">Grup Etkinlikleri</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tutorFilter} onValueChange={setTutorFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Eğitmen Seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Eğitmenler</SelectItem>
                  {tutors.map(tutor => (
                    <SelectItem key={tutor.id} value={tutor.username}>
                      {tutor.firstName && tutor.lastName 
                        ? `${tutor.firstName} ${tutor.lastName} (${tutor.username})`
                        : tutor.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Events Grid */}
        <div className="grid gap-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Etkinlik Bulunamadı</h3>
              <p className="text-gray-500">
                {events.length === 0 
                  ? "Henüz hiç etkinlik oluşturulmamış." 
                  : "Arama kriterlerinize uygun etkinlik bulunamadı."}
              </p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <Card key={event.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{event.title}</CardTitle>
                      <p className="text-sm text-gray-500">{event.description}</p>
                    </div>
                    <Badge variant={event.eventScope === 'GLOBAL' ? 'default' : 'secondary'}>
                      {event.eventScope === 'GLOBAL' ? 'Genel Etkinlik' : 'Grup Etkinliği'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(event.startDateTime).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User className="h-4 w-4" />
                      <span>Oluşturan: {event.createdBy.username}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>Katılımcı: {event.enrolledStudents || 0}/{event.capacity}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditEventModal(event)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Düzenle
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteEvent(event.id, event.title)}>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[800px] max-h-[90vh] flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  {currentEventId ? 'Etkinliği Düzenle' : eventForm.eventScope === 'GLOBAL' ? 'Yeni Genel Etkinlik Oluştur' : 'Yeni Eğitmen Etkinliği Oluştur'}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSubmitEvent}>
                <div className="space-y-4">
                  {/* Debug info */}
                  {(() => {
                    console.log('Rendering form with eventScope:', eventForm.eventScope);
                    return null;
                  })()}
                  {eventForm.eventScope === 'GROUP' && (
                    <div>
                      <label className="text-sm font-medium">Eğitmen Seç *</label>
                      <Select
                        value={eventForm.createdForTutorId}
                        onValueChange={(value) => {
                          console.log('Selected tutor:', value);
                          setEventForm(prev => ({ ...prev, createdForTutorId: value }));
                          if (formErrors.createdForTutorId) {
                            setFormErrors(prev => ({ ...prev, createdForTutorId: '' }));
                          }
                        }}
                      >
                        <SelectTrigger className={formErrors.createdForTutorId ? "border-red-500" : ""}>
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
                        <p className="text-sm text-red-500 mt-1">{formErrors.createdForTutorId}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">Başlık *</label>
                    <Input
                      name="title"
                      value={eventForm.title}
                      onChange={handleFormChange}
                      placeholder="Etkinlik başlığı"
                      required
                    />
                    {formErrors.title && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Açıklama</label>
                    <Textarea
                      name="description"
                      value={eventForm.description}
                      onChange={handleFormChange}
                      placeholder="Etkinlik açıklaması"
                      required
                      className="min-h-[100px]"
                    />
                    {formErrors.description && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Başlangıç Tarihi</label>
                      <Input
                        type="date"
                        name="startDate"
                        value={eventForm.startDate}
                        onChange={handleFormChange}
                        required
                      />
                      {formErrors.startDate && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.startDate}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium">Başlangıç Saati</label>
                      <Input
                        type="time"
                        name="startTime"
                        value={eventForm.startTime}
                        onChange={handleFormChange}
                        required
                      />
                      {formErrors.startTime && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.startTime}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Konum</label>
                    <Input
                      name="location"
                      value={eventForm.location}
                      onChange={handleFormChange}
                      placeholder="Etkinlik konumu"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Tür</label>
                      <Select
                        value={eventForm.type}
                        onValueChange={(value) => setEventForm(prev => ({ ...prev, type: value as 'YUZ_YUZE' | 'ONLINE' }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Etkinlik türü seçin" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="YUZ_YUZE">Yüz yüze</SelectItem>
                          <SelectItem value="ONLINE">Online</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Kapasite</label>
                      <Input
                        type="number"
                        name="capacity"
                        value={eventForm.capacity}
                        onChange={handleFormChange}
                        min={1}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Puan</label>
                    <Input
                      type="number"
                      name="points"
                      value={eventForm.points}
                      onChange={handleFormChange}
                      min={0}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Etiketler</label>
                    <Textarea
                      name="tags"
                      value={eventForm.tags.join('\n')}
                      onChange={(e) => setEventForm(prev => ({ ...prev, tags: e.target.value.split('\n') }))}
                      placeholder="Etiketleri girin (her satırda bir etiket)"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={formSubmitting} onClick={handleSubmitEvent}>
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