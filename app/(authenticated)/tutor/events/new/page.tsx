"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Info, Save, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Period = {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: string;
};

type EventType = {
  id: string;
  name: string;
  description?: string;
};

export default function CreateEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [periods, setPeriods] = useState<Period[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(true);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [eventTypesLoading, setEventTypesLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    location: "",
    eventTypeId: "",
    customName: "",
    capacity: 20,
    points: 0,
    experience: 0,
    tags: [] as string[],
    eventScope: "GROUP" as "GROUP" | "GLOBAL",
    periodId: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // If points are being changed, update experience to match
    if (name === 'points') {
      const numericValue = Number(value) || 0;
      setFormData((prev) => ({
        ...prev,
        points: numericValue,
        experience: numericValue // Auto-sync XP with points
      }));
    } else if (name === 'experience' || name === 'capacity') {
      // Handle numeric fields
      const numericValue = Number(value) || 0;
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchPeriods = async () => {
    try {
      console.log('Fetching periods...');
      const response = await fetch('/api/admin/periods', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      console.log('Periods response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Periods fetch failed:', errorText);
        throw new Error(`Failed to fetch periods: ${response.status}`);
      }

      const data = await response.json();
      console.log('Periods data received:', data);

      if (!data.periods || !Array.isArray(data.periods)) {
        console.error('Invalid period data structure:', data);
        throw new Error('Invalid period data received');
      }

      console.log(`Found ${data.periods.length} periods`);
      setPeriods(data.periods);

      // Set default period to active period if available
      const activePeriod = data.periods.find((p: Period) => p.status === 'ACTIVE');
      if (activePeriod) {
        console.log('Setting active period as default:', activePeriod.name);
        setFormData(prev => ({ ...prev, periodId: activePeriod.id }));
      }
    } catch (err: any) {
      console.error('Error fetching periods:', err);
      toast({
        title: "Hata",
        description: "Dönemler yüklenirken bir hata oluştu: " + err.message,
        variant: "destructive",
      });
    } finally {
      setPeriodsLoading(false);
    }
  };

  const fetchEventTypes = async () => {
    try {
      const response = await fetch('/api/event-types', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch event types');
      }

      const data = await response.json();

      if (!data.eventTypes || !Array.isArray(data.eventTypes)) {
        throw new Error('Invalid event type data received');
      }

      setEventTypes(data.eventTypes);

      // Set default event type to first available if any
      if (data.eventTypes.length > 0) {
        setFormData(prev => ({ ...prev, eventTypeId: data.eventTypes[0].id }));
      }
    } catch (err: any) {
      console.error('Error fetching event types:', err);
      toast({
        title: "Hata",
        description: "Etkinlik türleri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.",
        variant: "destructive",
      });
    } finally {
      setEventTypesLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
    fetchEventTypes();
  }, []);

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      toast({
        title: "Hata",
        description: "Başlık gereklidir",
        variant: "destructive",
      });
      return;
    }
    if (!formData.description.trim()) {
      toast({
        title: "Hata",
        description: "Açıklama gereklidir",
        variant: "destructive",
      });
      return;
    }
    if (!formData.periodId) {
      toast({
        title: "Hata",
        description: "Dönem seçimi gereklidir",
        variant: "destructive",
      });
      return;
    }
    if (!formData.eventTypeId) {
      toast({
        title: "Hata",
        description: "Etkinlik türü seçimi gereklidir",
        variant: "destructive",
      });
      return;
    }

    // All event types are now specific catalog activities - no custom name needed

    try {
      setIsSubmitting(true);

      // Log the form data before processing
      console.log("Form data before processing:", formData);

      // If no dates are provided, use current date/time
      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];
      const currentTime = now.toTimeString().split(" ")[0].slice(0, 5);

      // Create consolidated datetime string in TR timezone
      const startDateTime =
        formData.startDate && formData.startTime
          ? new Date(
              `${formData.startDate}T${formData.startTime}`
            ).toISOString()
          : new Date(`${currentDate}T${currentTime}`).toISOString();

      // Log the processed datetime values
      console.log("Processed datetime values:", { startDateTime });

      const eventData = {
        title: formData.title,
        description: formData.description,
        startDateTime,
        endDateTime: new Date(
          new Date(startDateTime).getTime() + 2 * 60 * 60 * 1000
        ).toISOString(), // Default 2 hours duration
        location: formData.location || "Online",
        eventTypeId: formData.eventTypeId,
        customName: null, // No custom names needed for catalog activities
        capacity: parseInt(String(formData.capacity)),
        points: parseInt(String(formData.points)),
        experience: parseInt(String(formData.experience)),
        tags: formData.tags,
        eventScope: formData.eventScope,
        periodId: formData.periodId,
      };

      // Log the final event data being sent
      console.log("Event data being sent to API:", eventData);

      const response = await fetch("/api/tutor/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      // Log the response status and headers
      console.log("API Response status:", response.status);
      console.log(
        "API Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = "Failed to create event";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error("API Error details:", errorData);
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log("API Response data:", responseData);

      router.push("/tutor/events");
    } catch (error: unknown) {
      console.error("Detailed error creating event:", error);
      if (error instanceof Error) {
        // Log the full error object
        console.error("Full error object:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
        toast({
          title: "Hata",
          description: "Etkinlik oluşturulurken bir hata oluştu: " + error.message,
          variant: "destructive",
        });
      } else {
        console.error("An unknown error occurred:", error);
        toast({
          title: "Hata",
          description: "Etkinlik oluşturulurken bir hata oluştu: " + error,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to set today as default for date inputs
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-white" asChild>
              <Link href="/tutor/events">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Geri
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Yeni Etkinlik Oluştur</h1>
              <p className="text-sm text-white/80">
                Grubunuz için yeni bir etkinlik oluşturun
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 -mt-8">
        <Card
          className={cn(
            "border-0 shadow-lg transition-colors duration-300",
            formData.eventScope === "GLOBAL"
              ? "bg-slate-50"
              : "bg-white"
          )}
        >
          <form onSubmit={handleSubmit}>
            <CardContent className="p-8 space-y-6">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between w-full">
                  <h2 className="text-lg font-semibold">Temel Bilgiler</h2>
                  <div className="flex items-center justify-end gap-3 pb-4 border-b">
                    <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium text-gray-900">
                          Genel Etkinlik
                        </span>
                        <span className="text-xs text-gray-500">
                          Tüm öğrencilere açık
                        </span>
                      </div>
                      <Switch
                        checked={formData.eventScope === "GLOBAL"}
                        onCheckedChange={(checked) =>
                          handleSelectChange(
                            "eventScope",
                            checked ? "GLOBAL" : "GROUP"
                          )
                        }
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Başlık *
                  </label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Etkinlik başlığını girin"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Açıklama *
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Etkinliğinizi detaylı şekilde açıklayın"
                    required
                    className="resize-none h-32"
                  />
                </div>
              </div>

              {/* Period Selection Section */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Dönem Seçimi</h2>
                <div>
                  <label
                    htmlFor="periodId"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Dönem *
                  </label>
                  <Select
                    value={formData.periodId}
                    onValueChange={(value) => handleSelectChange("periodId", value)}
                    disabled={periodsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={periodsLoading ? "Dönemler yükleniyor..." : "Dönem seçin"} />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.length === 0 ? (
                        <SelectItem value="no-periods" disabled>
                          {periodsLoading ? "Dönemler yükleniyor..." : "Dönem bulunamadı"}
                        </SelectItem>
                      ) : (
                        periods.map(period => (
                          <SelectItem key={period.id} value={period.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{period.name}</span>
                              <span className={`ml-2 text-xs px-2 py-1 rounded ${
                                period.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                period.status === 'INACTIVE' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {period.status === 'ACTIVE' ? 'Aktif' :
                                 period.status === 'INACTIVE' ? 'Pasif' : 'Arşiv'}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date and Time Section */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Tarih ve Saat</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Başlangıç Tarihi *
                    </label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="startTime"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Başlangıç Saati *
                    </label>
                    <Input
                      id="startTime"
                      name="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Event Details Section */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Etkinlik Detayları</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Konum *
                    </label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Etkinlik konumu"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="eventTypeId"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Etkinlik Türü *
                    </label>
                    <Select
                      value={formData.eventTypeId}
                      onValueChange={(value) => handleSelectChange("eventTypeId", value)}
                      disabled={eventTypesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={eventTypesLoading ? "Türler yükleniyor..." : "Etkinlik türünü seçin"} />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.length === 0 ? (
                          <SelectItem value="no-types" disabled>
                            {eventTypesLoading ? "Türler yükleniyor..." : "Tür bulunamadı"}
                          </SelectItem>
                        ) : (
                          eventTypes.map(eventType => (
                            <SelectItem key={eventType.id} value={eventType.id}>
                              {eventType.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Custom Name Field removed - using specific catalog activities */}
                  <div>
                    <label
                      htmlFor="capacity"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Kontenjan *
                    </label>
                    <Input
                      id="capacity"
                      name="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="points"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Puan *
                    </label>
                    <Input
                      id="points"
                      name="points"
                      type="number"
                      min="0"
                      value={formData.points}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="experience"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Deneyim (XP) *
                    </label>
                    <Input
                      id="experience"
                      name="experience"
                      type="number"
                      min="0"
                      value={formData.experience}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Etiketler</h2>
                <div className="flex gap-3">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Yeni etiket"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    variant="outline"
                  >
                    Ekle
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="px-2 py-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-blue-700">
                    Etkinlik oluşturulduktan sonra öğrenciler kayıt olabilecek
                    ve kontenjan dolana kadar katılım devam edecektir.
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between p-6 bg-gray-50 border-t">
              <Button variant="outline" type="button" asChild>
                <Link href="/tutor/events">İptal</Link>
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Oluştur
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
