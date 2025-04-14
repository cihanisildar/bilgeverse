'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ArrowLeft, Calendar, Clock, Loader2, MapPin, Users } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
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

function EventDetailsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-32" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24 mb-4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EventDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { toast } = useToast();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch event details');
      }

      const data = await response.json();
      const eventData = {
        id: data.event._id || data.event.id,
        title: data.event.title,
        description: data.event.description,
        startDate: data.event.startDateTime || data.event.startDate,
        endDate: data.event.endDateTime || data.event.endDate,
        location: data.event.location,
        type: data.event.type,
        status: data.event.status,
        capacity: data.event.capacity,
        enrolledStudents: data.event.enrolledStudents || 0,
        points: data.event.points,
        tags: data.event.tags || [],
        eventScope: data.event.eventScope,
        createdBy: {
          id: data.event.createdBy._id || data.event.createdBy.id,
          name: data.event.createdBy.username || data.event.createdBy.name
        }
      };
      console.log('Event data from API:', data.event);
      console.log('Mapped event data:', eventData);
      setEvent(eventData);

      // Check if user has already joined
      const participantsResponse = await fetch(`/api/events/${eventId}/participants`, {
        credentials: 'include'
      });

      if (participantsResponse.ok) {
        const participantsData = await participantsResponse.json();
        setHasJoined(participantsData.participants.some((p: any) => p.status === 'REGISTERED'));
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      setError('Etkinlik detayları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const handleJoinEvent = async () => {
    try {
      setIsJoining(true);
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Etkinliğe katılırken bir hata oluştu');
      }

      const data = await response.json();
      setHasJoined(true);
      
      // Update the event state with new participant count
      if (event) {
        setEvent({
          ...event,
          enrolledStudents: data.enrolledStudents
        });
      }

      toast({
        title: "Başarılı",
        description: "Etkinliğe başarıyla katıldınız",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message,
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <EventDetailsSkeleton />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">{error || 'Etkinlik bulunamadı'}</p>
          <Button
            variant="outline"
            className="mt-4 hover:bg-gray-100"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
      case 'ONGOING':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'Yaklaşan';
      case 'ONGOING':
        return 'Devam Eden';
      case 'COMPLETED':
        return 'Tamamlandı';
      case 'CANCELLED':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6 hover:bg-gray-100 transition-colors"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Geri Dön
      </Button>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
            <Badge className={cn("px-3 py-1 rounded-full font-medium", getStatusColor(event.status))}>
              {getStatusText(event.status)}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <Badge 
                key={tag} 
                variant="outline"
                className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <Badge 
              className={cn(
                "mb-4 px-3 py-1 rounded-full font-medium",
                event.eventScope === 'GLOBAL' 
                  ? "bg-purple-100 text-purple-800 hover:bg-purple-200" 
                  : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
              )}
            >
              {event.eventScope === 'GLOBAL' ? 'Genel Etkinlik' : 'Grup Etkinliği'}
            </Badge>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{event.description}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{new Date(event.startDate).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{new Date(event.startDate).toLocaleTimeString('tr-TR')}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <Users className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{event.enrolledStudents}/{event.capacity} Katılımcı</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>

            {event.status === 'UPCOMING' && (
              <div className="mt-8 flex items-center justify-between bg-gray-50 p-6 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Katılım Puanı</p>
                  <p className="text-2xl font-semibold text-gray-900">{event.points} Puan</p>
                </div>
                <Button 
                  size="lg"
                  onClick={handleJoinEvent}
                  disabled={isJoining || hasJoined || event.enrolledStudents >= event.capacity}
                  className={cn(
                    "min-w-[120px] font-medium transition-all",
                    isJoining ? "bg-gray-200" :
                    hasJoined ? "bg-green-600 hover:bg-green-700" :
                    event.enrolledStudents >= event.capacity ? "bg-gray-300" :
                    "bg-blue-600 hover:bg-blue-700"
                  )}
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Katılınıyor...
                    </>
                  ) : hasJoined ? (
                    'Katıldınız'
                  ) : event.enrolledStudents >= event.capacity ? (
                    'Kontenjan Dolu'
                  ) : (
                    'Katıl'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 