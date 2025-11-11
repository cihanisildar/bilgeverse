"use client";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  Award,
  Calendar,
  ChevronDown,
  Clock,
  Filter,
  Info,
  MoreVertical,
  Plus,
  Search,
  User,
  Users
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Event = {
  id: string;
  title: string;
  description: string;
  startDate: string;  // This will be populated from startDateTime
  endDate: string;    // This will be populated from endDateTime
  location: string;
  status: 'YAKINDA' | 'DEVAM_EDIYOR' | 'TAMAMLANDI' | 'IPTAL_EDILDI';
  capacity: number;
  enrolledStudents: number;
  points: number;
  experience: number;
  tags: string[];
  eventScope: 'GLOBAL' | 'GROUP';
  eventType?: {
    id: string;
    name: string;
    description: string | null;
  };
  createdBy: {
    id: string;
    name: string;
  };
  createdAt?: string;
};

// Static Filter Component
function EventsFilter({
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
        <Input 
          placeholder="Etkinlik ara..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white border-gray-200"
        />
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-gray-700">
            {activeFilter === "all" ? "Tüm Etkinlikler" : 
             activeFilter === "YAKINDA" ? "Yaklaşan Etkinlikler" :
             activeFilter === "DEVAM_EDIYOR" ? "Devam Eden Etkinlikler" :
             activeFilter === "TAMAMLANDI" ? "Tamamlanan Etkinlikler" : "İptal Edilen Etkinlikler"}
          </span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtrele
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setActiveFilter("all")}>
              Tümü
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveFilter("YAKINDA")}>
              Yaklaşan Etkinlikler
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveFilter("DEVAM_EDIYOR")}>
              Devam Eden Etkinlikler
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveFilter("TAMAMLANDI")}>
              Tamamlanan Etkinlikler
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveFilter("IPTAL_EDILDI")}>
              İptal Edilen Etkinlikler
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Loading state components
function EventsFilterSkeleton() {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}

function EventCardSkeleton() {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 via-white to-gray-50/30">
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-200 to-gray-300" />
      
      {/* Status Indicator */}
      <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-gray-300 animate-pulse" />
      
      <CardHeader className="pt-6 pb-4">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-5 w-32 rounded-full" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        
        <div className="space-y-3">
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-3/4" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-14 rounded-md" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-6 pb-6">
        {/* Description */}
        <div className="space-y-2 mb-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        
        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-3">
            <div className="flex items-center bg-gray-50/50 rounded-lg p-2">
              <Skeleton className="h-6 w-6 rounded-md mr-3" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center bg-gray-50/50 rounded-lg p-2">
              <Skeleton className="h-6 w-6 rounded-md mr-3" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center bg-gray-50/50 rounded-lg p-2">
              <Skeleton className="h-6 w-6 rounded-md mr-3" />
              <Skeleton className="h-4 w-10" />
            </div>
            <div className="flex items-center bg-gray-50/50 rounded-lg p-2">
              <Skeleton className="h-6 w-6 rounded-md mr-3" />
              <Skeleton className="h-4 w-14" />
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-8" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingEvents() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={`loading-event-skeleton-${index}`} className="group">
          <EventCardSkeleton />
        </div>
      ))}
    </div>
  );
}

// Dynamic Events List Component
function EventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/tutor/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      console.log('Fetched events:', data);
      
      // Transform the API response to match our Event type
      const transformedEvents: Event[] = data.events.map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDateTime,
        endDate: event.endDateTime || event.startDateTime,
        location: event.location,
        status: event.status,
        capacity: event.capacity,
        enrolledStudents: event.enrolledStudents || 0,
        points: event.points,
        experience: event.experience || 0,
        tags: event.tags,
        eventScope: event.eventScope,
        eventType: event.eventType,
        createdBy: {
          id: event.createdById,
          name: 'You' // Since these are the tutor's own events
        },
        createdAt: event.createdAt
      }));
      
      setEvents(transformedEvents);
      setFilteredEvents(transformedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Filter events based on search query, active filter, and scope filter
  useEffect(() => {
    let filtered = [...events];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(event => event.status === activeFilter);
    }

    // Apply scope filter
    if (scopeFilter !== 'all') {
      filtered = filtered.filter(event => event.eventScope === scopeFilter);
    }
    
    setFilteredEvents(filtered);
  }, [events, searchQuery, activeFilter, scopeFilter]);

  if (isLoading) {
    return <LoadingEvents />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">{error}</p>
        <Button onClick={fetchEvents} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <Info className="h-10 w-10 text-blue-500 mx-auto mb-4" />
        <p className="text-gray-600">Henüz hiç etkinlik oluşturmadınız.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/part7/tutor/events/new">İlk Etkinliği Oluştur</Link>
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'YAKINDA':
        return 'secondary';
      case 'DEVAM_EDIYOR':
        return 'default';
      case 'TAMAMLANDI':
        return 'outline';
      case 'IPTAL_EDILDI':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'YAKINDA':
        return 'Yaklaşan';
      case 'DEVAM_EDIYOR':
        return 'Devam Ediyor';
      case 'TAMAMLANDI':
        return 'Tamamlandı';
      case 'IPTAL_EDILDI':
        return 'İptal Edildi';
      default:
        return status;
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

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-4">
          <Tabs defaultValue={activeFilter} onValueChange={setActiveFilter}>
            <TabsList>
              <TabsTrigger value="all">Tümü</TabsTrigger>
              <TabsTrigger value="YAKINDA">Yaklaşan</TabsTrigger>
              <TabsTrigger value="DEVAM_EDIYOR">Devam Eden</TabsTrigger>
              <TabsTrigger value="TAMAMLANDI">Tamamlanan</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs defaultValue={scopeFilter} onValueChange={setScopeFilter}>
            <TabsList>
              <TabsTrigger value="all">Tüm Kapsamlar</TabsTrigger>
              <TabsTrigger value="GROUP">Grup</TabsTrigger>
              <TabsTrigger value="GLOBAL">Genel</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <Link key={event.id} href={`/dashboard/part7/tutor/events/${event.id}`} className="block">
            <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-200 h-full relative overflow-hidden ${
              event.status === 'YAKINDA' ? 'bg-gradient-to-br from-blue-50 to-white' :
              event.status === 'DEVAM_EDIYOR' ? 'bg-gradient-to-br from-green-50 to-white' :
              event.status === 'TAMAMLANDI' ? 'bg-gradient-to-br from-purple-50 to-white' :
              'bg-gradient-to-br from-gray-50 to-white'
            }`}>
              <div className={`absolute top-0 left-0 w-1 h-full ${
                event.status === 'YAKINDA' ? 'bg-blue-500' :
                event.status === 'DEVAM_EDIYOR' ? 'bg-green-500' :
                event.status === 'TAMAMLANDI' ? 'bg-purple-500' :
                'bg-gray-500'
              }`} />
              <CardHeader className="relative">
                <div className="flex justify-between items-start">
                  <Badge 
                    variant={getStatusColor(event.status) as 'default' | 'destructive' | 'outline' | 'secondary'}
                    className={`font-medium ${
                      event.status === 'YAKINDA' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                      event.status === 'DEVAM_EDIYOR' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                      event.status === 'TAMAMLANDI' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' :
                      'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getStatusText(event.status)}
                  </Badge>
                  <Badge
                    variant={event.eventScope === 'GLOBAL' ? 'default' : 'secondary'}
                    className={`font-medium ${
                      event.eventScope === 'GLOBAL'
                        ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    }`}
                  >
                    {event.eventScope === 'GLOBAL' ? 'Genel Etkinlik' : 'Grup Etkinliği'}
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold mt-2 mb-1 text-gray-900 hover:text-blue-600 transition-colors">
                  {event.title}
                </h3>
                <div className="flex flex-wrap gap-1 mt-2">
                  {event.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-white/80 text-gray-700 hover:bg-white">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <Link href={`/dashboard/part7/tutor/events/${event.id}`} className="block">
                <CardContent className="pb-3">
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">{event.description}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{new Date(event.startDate).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{new Date(event.startDate).toLocaleTimeString('tr-TR')}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{event.enrolledStudents}/{event.capacity} Katılımcı</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Award className="h-4 w-4 mr-2" />
                                                    <span>
                              {event.points === (event.experience || 0) 
                                ? `${event.points} Puan/XP` 
                                : `${event.points}P / ${event.experience || 0}XP`}
                            </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function EventDropdownMenu({ event }: { event: Event }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/part7/tutor/events/${event.id}`} className="flex w-full">
            Etkinliği Görüntüle
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/part7/tutor/events/${event.id}/edit`} className="flex w-full">
            Düzenle
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/part7/tutor/events/${event.id}/participants`} className="flex w-full">
            Katılımcılar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/part7/tutor/events/${event.id}/share`} className="flex w-full">
            Paylaş
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function TutorEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/tutor/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      console.log('Fetched events:', data);
      
      // Transform the API response to match our Event type
      const transformedEvents: Event[] = data.events.map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDateTime,
        endDate: event.endDateTime || event.startDateTime,
        location: event.location,
        status: event.status,
        capacity: event.capacity,
        enrolledStudents: event.enrolledStudents || 0,
        points: event.points,
        experience: event.experience || 0,
        tags: event.tags,
        eventScope: event.eventScope,
        eventType: event.eventType,
        createdBy: {
          id: event.createdById,
          name: 'You' // Since these are the tutor's own events
        },
        createdAt: event.createdAt
      }));
      
      setEvents(transformedEvents);
      setFilteredEvents(transformedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Filter events based on search query, active filter, and scope filter
  useEffect(() => {
    let filtered = [...events];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(event => event.status === activeFilter);
    }

    // Apply scope filter
    if (scopeFilter !== 'all') {
      filtered = filtered.filter(event => event.eventScope === scopeFilter);
    }
    
    setFilteredEvents(filtered);
  }, [events, searchQuery, activeFilter, scopeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'YAKINDA':
        return 'secondary';
      case 'DEVAM_EDIYOR':
        return 'default';
      case 'TAMAMLANDI':
        return 'outline';
      case 'IPTAL_EDILDI':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'YAKINDA':
        return 'Yaklaşan';
      case 'DEVAM_EDIYOR':
        return 'Devam Ediyor';
      case 'TAMAMLANDI':
        return 'Tamamlandı';
      case 'IPTAL_EDILDI':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  const handleDeleteEvent = async (event: Event) => {
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Etkinlik silinirken bir hata oluştu');
      }

      // Refresh events list
      fetchEvents();
      setEventToDelete(null);

      toast({
        title: "Başarılı",
        description: "Etkinlik başarıyla silindi",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: err.message,
      });
    }
  };

  // Calculate stats
  const eventStats = {
    total: events.length,
    upcoming: events.filter(e => e.status === 'YAKINDA').length,
    ongoing: events.filter(e => e.status === 'DEVAM_EDIYOR').length,
    completed: events.filter(e => e.status === 'TAMAMLANDI').length,
    myEvents: events.filter(e => e.createdBy.name === 'You').length,
    globalEvents: events.filter(e => e.eventScope === 'GLOBAL').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-600 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex-1">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Etkinlik Yönetimi
              </h1>
              <p className="text-xl text-white/90 mb-6">
                Kendi etkinliklerinizi oluşturun ve genel etkinliklere erişin
              </p>
              <div className="flex items-center gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>{eventStats.total} Toplam Etkinlik</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span>{eventStats.myEvents} Kendi Etkinliğim</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>{eventStats.globalEvents} Genel Etkinlik</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild variant="secondary" className="bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20">
                <Link href="/dashboard/part7/tutor/events/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Etkinlik
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 -mt-8 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-1">{eventStats.upcoming}</div>
              <div className="text-sm font-medium text-gray-600">Yaklaşan Etkinlik</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-1">{eventStats.ongoing}</div>
              <div className="text-sm font-medium text-gray-600">Devam Eden</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-1">{eventStats.completed}</div>
              <div className="text-sm font-medium text-gray-600">Tamamlanan</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="text-3xl font-bold text-indigo-600 mb-1">{eventStats.total}</div>
              <div className="text-sm font-medium text-gray-600">Toplam Etkinlik</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* Search and Filter Card */}
        <Card className="border-0 shadow-lg mb-6 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                <div className="flex-1">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      placeholder="Etkinlik başlığı, açıklama veya etiket ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 text-base rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Durum:</span>
                  </div>
                  <Tabs value={activeFilter} onValueChange={setActiveFilter}>
                    <TabsList className="bg-gray-100/80 h-10">
                      <TabsTrigger value="all" className="text-sm px-4">Tümü</TabsTrigger>
                      <TabsTrigger value="YAKINDA" className="text-sm px-4">Yaklaşan</TabsTrigger>
                      <TabsTrigger value="DEVAM_EDIYOR" className="text-sm px-4">Devam Eden</TabsTrigger>
                      <TabsTrigger value="TAMAMLANDI" className="text-sm px-4">Tamamlanan</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Kapsam:</span>
                </div>
                <Tabs value={scopeFilter} onValueChange={setScopeFilter}>
                  <TabsList className="bg-gray-100/80 h-10">
                    <TabsTrigger value="all" className="text-sm px-4">Tüm Kapsamlar</TabsTrigger>
                    <TabsTrigger value="GROUP" className="text-sm px-4">Grup Etkinlikleri</TabsTrigger>
                    <TabsTrigger value="GLOBAL" className="text-sm px-4">Genel Etkinlikler</TabsTrigger>
                  </TabsList>
                </Tabs>
                {filteredEvents.length > 0 && (
                  <div className="ml-auto flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                    <Info className="h-4 w-4 text-blue-500" />
                    <span><strong>{filteredEvents.length}</strong> etkinlik gösteriliyor</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && <LoadingEvents />}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">{error}</p>
            <Button onClick={fetchEvents} variant="outline" className="mt-4">
              Retry
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && events.length === 0 && (
          <div className="text-center py-8">
            <Info className="h-10 w-10 text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Henüz hiç etkinlik oluşturmadınız.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/part7/tutor/events/new">İlk Etkinliği Oluştur</Link>
            </Button>
          </div>
        )}

        {/* Events Grid */}
        {!isLoading && !error && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <div key={event.id} className="group">
                <Card className={`border-0 shadow-lg hover:shadow-2xl transition-all duration-300 h-full relative overflow-hidden transform hover:-translate-y-1 ${
                  event.status === 'YAKINDA' ? 'bg-gradient-to-br from-blue-50 via-white to-blue-50/30' :
                  event.status === 'DEVAM_EDIYOR' ? 'bg-gradient-to-br from-green-50 via-white to-green-50/30' :
                  event.status === 'TAMAMLANDI' ? 'bg-gradient-to-br from-purple-50 via-white to-purple-50/30' :
                  'bg-gradient-to-br from-gray-50 via-white to-gray-50/30'
                } hover:bg-white`}>
                  
                  {/* Top Accent Line */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${
                    event.status === 'YAKINDA' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                    event.status === 'DEVAM_EDIYOR' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                    event.status === 'TAMAMLANDI' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                    'bg-gradient-to-r from-gray-400 to-gray-500'
                  }`} />

                  {/* Status Indicator */}
                  <div className={`absolute top-4 left-4 w-3 h-3 rounded-full ${
                    event.status === 'YAKINDA' ? 'bg-blue-500 shadow-lg shadow-blue-500/50' :
                    event.status === 'DEVAM_EDIYOR' ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse' :
                    event.status === 'TAMAMLANDI' ? 'bg-purple-500 shadow-lg shadow-purple-500/50' :
                    'bg-gray-400 shadow-lg shadow-gray-400/50'
                  }`} />

                  <CardHeader className="relative pt-6 pb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary"
                            className={`font-semibold px-3 py-1 rounded-full text-xs tracking-wide ${
                              event.status === 'YAKINDA' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              event.status === 'DEVAM_EDIYOR' ? 'bg-green-100 text-green-800 border border-green-200' :
                              event.status === 'TAMAMLANDI' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                              'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}
                          >
                            {getStatusText(event.status)}
                          </Badge>
                          {event.eventScope === 'GLOBAL' && (
                            <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0 text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                              ⭐ Admin
                            </Badge>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={`font-medium text-xs px-3 py-1 rounded-full w-fit ${
                            event.eventScope === 'GLOBAL'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {event.eventScope === 'GLOBAL' ? '🌍 Genel Etkinlik' : '👥 Grup Etkinliği'}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100 transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/part7/tutor/events/${event.id}`} className="flex items-center">
                              <Info className="h-4 w-4 mr-2" />
                              Görüntüle
                            </Link>
                          </DropdownMenuItem>
                          {event.eventScope !== 'GLOBAL' && (
                            <>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/part7/tutor/events/${event.id}/edit`} className="flex items-center">
                                  <Clock className="h-4 w-4 mr-2" />
                                  Düzenle
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600 cursor-pointer flex items-center"
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setEventToDelete(event);
                                }}
                              >
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Sil
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/part7/tutor/events/${event.id}/participants`} className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              Katılımcılar
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <Link href={`/dashboard/part7/tutor/events/${event.id}`} className="block group-hover:transform group-hover:scale-[1.02] transition-transform duration-200">
                      <h3 className="text-xl font-bold mb-3 text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                        {event.title}
                      </h3>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {event.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="bg-white/70 text-gray-600 hover:bg-white text-xs px-2 py-1 rounded-md font-medium border border-gray-100">
                            #{tag}
                          </Badge>
                        ))}
                        {event.tags.length > 3 && (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-md">
                            +{event.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </Link>
                  </CardHeader>

                  <Link href={`/dashboard/part7/tutor/events/${event.id}`} className="block">
                    <CardContent className="px-6 pb-6">
                      {/* Description */}
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-6">
                        {event.description}
                      </p>
                      
                      {/* Event Details Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="space-y-3">
                          <div className="flex items-center text-sm text-gray-600 bg-gray-50/50 rounded-lg p-2">
                            <div className={`p-1.5 rounded-md mr-3 ${
                              event.status === 'YAKINDA' ? 'bg-blue-100' :
                              event.status === 'DEVAM_EDIYOR' ? 'bg-green-100' :
                              event.status === 'TAMAMLANDI' ? 'bg-purple-100' :
                              'bg-gray-100'
                            }`}>
                              <Calendar className={`h-3.5 w-3.5 ${
                                event.status === 'YAKINDA' ? 'text-blue-600' :
                                event.status === 'DEVAM_EDIYOR' ? 'text-green-600' :
                                event.status === 'TAMAMLANDI' ? 'text-purple-600' :
                                'text-gray-600'
                              }`} />
                            </div>
                            <span className="font-medium">{new Date(event.startDate).toLocaleDateString('tr-TR')}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 bg-gray-50/50 rounded-lg p-2">
                            <div className={`p-1.5 rounded-md mr-3 ${
                              event.status === 'YAKINDA' ? 'bg-blue-100' :
                              event.status === 'DEVAM_EDIYOR' ? 'bg-green-100' :
                              event.status === 'TAMAMLANDI' ? 'bg-purple-100' :
                              'bg-gray-100'
                            }`}>
                              <Clock className={`h-3.5 w-3.5 ${
                                event.status === 'YAKINDA' ? 'text-blue-600' :
                                event.status === 'DEVAM_EDIYOR' ? 'text-green-600' :
                                event.status === 'TAMAMLANDI' ? 'text-purple-600' :
                                'text-gray-600'
                              }`} />
                            </div>
                            <span className="font-medium">{new Date(event.startDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center text-sm text-gray-600 bg-gray-50/50 rounded-lg p-2">
                            <div className={`p-1.5 rounded-md mr-3 ${
                              event.status === 'YAKINDA' ? 'bg-blue-100' :
                              event.status === 'DEVAM_EDIYOR' ? 'bg-green-100' :
                              event.status === 'TAMAMLANDI' ? 'bg-purple-100' :
                              'bg-gray-100'
                            }`}>
                              <Users className={`h-3.5 w-3.5 ${
                                event.status === 'YAKINDA' ? 'text-blue-600' :
                                event.status === 'DEVAM_EDIYOR' ? 'text-green-600' :
                                event.status === 'TAMAMLANDI' ? 'text-purple-600' :
                                'text-gray-600'
                              }`} />
                            </div>
                            <span className="font-medium">{event.enrolledStudents}/{event.capacity}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-2 border border-yellow-100">
                            <div className="p-1.5 rounded-md mr-3 bg-gradient-to-r from-yellow-100 to-orange-100">
                              <Award className="h-3.5 w-3.5 text-yellow-600" />
                            </div>
                            <span className="font-bold text-yellow-700">
                              {event.points === (event.experience || 0) 
                                ? `${event.points} P/XP` 
                                : `${event.points}P • ${event.experience || 0}XP`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Participation Progress */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium text-gray-600">Katılım Oranı</span>
                          <span className="text-xs font-bold text-gray-700">
                            {Math.round((event.enrolledStudents / event.capacity) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              event.status === 'YAKINDA' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                              event.status === 'DEVAM_EDIYOR' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                              event.status === 'TAMAMLANDI' ? 'bg-gradient-to-r from-purple-400 to-purple-600' :
                              'bg-gradient-to-r from-gray-400 to-gray-500'
                            }`}
                            style={{ width: `${Math.min((event.enrolledStudents / event.capacity) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Etkinliği Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {eventToDelete && (
                <>
                  <span className="font-medium">{eventToDelete.title}</span> adlı etkinliği silmek istediğinize emin misiniz?
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
              onClick={() => eventToDelete && handleDeleteEvent(eventToDelete)}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
