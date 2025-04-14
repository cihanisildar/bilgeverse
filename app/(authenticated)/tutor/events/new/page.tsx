'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronLeft,
  Info,
  Save,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CreateEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    location: '',
    type: 'IN_PERSON',
    capacity: 20,
    points: 0,
    tags: [] as string[]
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Log the form data before processing
      console.log('Form data before processing:', formData);
      
      // If no dates are provided, use current date/time
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0].slice(0, 5);

      // Create consolidated datetime string in TR timezone
      const startDateTime = formData.startDate && formData.startTime ? 
        new Date(`${formData.startDate}T${formData.startTime}`).toISOString() : 
        new Date(`${currentDate}T${currentTime}`).toISOString();
      
      // Log the processed datetime values
      console.log('Processed datetime values:', { startDateTime });
      
      const eventData = {
        title: formData.title,
        description: formData.description,
        startDateTime,
        endDateTime: new Date(new Date(startDateTime).getTime() + (2 * 60 * 60 * 1000)).toISOString(), // Default 2 hours duration
        location: formData.location || 'Online',
        type: formData.type.replace('-', '_'),
        capacity: parseInt(String(formData.capacity)),
        points: parseInt(String(formData.points)),
        tags: formData.tags,
        eventScope: 'GROUP'
      };

      // Log the final event data being sent
      console.log('Event data being sent to API:', eventData);

      const response = await fetch('/api/tutor/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      // Log the response status and headers
      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = 'Failed to create event';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('API Error details:', errorData);
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('API Response data:', responseData);

      router.push('/tutor/events');
    } catch (error: unknown) {
      console.error('Detailed error creating event:', error);
      if (error instanceof Error) {
        // Log the full error object
        console.error('Full error object:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
        alert('Etkinlik oluşturulurken bir hata oluştu: ' + error.message);
      } else {
        console.error('An unknown error occurred:', error);
        alert('Etkinlik oluşturulurken bir hata oluştu: ' + error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper function to set today as default for date inputs
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
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
              <p className="text-sm text-white/80">Grubunuz için yeni bir etkinlik oluşturun</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 -mt-8">
        <Card className="border-0 shadow-lg">
          <form onSubmit={handleSubmit}>
            <CardContent className="p-8 space-y-6">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Temel Bilgiler</h2>
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
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

              {/* Date and Time Section */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Tarih ve Saat</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
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
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                      Tür *
                    </label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleSelectChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Etkinlik türü" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN_PERSON">Yüz yüze</SelectItem>
                        <SelectItem value="ONLINE">Online</SelectItem>
                        <SelectItem value="HYBRID">Karma</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
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
                  <div className="col-span-2">
                    <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-1">
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
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    Ekle
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="px-2 py-1">
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
                    Etkinlik oluşturulduktan sonra öğrenciler kayıt olabilecek ve kontenjan dolana kadar katılım devam edecektir.
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
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
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