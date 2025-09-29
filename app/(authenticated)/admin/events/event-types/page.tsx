"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Plus, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type EventType = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    events: number;
  };
};

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventTypeToDelete, setEventTypeToDelete] = useState<EventType | null>(null);

  const fetchEventTypes = async () => {
    const loadingToast = toast.loading("Etkinlik türleri yükleniyor...");
    try {
      const response = await fetch('/api/admin/event-types');
      if (!response.ok) throw new Error('Failed to fetch event types');
      const data = await response.json();
      setEventTypes(data.eventTypes);
      toast.dismiss(loadingToast);
    } catch (error) {
      console.error('Error fetching event types:', error);
      toast.dismiss(loadingToast);
      toast.error("Etkinlik türlerini yüklerken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const handleCreateEventType = async () => {
    const loadingToast = toast.loading("Etkinlik türü oluşturuluyor...");
    try {
      const response = await fetch('/api/admin/event-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event type');
      }

      await fetchEventTypes();
      setIsDialogOpen(false);
      resetForm();
      toast.dismiss(loadingToast);
      toast.success("Etkinlik türü başarıyla oluşturuldu");
    } catch (error: any) {
      console.error('Error creating event type:', error);
      toast.dismiss(loadingToast);
      toast.error("Etkinlik türü oluşturulurken bir hata oluştu: " + error.message);
    }
  };

  const handleUpdateEventType = async () => {
    if (!editingEventType) return;

    const loadingToast = toast.loading("Etkinlik türü güncelleniyor...");
    try {
      const response = await fetch(`/api/admin/event-types/${editingEventType.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update event type');
      }

      await fetchEventTypes();
      setIsDialogOpen(false);
      setEditingEventType(null);
      resetForm();
      toast.dismiss(loadingToast);
      toast.success("Etkinlik türü başarıyla güncellendi");
    } catch (error: any) {
      console.error('Error updating event type:', error);
      toast.dismiss(loadingToast);
      toast.error("Etkinlik türü güncellenirken bir hata oluştu: " + error.message);
    }
  };

  const handleDeleteEventType = (eventType: EventType) => {
    if (eventType._count.events > 0) {
      toast.error("Bu etkinlik türü kullanımda olduğu için silinemez. Bunun yerine deaktive edebilirsiniz.");
      return;
    }

    setEventTypeToDelete(eventType);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteEventType = async () => {
    if (!eventTypeToDelete) return;

    const loadingToast = toast.loading("Etkinlik türü siliniyor...");
    try {
      const response = await fetch(`/api/admin/event-types/${eventTypeToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete event type');
      }

      await fetchEventTypes();
      toast.dismiss(loadingToast);
      toast.success("Etkinlik türü başarıyla silindi");
    } catch (error: any) {
      console.error('Error deleting event type:', error);
      toast.dismiss(loadingToast);
      toast.error("Etkinlik türü silinirken bir hata oluştu: " + error.message);
    } finally {
      setDeleteConfirmOpen(false);
      setEventTypeToDelete(null);
    }
  };

  const openEditDialog = (eventType: EventType) => {
    setEditingEventType(eventType);
    setFormData({
      name: eventType.name,
      description: eventType.description || "",
      isActive: eventType.isActive,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", isActive: true });
    setEditingEventType(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Etkinlik türleri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 ">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-indigo-600/90"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    Etkinlik Türleri
                  </h1>
                  <div className="h-1 w-16 bg-gradient-to-r from-white to-blue-200 rounded-full mt-2"></div>
                </div>
              </div>
              <p className="text-lg text-white/90 max-w-2xl">
                Etkinlik türlerini yönetin, düzenleyin ve yeni türler oluşturun
              </p>
              <div className="flex items-center gap-4 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Toplam {eventTypes.length} tür</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Aktif sistem</span>
                </div>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="group relative overflow-hidden bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Plus className="h-5 w-5 mr-2 relative z-10" />
                  <span className="relative z-10 font-semibold">Yeni Etkinlik Türü</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <DialogTitle className="text-xl font-bold">
                      {editingEventType ? 'Etkinlik Türünü Düzenle' : 'Yeni Etkinlik Türü'}
                    </DialogTitle>
                  </div>
                  <p className="text-sm text-gray-600">
                    {editingEventType ? 'Mevcut etkinlik türünü düzenleyin' : 'Sisteminize yeni bir etkinlik türü ekleyin'}
                  </p>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                      Tür Adı *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Etkinlik türü adı"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                      Açıklama
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Etkinlik türü açıklaması (opsiyonel)"
                      className="resize-none h-24"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-3">
                  <Button variant="outline" onClick={handleDialogClose} className="flex-1">
                    İptal
                  </Button>
                  <Button
                    onClick={editingEventType ? handleUpdateEventType : handleCreateEventType}
                    disabled={!formData.name.trim()}
                    className="flex-1 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {editingEventType ? 'Güncelle' : 'Oluştur'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10 pb-10">
        <div className="grid gap-6">
          {eventTypes.length === 0 ? (
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-16 text-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-2xl"></div>
                  <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                    <Users className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Henüz etkinlik türü yok
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  İlk etkinlik türünü oluşturmak için aşağıdaki butonu kullanın ve sisteminizi yapılandırmaya başlayın.
                </p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="lg"
                      className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <Plus className="h-5 w-5 mr-2 relative z-10" />
                      <span className="relative z-10 font-semibold">İlk Etkinlik Türünü Oluştur</span>
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {eventTypes.map((eventType) => (
                <Card key={eventType.id} className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 transform hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardHeader className="relative z-10 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                          <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                            {eventType.name}
                          </CardTitle>
                        </div>
                        <Badge 
                          variant={eventType.isActive ? "default" : "secondary"}
                          className={`${
                            eventType.isActive 
                              ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200" 
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          } font-medium`}
                        >
                          {eventType.isActive ? "Aktif" : "Pasif"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(eventType)}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog open={deleteConfirmOpen && eventTypeToDelete?.id === eventType.id} onOpenChange={setDeleteConfirmOpen}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEventType(eventType)}
                              disabled={eventType._count.events > 0}
                              className={`opacity-0 group-hover:opacity-100 transition-all duration-300 ${
                                eventType._count.events > 0 
                                  ? "opacity-50 cursor-not-allowed" 
                                  : "hover:bg-red-50 hover:text-red-600"
                              }`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Etkinlik Türünü Sil</AlertDialogTitle>
                              <AlertDialogDescription>
                                "{eventTypeToDelete?.name}" etkinlik türünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={confirmDeleteEventType} className="bg-red-600 text-white hover:bg-red-700">
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10 pt-0 space-y-4">
                    {eventType.description && (
                      <p className="text-gray-600 leading-relaxed">{eventType.description}</p>
                    )}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Kullanım</span>
                        <span className="text-sm font-bold text-blue-600">
                          {eventType._count.events} etkinlik
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Oluşturulma</span>
                        <span className="font-medium">
                          {new Date(eventType.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}