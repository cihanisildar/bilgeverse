'use client';

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Event = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  type: 'online' | 'in-person' | 'hybrid';
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  capacity: number;
  enrolledStudents: number;
  points: number;
  tags: string[];
  eventScope: 'GLOBAL' | 'GROUP';
  createdBy: {
    id: string;
    name: string;
  };
};

function EventsHeader() {
  return (
    <div className="bg-gradient-to-br from-violet-500 to-purple-600 text-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Etkinlikler</h1>
            <p className="text-white/80">Tüm etkinlikleri görüntüle ve katıl</p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <Card className="border-0 shadow-lg -mt-6 relative z-10">
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
          <div className="w-full sm:w-60">
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Durum seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="UPCOMING">Yaklaşan</SelectItem>
                <SelectItem value="ONGOING">Devam Eden</SelectItem>
                <SelectItem value="COMPLETED">Tamamlanan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EventsFilterSkeleton() {
  return (
    <Card className="border-0 shadow-lg -mt-6 relative z-10">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full sm:w-60" />
        </div>
      </CardContent>
    </Card>
  );
}

function EventCardSkeleton() {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex gap-2 mt-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6" />
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingEvents() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function EventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      const formattedEvents = data.events.map((event: any) => ({
        id: event._id || event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDateTime || event.startDate,
        endDate: event.endDateTime || event.endDate,
        location: event.location,
        type: event.type,
        status: event.status,
        capacity: event.capacity,
        enrolledStudents: event.enrolledStudents || 0,
        points: event.points,
        tags: event.tags || [],
        eventScope: event.eventScope,
        createdBy: {
          id: event.createdBy._id || event.createdBy.id,
          name: event.createdBy.username || event.createdBy.name
        }
      }));

      setEvents(formattedEvents);
      setFilteredEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

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
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => event.status === statusFilter);
    }

    // Apply scope filter
    if (scopeFilter !== 'all') {
      filtered = filtered.filter(event => event.eventScope === scopeFilter);
    }
    
    setFilteredEvents(filtered);
  }, [events, searchQuery, statusFilter, scopeFilter]);

  if (loading) {
    return <LoadingEvents />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Henüz hiç etkinlik bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredEvents.map((event) => (
        <Link 
          href={`/student/events/${event.id}`} 
          key={event.id}
          className="block transition-transform hover:scale-[1.02]"
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 h-full">
            <CardHeader>
              <div className="flex justify-between items-start">
                <Badge 
                  className={
                    event.status === 'UPCOMING' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' :
                    event.status === 'ONGOING' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                    event.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' :
                    'bg-red-100 text-red-800 hover:bg-red-200'
                  }
                >
                  {event.status === 'UPCOMING' ? 'Yaklaşan' : 
                   event.status === 'ONGOING' ? 'Devam Eden' : 
                   event.status === 'COMPLETED' ? 'Tamamlandı' : 'İptal Edildi'}
                </Badge>
                <Badge 
                  className={
                    event.eventScope === 'GLOBAL' 
                      ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                      : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                  }
                >
                  {event.eventScope === 'GLOBAL' ? 'Genel Etkinlik' : 'Grup Etkinliği'}
                </Badge>
              </div>
              <h3 className="text-xl font-semibold mt-2">
                {event.title}
              </h3>
              <div className="flex flex-wrap gap-1 mt-2">
                {event.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent>
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
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default function StudentEventsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Etkinlikler</h1>
              <p className="text-white/80">Tüm etkinlikleri görüntüle ve katıl</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <EventsList />
      </div>
    </div>
  );
} 