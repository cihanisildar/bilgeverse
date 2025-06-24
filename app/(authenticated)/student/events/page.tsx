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
import { Calendar, Clock, MapPin, Search, Users, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Event = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  type: 'online' | 'in-person' | 'hybrid';
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'YAKINDA';
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
    <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white py-16 sm:py-24 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium">Etkinlik Merkezi</span>
            </div>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            Etkinlikler
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
            Büyüleyici etkinlikleri keşfet, katıl ve yeni deneyimler yaşa
          </p>
          <div className="mt-8 flex justify-center">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-3">
              <p className="text-sm text-white/70">
                <span className="font-semibold text-white">Aktif Etkinlikler</span> • Hemen katılmaya başla
              </p>
            </div>
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
    <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl -mt-12 relative z-10 mx-4 sm:mx-0">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-hover:text-indigo-500 transition-colors" />
              <Input
                placeholder="Ne tür bir etkinlik arıyorsun?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-gray-200/50 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm focus:bg-white focus:shadow-md transition-all duration-300 text-gray-700 placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="w-full lg:w-64">
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="h-12 border-gray-200/50 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm hover:bg-white hover:shadow-md transition-all duration-300">
                <SelectValue placeholder="Durum filtrele" />
              </SelectTrigger>
              <SelectContent className="border-gray-200/50 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl">
                <SelectItem value="all" className="rounded-xl">🎯 Tümü</SelectItem>
                <SelectItem value="UPCOMING" className="rounded-xl">⏰ Yaklaşan</SelectItem>
                <SelectItem value="ONGOING" className="rounded-xl">🚀 Devam Eden</SelectItem>
                <SelectItem value="COMPLETED" className="rounded-xl">✅ Tamamlanan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventsFilterSkeleton() {
  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl -mt-12 relative z-10 mx-4 sm:mx-0">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <Skeleton className="h-12 flex-1 rounded-2xl" />
          <Skeleton className="h-12 w-full lg:w-64 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function EventCardSkeleton() {
  return (
    <div className="group bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-7 w-48 mb-3 rounded-xl" />
        <div className="flex flex-wrap gap-2 mb-4">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full mb-2 rounded-lg" />
        <Skeleton className="h-4 w-3/4 mb-6 rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24 rounded-lg" />
            <Skeleton className="h-4 w-20 rounded-lg" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-28 rounded-lg" />
            <Skeleton className="h-4 w-32 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingEvents() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function EventsList({
  initialSearchQuery,
  initialStatusFilter,
}: {
  initialSearchQuery: string;
  initialStatusFilter: string;
}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      const formattedEvents = data.events.map((event: any) => {
        // Map Turkish statuses to English statuses
        let mappedStatus = event.status;
        switch (event.status) {
          case 'YAKINDA':
            mappedStatus = 'UPCOMING';
            break;
          case 'DEVAM_EDIYOR':
            mappedStatus = 'ONGOING';
            break;
          case 'TAMAMLANDI':
            mappedStatus = 'COMPLETED';
            break;
          case 'IPTAL_EDILDI':
            mappedStatus = 'CANCELLED';
            break;
          default:
            mappedStatus = event.status;
        }

        return {
          id: event._id || event.id,
          title: event.title,
          description: event.description,
          startDate: event.startDateTime || event.startDate,
          endDate: event.endDateTime || event.endDate,
          location: event.location,
          type: event.type,
          status: mappedStatus,
          capacity: event.capacity,
          enrolledStudents: event.enrolledStudents || 0,
          points: event.points,
          tags: event.tags || [],
          eventScope: event.eventScope,
          createdBy: {
            id: event.createdBy._id || event.createdBy.id,
            name: event.createdBy.username || event.createdBy.name
          }
        };
      });

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
    // Refresh data when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchEvents();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    let filtered = [...events];
    
    // Apply search filter
    if (initialSearchQuery) {
      const query = initialSearchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (initialStatusFilter !== 'all') {
      filtered = filtered.filter(event => event.status === initialStatusFilter);
    }
    
    setFilteredEvents(filtered);
  }, [events, initialSearchQuery, initialStatusFilter]);

  if (loading) {
    return <LoadingEvents />;
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
          <div className="text-red-600 font-medium mb-2">Hata Oluştu</div>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz Etkinlik Yok</h3>
          <p className="text-gray-600">Yeni etkinlikler eklendiğinde burada görünecek.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
      {filteredEvents.map((event) => (
        <Link 
          href={`/student/events/${event.id}`} 
          key={event.id}
          className="group block"
        >
          <div className="relative bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden h-full">
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500 rounded-3xl" />
            
            <div className="relative p-6 h-full flex flex-col">
              {/* Header with badges */}
              <div className="flex justify-between items-start mb-4 gap-2">
                <Badge 
                  className={`
                    px-3 py-1.5 text-xs font-medium rounded-full border-0 shadow-sm
                    ${event.status === 'UPCOMING' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white' :
                      event.status === 'ONGOING' ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white' :
                      event.status === 'COMPLETED' ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white' :
                      'bg-gradient-to-r from-red-400 to-red-500 text-white'}
                  `}
                >
                  {event.status === 'UPCOMING' ? '⏰ Yaklaşan' : 
                   event.status === 'ONGOING' ? '🚀 Devam Eden' : 
                   event.status === 'COMPLETED' ? '✅ Tamamlandı' : '❌ İptal Edildi'}
                </Badge>
                <Badge 
                  className={`
                    px-3 py-1.5 text-xs font-medium rounded-full border-0 shadow-sm
                    ${event.eventScope === 'GLOBAL' 
                      ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white'
                      : 'bg-gradient-to-r from-indigo-400 to-blue-400 text-white'}
                  `}
                >
                  {event.eventScope === 'GLOBAL' ? '🌍 Genel' : '👥 Grup'}
                </Badge>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-700 transition-colors">
                {event.title}
              </h3>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {event.tags.slice(0, 3).map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="outline"
                    className="text-xs px-2 py-1 bg-gray-50/80 border-gray-200 text-gray-600 rounded-full hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
                  >
                    {tag}
                  </Badge>
                ))}
                {event.tags.length > 3 && (
                  <Badge 
                    variant="outline"
                    className="text-xs px-2 py-1 bg-gray-50/80 border-gray-200 text-gray-500 rounded-full"
                  >
                    +{event.tags.length - 3}
                  </Badge>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 line-clamp-2 mb-6 flex-grow">{event.description}</p>

              {/* Event details grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                    <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center mr-3 group-hover:bg-indigo-100 transition-colors">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span className="font-medium">{new Date(event.startDate).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                    <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center mr-3 group-hover:bg-purple-100 transition-colors">
                      <Clock className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="font-medium">{new Date(event.startDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                    <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center mr-3 group-hover:bg-emerald-100 transition-colors">
                      <Users className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="font-medium">{event.enrolledStudents}/{event.capacity}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                    <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center mr-3 group-hover:bg-orange-100 transition-colors">
                      <MapPin className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="font-medium truncate">{event.location}</span>
                  </div>
                </div>
              </div>

              {/* Action button */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  <span className="font-medium text-indigo-600">{event.points}</span> puan
                </div>
                <div className="flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-700 transition-colors">
                  <span>Detayları Gör</span>
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function StudentEventsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <EventsHeader />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <EventsFilter 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />
        <div className="mt-16">
          <EventsList 
            initialSearchQuery={searchQuery}
            initialStatusFilter={activeFilter}
          />
        </div>
      </div>
    </div>
  );
} 