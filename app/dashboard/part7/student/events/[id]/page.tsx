'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ArrowLeft, Calendar, Clock, Loader2, MapPin, Users, Star, Sparkles, CheckCircle, XCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Skeleton */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 py-16 sm:py-24">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <Skeleton className="h-6 w-24 mb-6 bg-white/20" />
          <Skeleton className="h-12 w-96 mb-4 bg-white/20" />
          <div className="flex gap-2 mb-6">
            <Skeleton className="h-8 w-20 bg-white/20 rounded-full" />
            <Skeleton className="h-8 w-24 bg-white/20 rounded-full" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-16 bg-white/20 rounded-full" />
            <Skeleton className="h-6 w-20 bg-white/20 rounded-full" />
            <Skeleton className="h-6 w-14 bg-white/20 rounded-full" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-12 relative z-10 pb-16">
        <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">
          <Skeleton className="h-6 w-32 mb-6" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-40" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-40" />
            </div>
          </div>
        </div>
      </div>
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
        status: data.event.status === 'YAKINDA' ? 'UPCOMING' : data.event.status,
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
      
      // Check if the current user has joined by making a separate API call
      const participationResponse = await fetch(`/api/events/${eventId}/participation`, {
        credentials: 'include'
      });
      
      if (participationResponse.ok) {
        const participationData = await participationResponse.json();
        setHasJoined(participationData.hasJoined);
      }
      
      setEvent(eventData);
    } catch (error: any) {
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
        title: "🎉 Başarılı",
        description: "Etkinliğe başarıyla katıldınız! Etkinlik detayları email adresinize gönderildi.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "❌ Hata",
        description: error.message,
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return <EventDetailsSkeleton />;
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-12 max-w-md mx-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Hata Oluştu</h3>
          <p className="text-gray-600 mb-6">{error || 'Etkinlik bulunamadı'}</p>
          <Button
            onClick={() => router.back()}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return {
          gradient: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
          text: '⏰ Yaklaşan',
          icon: Clock
        };
      case 'ONGOING':
        return {
          gradient: 'bg-gradient-to-r from-blue-400 to-blue-500',
          text: '🚀 Devam Eden',
          icon: Sparkles
        };
      case 'COMPLETED':
        return {
          gradient: 'bg-gradient-to-r from-gray-400 to-gray-500',
          text: '✅ Tamamlandı',
          icon: CheckCircle
        };
      case 'CANCELLED':
        return {
          gradient: 'bg-gradient-to-r from-red-400 to-red-500',
          text: '❌ İptal Edildi',
          icon: XCircle
        };
      default:
        return {
          gradient: 'bg-gradient-to-r from-gray-400 to-gray-500',
          text: status,
          icon: Clock
        };
    }
  };

  const statusConfig = getStatusConfig(event.status);
  const progressPercentage = (event.enrolledStudents / event.capacity) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white py-16 sm:py-24 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-8 text-white hover:bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Etkinliklere Dön
          </Button>

          {/* Event Title and Status */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1">
                <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  {event.title}
                </h1>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Badge className={cn(statusConfig.gradient, "text-white px-4 py-2 text-sm font-medium rounded-full border-0 shadow-lg")}>
                  {statusConfig.text}
                </Badge>
                <Badge 
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-full border-0 shadow-lg text-white",
                    event.eventScope === 'GLOBAL' 
                      ? 'bg-gradient-to-r from-purple-400 to-pink-400'
                      : 'bg-gradient-to-r from-indigo-400 to-blue-400'
                  )}
                >
                  {event.eventScope === 'GLOBAL' ? '🌍 Genel Etkinlik' : '👥 Grup Etkinliği'}
                </Badge>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <Badge 
                  key={tag} 
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 px-3 py-1.5 text-sm rounded-full"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Points highlight */}
            <div className="inline-flex items-center gap-2 bg-yellow-400/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl px-6 py-3">
              <Star className="h-5 w-5 text-yellow-300" />
              <span className="text-yellow-100 font-medium">
                <span className="font-bold text-yellow-200">{event.points}</span> puan kazanma fırsatı
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-12 relative z-10 pb-16">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          {/* Content */}
          <div className="p-8 sm:p-12">
            {/* Description */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-indigo-600" />
                Etkinlik Detayları
              </h2>
              <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">
                  {event.description}
                </p>
              </div>
            </div>

            {/* Event Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-6">
                <div className="flex items-center group">
                  <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mr-4 group-hover:bg-indigo-200 transition-colors">
                    <Calendar className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Tarih</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(event.startDate).toLocaleDateString('tr-TR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center group">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mr-4 group-hover:bg-purple-200 transition-colors">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Saat</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(event.startDate).toLocaleTimeString('tr-TR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center group">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mr-4 group-hover:bg-emerald-200 transition-colors">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium">Katılımcılar</p>
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      {event.enrolledStudents} / {event.capacity} kişi
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center group">
                  <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mr-4 group-hover:bg-orange-200 transition-colors">
                    <MapPin className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Konum</p>
                    <p className="text-lg font-semibold text-gray-900">{event.location}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Section */}
            {event.status === 'UPCOMING' && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl p-8 border border-indigo-100">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <p className="text-sm text-gray-600 font-medium">Katılım Ödülü</p>
                    </div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {event.points} Puan
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Etkinliğe katılarak kazan</p>
                  </div>
                  
                  <Button 
                    size="lg"
                    onClick={handleJoinEvent}
                    disabled={isJoining || hasJoined || event.enrolledStudents >= event.capacity}
                    className={cn(
                      "min-w-[160px] h-14 font-semibold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0",
                      isJoining ? "bg-gray-300 cursor-not-allowed" :
                      hasJoined ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white" :
                      event.enrolledStudents >= event.capacity ? "bg-gray-300 cursor-not-allowed text-gray-500" :
                      "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white hover:scale-105"
                    )}
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Katılınıyor...
                      </>
                    ) : hasJoined ? (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Katıldınız ✓
                      </>
                    ) : event.enrolledStudents >= event.capacity ? (
                      <>
                        <XCircle className="mr-2 h-5 w-5" />
                        Kontenjan Dolu
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Hemen Katıl
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Completed Event Info */}
            {event.status === 'COMPLETED' && (
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-3xl p-8 border border-gray-200 text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Etkinlik Tamamlandı</h3>
                <p className="text-gray-600">Bu etkinlik başarıyla tamamlanmıştır.</p>
              </div>
            )}

            {/* Cancelled Event Info */}
            {event.status === 'CANCELLED' && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-3xl p-8 border border-red-200 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-red-900 mb-2">Etkinlik İptal Edildi</h3>
                <p className="text-red-700">Bu etkinlik maalesef iptal edilmiştir.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 