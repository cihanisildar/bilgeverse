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
  type: 'CEVRIMICI' | 'YUZ_YUZE' | 'KARMA';
  status: 'YAKINDA' | 'DEVAM_EDIYOR' | 'TAMAMLANDI' | 'IPTAL_EDILDI';
  capacity: number;
  enrolledStudents: number;
  points: number;
  tags: string[];
  eventScope: 'global' | 'group';
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
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
      </CardFooter>
    </Card>
  );
}

function LoadingEvents() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <EventCardSkeleton key={`loading-event-skeleton-${index}`} />
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
        type: event.type.toLowerCase(),
        status: event.status.toLowerCase(),
        capacity: event.capacity,
        enrolledStudents: event.enrolledStudents || 0,
        points: event.points,
        tags: event.tags,
        eventScope: event.eventScope.toLowerCase(),
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
    
    // Apply status filter - Convert both sides to uppercase for comparison
    if (activeFilter !== 'all') {
      filtered = filtered.filter(event => event.status === activeFilter.toUpperCase());
    }

    // Apply scope filter
    if (scopeFilter !== 'all') {
      filtered = filtered.filter(event => event.eventScope.toUpperCase() === scopeFilter);
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
          <Link href="/tutor/events/new">İlk Etkinliği Oluştur</Link>
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
          <Link key={event.id} href={`/tutor/events/${event.id}`} className="block">
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
                    variant={event.eventScope === 'global' ? 'default' : 'secondary'}
                    className={`font-medium ${
                      event.eventScope === 'global' 
                        ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    }`}
                  >
                    {event.eventScope === 'global' ? 'Genel Etkinlik' : 'Grup Etkinliği'}
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
              <Link href={`/tutor/events/${event.id}`} className="block">
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
                        <span>{event.points} puan</span>
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
          <Link href={`/tutor/events/${event.id}`} className="flex w-full">
            Etkinliği Görüntüle
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/tutor/events/${event.id}/edit`} className="flex w-full">
            Düzenle
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/tutor/events/${event.id}/participants`} className="flex w-full">
            Katılımcılar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/tutor/events/${event.id}/share`} className="flex w-full">
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
        type: event.type.toLowerCase(),
        status: event.status.toLowerCase(),
        capacity: event.capacity,
        enrolledStudents: event.enrolledStudents || 0,
        points: event.points,
        tags: event.tags,
        eventScope: event.eventScope.toLowerCase(),
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
    
    // Apply status filter - Convert both sides to uppercase for comparison
    if (activeFilter !== 'all') {
      filtered = filtered.filter(event => event.status === activeFilter.toUpperCase());
    }

    // Apply scope filter
    if (scopeFilter !== 'all') {
      filtered = filtered.filter(event => event.eventScope.toUpperCase() === scopeFilter);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Etkinlikler</h1>
              <p className="text-white/80">Grup ve genel etkinlikleri oluşturun ve yönetin</p>
            </div>
            <Button asChild className="bg-white text-blue-600 hover:bg-blue-50">
              <Link href="/tutor/events/new">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Etkinlik Oluştur
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
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
              <Link href="/tutor/events/new">İlk Etkinliği Oluştur</Link>
            </Button>
          </div>
        )}

        {/* Events Grid */}
        {!isLoading && !error && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className={`border-0 shadow-lg hover:shadow-xl transition-all duration-200 h-full relative overflow-hidden ${
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
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={event.eventScope === 'global' ? 'default' : 'secondary'}
                        className={`font-medium ${
                          event.eventScope === 'global' 
                            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        }`}
                      >
                        {event.eventScope === 'global' ? 'Genel Etkinlik' : 'Grup Etkinliği'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/tutor/events/${event.id}`}>
                              Görüntüle
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/tutor/events/${event.id}/edit`}>
                              Düzenle
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/tutor/events/${event.id}/participants`}>
                              Katılımcılar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/tutor/events/${event.id}/share`}>
                              Paylaş
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                            onSelect={(e) => {
                              e.preventDefault();
                              setEventToDelete(event);
                            }}
                          >
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <Link href={`/tutor/events/${event.id}`} className="block">
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
                  </Link>
                </CardHeader>
                <Link href={`/tutor/events/${event.id}`} className="block">
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
                          <span>{event.points} puan</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
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
