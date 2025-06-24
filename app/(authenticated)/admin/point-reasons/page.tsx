"use client";

import { useAuth } from "@/app/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// Types
type PointReason = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  _count?: {
    transactions: number;
  };
};

// Header Component
function PointReasonsHeader() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl"></div>
      <div className="relative p-8 text-center">
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
            Puan Sebepleri Yönetimi
          </span>
        </h1>
        <p className="text-gray-600 text-lg">Puan verme sebeplerini oluşturun ve yönetin</p>
      </div>
    </div>
  );
}

// Main component
function PointReasonsManagement() {
  const { user } = useAuth();
  
  const [reasons, setReasons] = useState<PointReason[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [editingReason, setEditingReason] = useState<PointReason | null>(null);
  const [deletingReason, setDeletingReason] = useState<PointReason | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch reasons
  useEffect(() => {
    fetchReasons();
  }, []);

  const fetchReasons = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/point-reasons", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch reasons");
      }
      
      const data = await response.json();
      setReasons(data.reasons || []);
    } catch (error) {
      console.error("Error fetching reasons:", error);
      toast.error("Sebepler yüklenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter reasons based on search term
  const filteredReasons = reasons.filter((reason) =>
    reason.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (reason.description && reason.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isActive: true,
    });
    setEditingReason(null);
  };

  // Handle create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/point-reasons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create reason");
      }

      const data = await response.json();
      setReasons([data.reason, ...reasons]);
      toast.success("Sebep başarıyla oluşturuldu");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Create error:", error);
      toast.error(error instanceof Error ? error.message : "Sebep oluşturulurken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !editingReason) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/point-reasons/${editingReason.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update reason");
      }

      const data = await response.json();
      setReasons(reasons.map(r => r.id === editingReason.id ? data.reason : r));
      toast.success("Sebep başarıyla güncellendi");
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Edit error:", error);
      toast.error(error instanceof Error ? error.message : "Sebep güncellenirken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = (reason: PointReason) => {
    setDeletingReason(reason);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deletingReason) return;

    try {
      const response = await fetch(`/api/admin/point-reasons/${deletingReason.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete reason");
      }

      setReasons(reasons.filter(r => r.id !== deletingReason.id));
      toast.success("Sebep başarıyla silindi");
      setIsDeleteDialogOpen(false);
      setDeletingReason(null);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error instanceof Error ? error.message : "Sebep silinirken bir hata oluştu");
    }
  };

  // Open edit dialog
  const openEditDialog = (reason: PointReason) => {
    setEditingReason(reason);
    setFormData({
      name: reason.name,
      description: reason.description || "",
      isActive: reason.isActive,
    });
    setIsEditDialogOpen(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get display name
  const getDisplayName = (user: { firstName?: string | null; lastName?: string | null; username: string }) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="p-8 space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl animate-pulse"></div>
            <div className="relative p-8 text-center">
              <div className="h-10 bg-gray-300 rounded-lg w-64 mx-auto mb-4 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded-lg w-96 mx-auto animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
          <Input
            className="pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white/80"
            placeholder="Sebeplerde ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
        >
          <Plus className="h-5 w-5 mr-2" />
          Yeni Sebep Ekle
        </Button>
      </div>

      {/* Reasons List */}
      <div className="space-y-6">
        {filteredReasons.map((reason) => (
          <Card
            key={reason.id}
            className={`border-0 shadow-xl transition-all duration-200 transform hover:scale-[1.01] hover:shadow-2xl ${
              reason.isActive
                ? "bg-gradient-to-br from-white to-blue-50/30"
                : "bg-gradient-to-br from-gray-50 to-gray-100/50"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-gray-900">{reason.name}</h3>
                    <Badge
                      variant={reason.isActive ? "default" : "secondary"}
                      className={`px-3 py-1 ${
                        reason.isActive
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-gray-400 hover:bg-gray-500 text-white"
                      }`}
                    >
                      {reason.isActive ? "Aktif" : "Pasif"}
                    </Badge>
                    {reason._count && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {reason._count.transactions} kullanım
                      </Badge>
                    )}
                  </div>
                  
                  {reason.description && (
                    <p className="text-gray-600 mb-4 leading-relaxed">{reason.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      <strong>Oluşturan:</strong> {getDisplayName(reason.createdBy)}
                    </span>
                    <span>
                      <strong>Tarih:</strong> {formatDate(reason.createdAt)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(reason)}
                    className="px-3 py-2 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(reason)}
                    className="px-3 py-2 rounded-lg border-2 border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredReasons.length === 0 && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50">
            <CardContent className="p-12 text-center">
              <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Henüz sebep eklenmemiş</h3>
              <p className="text-gray-500 mb-6">İlk puan verme sebebini oluşturmak için "Yeni Sebep Ekle" butonuna tıklayın.</p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
              >
                <Plus className="h-5 w-5 mr-2" />
                İlk Sebebi Oluştur
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Puan Sebebi Ekle</DialogTitle>
            <DialogDescription>
              Öğrencilere puan verirken kullanılacak yeni bir sebep oluşturun.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Sebep Adı *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: Karakter Eğitimi, Proje Çalışması..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Bu sebebin ne için kullanılacağını açıklayın (opsiyonel)"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Aktif</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
                {isSubmitting ? "Oluşturuluyor..." : "Oluştur"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Puan Sebebini Düzenle</DialogTitle>
            <DialogDescription>
              Seçili puan sebebinin bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Sebep Adı *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: Karakter Eğitimi, Proje Çalışması..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Açıklama</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Bu sebebin ne için kullanılacağını açıklayın (opsiyonel)"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="edit-isActive">Aktif</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
                {isSubmitting ? "Güncelleniyor..." : "Güncelle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              Sebep Silme Onayı
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Bu işlem geri alınamaz. Emin misiniz?
            </DialogDescription>
          </DialogHeader>
          
          {deletingReason && (
            <div className="space-y-4 my-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-red-200 rounded-full mt-1">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-800 mb-1">
                      "{deletingReason.name}" silinecek
                    </h4>
                    <p className="text-sm text-red-700 mb-2">
                      {deletingReason.description || "Açıklama bulunmamaktadır."}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-red-600">
                      <span>
                        <strong>Oluşturan:</strong> {getDisplayName(deletingReason.createdBy)}
                      </span>
                      {deletingReason._count && (
                        <span>
                          <strong>Kullanım:</strong> {deletingReason._count.transactions} kez
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-yellow-200 rounded-full mt-1">
                    <svg className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.73 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-yellow-800">
                      <strong>Uyarı:</strong> Bu sebep daha önce puan işlemlerinde kullanılmışsa, 
                      geçmiş işlem kayıtları etkilenmeyecek ancak artık yeni puan işlemlerinde kullanılamayacaktır.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingReason(null);
              }}
              className="px-4 py-2"
            >
              İptal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Evet, Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PointReasonsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-8 space-y-8">
        <PointReasonsHeader />
        <PointReasonsManagement />
      </div>
    </div>
  );
} 