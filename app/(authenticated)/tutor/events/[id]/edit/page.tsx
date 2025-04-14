'use client';

import {
  Calendar,
  ChevronLeft,
  Clock,
  Globe,
  MapPin,
  Save,
  Tag,
  User,
  Video,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Form validation schema
const eventFormSchema = z.object({
  title: z.string().min(5, { message: 'Etkinlik başlığı en az 5 karakter olmalıdır.' }),
  description: z.string().min(20, { message: 'Etkinlik açıklaması en az 20 karakter olmalıdır.' }),
  startDate: z.string(),
  startTime: z.string(),
  endDate: z.string(),
  endTime: z.string(),
  location: z.string().min(3, { message: 'Konum alanı doldurulmalıdır.' }),
  type: z.enum(['ONLINE', 'IN_PERSON']),
  status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']),
  capacity: z.coerce.number().min(1, { message: 'Kapasite en az 1 olmalıdır.' }),
  points: z.coerce.number().min(0, { message: 'Puan değeri negatif olamaz.' }),
  tags: z.string(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

type Event = {
  id: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  type: 'ONLINE' | 'IN_PERSON';
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  capacity: number;
  points: number;
  tags: string[];
  createdBy: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
};

export default function EditEvent() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      location: '',
      type: 'ONLINE',
      status: 'UPCOMING',
      capacity: 1,
      points: 0,
      tags: '',
    },
  });

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) {
          throw new Error('Etkinlik yüklenirken bir hata oluştu');
        }
        
        const data = await response.json();
        const event = data.event;
        
        if (event) {
          // Parse dates for form
          const startDate = new Date(event.startDateTime);
          const endDate = new Date(event.endDateTime);
          
          // Format dates and times for form inputs
          const formatDate = (date: Date) => {
            return date.toISOString().split('T')[0]; // YYYY-MM-DD
          };
          
          const formatTime = (date: Date) => {
            return date.toISOString().split('T')[1].substring(0, 5); // HH:MM
          };
          
          // Set form values
          form.reset({
            title: event.title,
            description: event.description,
            startDate: formatDate(startDate),
            startTime: formatTime(startDate),
            endDate: formatDate(endDate),
            endTime: formatTime(endDate),
            location: event.location,
            type: event.type,
            status: event.status,
            capacity: event.capacity,
            points: event.points,
            tags: event.tags.join(', '),
          });
        }
      } catch (err: any) {
        setError(err.message);
        toast({
          variant: "destructive",
          title: "Hata",
          description: err.message,
        });
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId, form, toast]);

  const onSubmit = async (data: EventFormValues) => {
    try {
      // Combine date and time strings into ISO date strings
      const startDateTime = new Date(`${data.startDate}T${data.startTime}`).toISOString();
      const endDateTime = new Date(`${data.endDate}T${data.endTime}`).toISOString();
      
      // Convert tags string to array
      const tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          startDateTime,
          endDateTime,
          location: data.location,
          type: data.type,
          status: data.status,
          capacity: data.capacity,
          points: data.points,
          tags,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Etkinlik güncellenirken bir hata oluştu');
      }

      toast({
        title: "Başarılı",
        description: "Etkinlik başarıyla güncellendi",
      });
      
      router.push(`/tutor/events/${eventId}`);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: err.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p>{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/tutor/events')}
            >
              Etkinliklere Dön
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/tutor/events/${eventId}`}>
              <Button variant="ghost" size="sm" className="text-gray-500">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Geri Dön
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Etkinliği Düzenle</h1>
          <p className="text-gray-500 mt-1">
            Etkinlik detaylarını güncelleyin. Tüm değişiklikler katılımcılara bildirilecektir.
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Temel Bilgiler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etkinlik Başlığı*</FormLabel>
                      <FormControl>
                        <Input placeholder="Etkinlik başlığını girin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etkinlik Açıklaması*</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Etkinlik detaylarını girin" 
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Başlangıç Tarihi*</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Başlangıç Saati*</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bitiş Tarihi*</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bitiş Saati*</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Etkinlik Detayları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konum*</FormLabel>
                      <FormControl>
                        <Input placeholder="Etkinlik konumunu girin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etkinlik Türü*</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="ONLINE" id="online" />
                            <Label htmlFor="online">
                              <div className="flex items-center">
                                <Video className="h-4 w-4 mr-1" />
                                <span>Online</span>
                              </div>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="IN_PERSON" id="in-person" />
                            <Label htmlFor="in-person">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                <span>Yüz Yüze</span>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durum*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Etkinlik durumunu seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="UPCOMING">Yaklaşan</SelectItem>
                          <SelectItem value="ONGOING">Devam Eden</SelectItem>
                          <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                          <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kapasite*</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            placeholder="Maksimum katılımcı sayısı"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="points"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kazanılacak Puan*</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            placeholder="Katılım puanı"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etiketler</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Etiketleri virgülle ayırarak girin"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Örnek: Matematik, Problem Çözme, Olimpiyat
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/tutor/events/${eventId}`)}
              >
                İptal
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <Save className="h-4 w-4 mr-2" />
                Değişiklikleri Kaydet
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
} 