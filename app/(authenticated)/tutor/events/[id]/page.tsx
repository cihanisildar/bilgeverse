"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  AlertCircle,
  Award,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Edit,
  Globe,
  Loader2,
  MapPin,
  Play,
  Share2,
  Trash2,
  User,
  Users,
  Video,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Event = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  type: "cevrimici" | "yuz_yuze" | "karma";
  status: "yakinda" | "devam_ediyor" | "tamamlandi" | "iptal_edildi";
  capacity: number;
  enrolledStudents: number;
  points: number;
  experience: number;
  tags: string[];
  createdBy: {
    id: string;
    name: string;
  };
};

type Participant = {
  id: string;
  name: string;
  avatar?: string;
  studentId: string;
  status: "confirmed" | "pending" | "cancelled";
  joinedAt: string;
};

export default function EventDetails() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);

        const response = await fetch(`/api/events/${eventId}`, {
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch event details");
        }

        const data = await response.json();
        const eventData = data.event;

        const formattedEvent = {
          id: eventData._id || eventData.id,
          title: eventData.title,
          description: eventData.description,
          startDate: eventData.startDateTime || eventData.startDate,
          endDate: eventData.endDateTime || eventData.endDate,
          location: eventData.location,
          type: eventData.type.toLowerCase(),
          status: eventData.status.toLowerCase(),
          capacity: eventData.capacity,
          enrolledStudents: eventData.enrolledStudents || 0,
          points: eventData.points,
          experience: eventData.experience || 0,
          tags: eventData.tags || [],
          createdBy: {
            id: eventData.createdBy._id || eventData.createdBy.id,
            name: eventData.createdBy.username || "Unknown",
          },
        };

        setEvent(formattedEvent);
      } catch (error) {
        console.error("Error fetching event details:", error);
        setError("Etkinlik bilgileri yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "yakinda":
        return "bg-blue-100 text-blue-800";
      case "devam_ediyor":
        return "bg-green-100 text-green-800";
      case "tamamlandi":
        return "bg-gray-100 text-gray-800";
      case "iptal_edildi":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "yakinda":
        return "Yakında";
      case "devam_ediyor":
        return "Devam Ediyor";
      case "tamamlandi":
        return "Tamamlandı";
      case "iptal_edildi":
        return "İptal Edildi";
      default:
        return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "cevrimici":
        return <Video className="h-4 w-4 text-blue-600" />;
      case "yuz_yuze":
        return <User className="h-4 w-4 text-green-600" />;
      case "karma":
        return <Globe className="h-4 w-4 text-purple-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "cevrimici":
        return "Çevrimiçi";
      case "yuz_yuze":
        return "Yüz Yüze";
      case "karma":
        return "Karma";
      default:
        return type;
    }
  };

  const getParticipantStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getParticipantStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Onaylandı";
      case "pending":
        return "Beklemede";
      case "cancelled":
        return "İptal Edildi";
      default:
        return status;
    }
  };

  const handleDeleteEvent = async () => {
    try {
      setDeletingEvent(true);
      
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete event');
      }

      // Close the dialog
      setDeleteDialogOpen(false);
      
      // Show success toast
      toast({
        title: "Başarılı",
        description: "Etkinlik başarıyla silindi.",
        duration: 3000,
      });

      // Navigate back to events list after a short delay to show the toast
      setTimeout(() => {
        router.push('/tutor/events');
      }, 1000);
    } catch (error: any) {
      console.error('Error deleting event:', error);
      
      // Show error toast
      toast({
        title: "Hata",
        description: error.message || "Etkinlik silinirken bir hata oluştu.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setDeletingEvent(false);
    }
  };

  const handleStatusChange = async (newStatus: string, successMessage: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          title: event?.title,
          description: event?.description,
          startDateTime: event?.startDate,
          location: event?.location,
          type: event?.type.toUpperCase(),
          capacity: event?.capacity,
          points: event?.points,
          tags: event?.tags,
          status: newStatus
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update event status');
      }

      // Update local event state
      setEvent(prev => prev ? { ...prev, status: newStatus.toLowerCase() as "yakinda" | "devam_ediyor" | "tamamlandi" | "iptal_edildi" } : null);
      
      // Show success toast
      toast({
        title: "Başarılı",
        description: successMessage,
      });
    } catch (error: any) {
      console.error('Error updating event status:', error);
      
      // Show error toast
      toast({
        title: "Hata",
        description: error.message || "Etkinlik durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleStartEvent = () => {
    handleStatusChange('DEVAM_EDIYOR', 'Etkinlik başlatıldı.');
  };

  const handleCompleteEvent = () => {
    handleStatusChange('TAMAMLANDI', 'Etkinlik tamamlandı olarak işaretlendi.');
  };

  const handleCancelEvent = () => {
    handleStatusChange('IPTAL_EDILDI', 'Etkinlik iptal edildi.');
  };

  const getDurationText = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMs = endDate.getTime() - startDate.getTime();

    if (durationMs > 86400000) {
      return `${Math.ceil(durationMs / 86400000)} gün`;
    } else {
      return `${Math.ceil(durationMs / 3600000)} saat`;
    }
  };

  const getQuickActionButtons = () => {
    if (!event || !user) return null;

    // Only show quick actions if the current user is the creator of the event
    // This prevents tutors from managing admin-created general events
    if (event.createdBy.id !== user.id) {
      return null;
    }

    const buttons = [];
    
    // Start Event button (only for upcoming events)
    if (event.status === 'yakinda') {
      buttons.push(
        <Button
          key="start"
          onClick={handleStartEvent}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold px-6 py-3"
        >
          <Play className="mr-2 h-5 w-5" />
          🚀 Etkinliği Başlat
        </Button>
      );
    }
    
    // Complete Event button (only for ongoing events)
    if (event.status === 'devam_ediyor') {
      buttons.push(
        <Button
          key="complete"
          onClick={handleCompleteEvent}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold px-6 py-3"
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          ✅ Etkinliği Tamamla
        </Button>
      );
    }
    
    // Cancel Event button (for upcoming and ongoing events)
    if (event.status === 'yakinda' || event.status === 'devam_ediyor') {
      buttons.push(
        <Button
          key="cancel"
          onClick={handleCancelEvent}
          variant="outline"
          className="border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 hover:text-red-700 shadow-md hover:shadow-lg transition-all duration-300 font-semibold px-6 py-3"
        >
          <XCircle className="mr-2 h-5 w-5" />
          ❌ Etkinliği İptal Et
        </Button>
      );
    }

    return buttons.length > 0 ? (
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl">
              <Play className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Hızlı İşlemler</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {buttons}
          </div>
        </CardContent>
      </Card>
    ) : null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-500">Etkinlik bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-red-700 mb-2">
            {error || "Etkinlik bulunamadı"}
          </h2>
          <p className="text-red-600 mb-6">
            İstediğiniz etkinlik mevcut değil veya erişim izniniz yok.
          </p>
          <Button asChild>
            <Link href="/tutor/events">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Etkinlik Listesine Dön
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-blue-600 to-indigo-700 text-white py-16 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white rounded-full blur-2xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4">
          {/* Status indicator dot */}
          <div className="flex items-center mb-6">
            <div className={`w-4 h-4 rounded-full mr-3 shadow-lg ${
              event.status === 'yakinda' ? 'bg-blue-400 shadow-blue-400/50 animate-pulse' :
              event.status === 'devam_ediyor' ? 'bg-green-400 shadow-green-400/50 animate-pulse' :
              event.status === 'tamamlandi' ? 'bg-purple-400 shadow-purple-400/50' :
              'bg-gray-400 shadow-gray-400/50'
            }`}></div>
            <Badge
              className={`font-semibold px-4 py-2 rounded-full text-sm border-0 ${
                event.status === 'yakinda' ? 'bg-blue-500/90 text-white' :
                event.status === 'devam_ediyor' ? 'bg-green-500/90 text-white' :
                event.status === 'tamamlandi' ? 'bg-purple-500/90 text-white' :
                'bg-gray-500/90 text-white'
              }`}
            >
              {getStatusText(event.status.toLowerCase())}
            </Badge>
          </div>

          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
            <div className="flex-1">
              <h1 className="text-4xl xl:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent leading-tight">
                {event.title}
              </h1>
              
              {/* Enhanced badges section */}
              <div className="flex flex-wrap gap-3 items-center mb-6">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                  {getTypeIcon(event.type)}
                  <span className="text-white font-medium">
                    {getTypeText(event.type.toLowerCase())}
                  </span>
                </div>
                
                {event.tags.map((tag) => (
                  <Badge
                    key={tag}
                    className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20 px-3 py-1 rounded-full font-medium"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>

              {/* Key metrics */}
              <div className="flex flex-wrap gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span className="font-medium">{event.enrolledStudents}/{event.capacity} Katılımcı</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  <span className="font-medium">
                    {event.points === (event.experience || 0) 
                      ? `${event.points} Puan/XP` 
                      : `${event.points}P • ${event.experience || 0}XP`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">{getDurationText(event.startDate, event.endDate)}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Only show edit/share buttons if user is the creator */}
              {user && event.createdBy.id === user.id && (
                <>
                  <Button
                    variant="secondary"
                    className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:text-white border border-white/20 font-medium"
                    asChild
                  >
                    <Link href={`/tutor/events/${event.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Düzenle
                    </Link>
                  </Button>
                  <Button
                    variant="secondary"
                    className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:text-white border border-white/20 font-medium"
                    asChild
                  >
                    <Link href={`/tutor/events/${event.id}/share`}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Paylaş
                    </Link>
                  </Button>
                </>
              )}
              {/* Always show participants button */}
              <Button
                variant="secondary"
                className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:text-white border border-white/20 font-medium"
                asChild
              >
                <Link href={`/tutor/events/${event.id}/participants`}>
                  <Users className="mr-2 h-4 w-4" />
                  Katılımcılar
                </Link>
              </Button>
              <Button
                className="bg-white text-blue-600 hover:bg-gray-100 hover:text-blue-700 font-medium shadow-lg"
                asChild
              >
                <Link href="/tutor/events">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Etkinlikler
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Action Buttons */}
        <div className="mb-8">
          {getQuickActionButtons()}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Description Card */}
            <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <CardHeader className="relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                <div className="flex items-center gap-3 pt-2">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Etkinlik Detayları
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="prose prose-blue max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                    {event.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Participants Card */}
            <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <CardHeader className="relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                <div className="flex items-center gap-3 pt-2">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Katılımcı Bilgileri
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl transform group-hover:scale-105 transition-transform duration-200"></div>
                  <div className="relative flex items-center gap-4 p-6 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-100 hover:border-blue-200 transition-colors">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Katılımcı Sayısı
                      </p>
                      <p className="text-3xl font-bold text-blue-700 mb-2">
                        {event.enrolledStudents} / {event.capacity}
                      </p>
                      <div className="bg-white/60 rounded-full h-3 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                          style={{ width: `${Math.min((event.enrolledStudents / event.capacity) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs font-medium text-blue-600 mt-1">
                        {Math.round((event.enrolledStudents / event.capacity) * 100)}% Dolu
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rewards Card */}
            <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <CardHeader className="relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-orange-600"></div>
                <div className="flex items-center gap-3 pt-2">
                  <div className="p-2 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Ödül Bilgileri
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl transform group-hover:scale-105 transition-transform duration-200"></div>
                  <div className="relative flex items-center gap-4 p-6 bg-gradient-to-br from-yellow-50/80 to-orange-50/80 rounded-2xl border border-yellow-100 hover:border-yellow-200 transition-colors">
                    <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Kazanılacak Ödüller
                      </p>
                      <p className="text-3xl font-bold text-orange-700 mb-3">
                        {event.points === event.experience 
                          ? `${event.points} P/XP` 
                          : `${event.points}P • ${event.experience}XP`}
                      </p>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-white/70 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-orange-700">{event.points}</p>
                          <p className="text-xs font-medium text-orange-600">Puan</p>
                        </div>
                        <div className="flex-1 bg-white/70 rounded-lg p-3 text-center">
                          <p className="text-lg font-bold text-orange-700">{event.experience || 0}</p>
                          <p className="text-xs font-medium text-orange-600">XP</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Event Info */}
          <div className="space-y-8">
            {/* Tutor Card - Moved to top */}
            <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <CardHeader className="relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-600"></div>
                <div className="flex items-center gap-3 pt-2">
                  <div className="p-2 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl">
                    <User className="h-6 w-6 text-indigo-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">Eğitmen Bilgileri</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl transform group-hover:scale-105 transition-transform duration-200"></div>
                  <div className="relative flex items-center gap-6 p-6 bg-gradient-to-r from-indigo-50/80 to-blue-50/80 rounded-2xl border border-indigo-100 hover:border-indigo-200 transition-colors">
                    <Avatar className="h-16 w-16 ring-4 ring-indigo-200 shadow-lg">
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold text-2xl">
                        {event.createdBy.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-xl mb-1">
                        {event.createdBy.name}
                      </p>
                      <p className="text-sm font-medium text-indigo-600 mb-2">Etkinlik Eğitmeni</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Aktif Eğitmen</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time and Location Card */}
            <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <CardHeader className="relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-600"></div>
                <div className="flex items-center gap-3 pt-2">
                  <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Zaman ve Konum
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {/* Event Type */}
                <div className="group">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                    Etkinlik Türü
                  </h3>
                  <div className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors group-hover:shadow-md">
                    <div className="p-2 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mr-3">
                      {getTypeIcon(event.type)}
                    </div>
                    <span className="text-gray-900 font-semibold">
                      {getTypeText(event.type.toLowerCase())}
                    </span>
                  </div>
                </div>

                {/* Start Time */}
                <div className="group">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                    Başlangıç
                  </h3>
                  <div className="flex items-center p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100 hover:border-emerald-200 transition-colors group-hover:shadow-md">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg mr-3">
                      <CalendarClock className="text-white h-4 w-4" />
                    </div>
                    <span className="text-gray-900 font-semibold">
                      {formatDate(event.startDate)}
                    </span>
                  </div>
                </div>

                {/* End Time */}
                <div className="group">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                    Bitiş
                  </h3>
                  <div className="flex items-center p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-100 hover:border-red-200 transition-colors group-hover:shadow-md">
                    <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg mr-3">
                      <Clock className="text-white h-4 w-4" />
                    </div>
                    <span className="text-gray-900 font-semibold">
                      {formatDate(event.endDate)}
                    </span>
                  </div>
                </div>

                {/* Duration */}
                <div className="group">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                    Süre
                  </h3>
                  <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:border-blue-200 transition-colors group-hover:shadow-md">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-3">
                      <Calendar className="text-white h-4 w-4" />
                    </div>
                    <span className="text-gray-900 font-semibold">
                      {getDurationText(event.startDate, event.endDate)}
                    </span>
                  </div>
                </div>

                {/* Location */}
                <div className="group">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                    Konum
                  </h3>
                  <div className="flex items-center p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100 hover:border-amber-200 transition-colors group-hover:shadow-md">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg mr-3">
                      <MapPin className="text-white h-4 w-4" />
                    </div>
                    <span className="text-gray-900 font-semibold">{event.location}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delete Button - Only show if user is the creator */}
            {user && event.createdBy.id === user.id && (
              <Button
                variant="destructive"
                className="w-full py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deletingEvent}
              >
                {deletingEvent ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Siliniyor...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-3 h-5 w-5" />
                    Etkinliği Sil
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Etkinliği Silmek İstediğinize Emin misiniz?
            </DialogTitle>
            <DialogDescription>
              Bu işlem geri alınamaz. Etkinlik ve tüm katılımcı bilgileri kalıcı
              olarak silinecektir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deletingEvent}
            >
              İptal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteEvent}
              disabled={deletingEvent}
            >
              {deletingEvent ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Etkinliği Sil
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Mock data for a single event
const mockEvents: Event[] = [
  {
    id: "1",
    title: "Matematik Olimpiyatları Hazırlık Semineri",
    description:
      "Bu seminer, matematik olimpiyatlarına hazırlanan öğrenciler için problem çözme teknikleri ve stratejileri sunacaktır.\n\nTüm katılımcılar, seminer öncesinde temel matematik kavramlarını gözden geçirmelidir. Etkinlik sırasında, olimpiyat tarzı problemleri çözmek için gerekli analitik düşünme becerileri üzerinde durulacaktır.\n\nKapsam:\n- Olimpiyat matematiği nedir?\n- Problem çözme yaklaşımları\n- Temel stratejiler ve teknikler\n- Örnek problemler ve çözümleri\n- Grup çalışması ve tartışma\n\nMatematik olimpiyatlarına katılmak isteyen veya matematiksel problem çözme becerilerini geliştirmek isteyen tüm öğrenciler bu etkinliğe katılabilir.",
    startDate: "2023-06-01T09:00:00Z",
    endDate: "2023-06-01T12:00:00Z",
    location: "Zoom (Online)",
    type: "cevrimici",
    status: "yakinda",
    capacity: 30,
    enrolledStudents: 18,
    points: 50,
    experience: 50,
    tags: ["Matematik", "Olimpiyat", "Problem Çözme"],
    createdBy: {
      id: "101",
      name: "Ahmet Yılmaz",
    },
  },
  {
    id: "2",
    title: "Fizik Deneyleri Atölyesi",
    description:
      "Öğrencilerin fizik kanunlarını pratik olarak gözlemleyebilecekleri interaktif bir atölye çalışması.",
    startDate: "2023-05-15T13:00:00Z",
    endDate: "2023-05-15T15:30:00Z",
    location: "Fizik Laboratuvarı",
    type: "yuz_yuze",
    status: "devam_ediyor",
    capacity: 20,
    enrolledStudents: 20,
    points: 30,
    experience: 30,
    tags: ["Fizik", "Laboratuvar", "Deney"],
    createdBy: {
      id: "102",
      name: "Zeynep Kaya",
    },
  },
  {
    id: "3",
    title: "İngilizce Konuşma Kulübü",
    description:
      "Öğrencilerin İngilizce konuşma becerilerini geliştirmeleri için haftalık düzenlenen sohbet kulübü.",
    startDate: "2023-05-10T16:00:00Z",
    endDate: "2023-05-10T17:30:00Z",
    location: "Dil Laboratuvarı",
    type: "yuz_yuze",
    status: "tamamlandi",
    capacity: 15,
    enrolledStudents: 12,
    points: 20,
    experience: 20,
    tags: ["İngilizce", "Konuşma", "Dil Becerisi"],
    createdBy: {
      id: "103",
      name: "Elif Demir",
    },
  },
];

// Mock participants data
const mockParticipants: Participant[] = [
  {
    id: "1",
    name: "Ayşe Yıldız",
    studentId: "2023001",
    status: "confirmed",
    joinedAt: "2023-05-10T14:32:00Z",
  },
  {
    id: "2",
    name: "Mehmet Can",
    studentId: "2023015",
    status: "confirmed",
    joinedAt: "2023-05-11T09:15:00Z",
  },
  {
    id: "3",
    name: "Zeynep Kara",
    studentId: "2023022",
    status: "pending",
    joinedAt: "2023-05-12T16:40:00Z",
  },
  {
    id: "4",
    name: "Ali Demir",
    studentId: "2023008",
    status: "confirmed",
    joinedAt: "2023-05-10T18:22:00Z",
  },
  {
    id: "5",
    name: "Selin Yılmaz",
    studentId: "2023019",
    status: "confirmed",
    joinedAt: "2023-05-11T11:05:00Z",
  },
  {
    id: "6",
    name: "Burak Şahin",
    studentId: "2023029",
    status: "cancelled",
    joinedAt: "2023-05-12T14:10:00Z",
  },
  {
    id: "7",
    name: "Deniz Aksoy",
    studentId: "2023017",
    status: "confirmed",
    joinedAt: "2023-05-13T09:30:00Z",
  },
];
