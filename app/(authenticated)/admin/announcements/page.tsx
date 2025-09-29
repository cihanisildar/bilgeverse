'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { Bell, Plus, Trash2, Pencil } from "lucide-react";
import { AnnouncementsSkeleton } from "@/components/announcements-skeleton";

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: {
    firstName: string | null;
    lastName: string | null;
  };
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast: shadcnToast } = useToast();

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch("/api/admin/announcements");
      if (!response.ok) {
        throw new Error("Failed to fetch announcements");
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setAnnouncements(data);
      } else {
        console.error("Unexpected response format:", data);
        setAnnouncements([]);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("Duyurular yüklenirken bir hata oluştu.");
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) {
        throw new Error("Failed to create announcement");
      }

      toast.success("Duyuru başarıyla oluşturuldu.");
      setIsOpen(false);
      setTitle("");
      setContent("");
      fetchAnnouncements();
    } catch (error) {
      console.error("Error creating announcement:", error);
      toast.error("Duyuru oluşturulurken bir hata oluştu.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditClick = (announcement: Announcement) => {
    setSelectedAnnouncementId(announcement.id);
    setEditTitle(announcement.title);
    setEditContent(announcement.content);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnnouncementId) return;

    setIsUpdating(true);
    try {
      const response = await fetch("/api/admin/announcements", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedAnnouncementId,
          title: editTitle,
          content: editContent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update announcement");
      }

      toast.success("Duyuru başarıyla güncellendi.");
      setIsEditOpen(false);
      setSelectedAnnouncementId(null);
      setEditTitle("");
      setEditContent("");
      fetchAnnouncements();
    } catch (error) {
      console.error("Error updating announcement:", error);
      toast.error("Duyuru güncellenirken bir hata oluştu.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setSelectedAnnouncementId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedAnnouncementId) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/announcements", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: selectedAnnouncementId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete announcement");
      }

      toast.success("Duyuru başarıyla silindi.");
      setIsDeleteDialogOpen(false);
      setSelectedAnnouncementId(null);
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error("Duyuru silinirken bir hata oluştu.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-3 rounded-xl">
              <Bell className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Duyuru Panosu
              </h1>
              <p className="text-gray-500 text-sm mt-1">Öğrenciler için duyurularınızı yönetin</p>
            </div>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg">
                <Plus className="h-4 w-4 text-white" />
                Yeni Duyuru Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  Yeni Duyuru
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium text-gray-700">
                    Başlık
                  </label>
                  <Input
                    id="title"
                    placeholder="Duyuru başlığı"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="content" className="text-sm font-medium text-gray-700">
                    İçerik
                  </label>
                  <Textarea
                    id="content"
                    placeholder="Duyuru içeriği"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    className="min-h-[200px] resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="w-full text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? "Oluşturuluyor..." : "Duyuru Ekle"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Duyuruyu Düzenle
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label htmlFor="editTitle" className="text-sm font-medium text-gray-700">
                  Başlık
                </label>
                <Input
                  id="editTitle"
                  placeholder="Duyuru başlığı"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="editContent" className="text-sm font-medium text-gray-700">
                  İçerik
                </label>
                <Textarea
                  id="editContent"
                  placeholder="Duyuru içeriği"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  required
                  className="min-h-[200px] resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? "Güncelleniyor..." : "Güncelle"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Duyuruyu Sil</DialogTitle>
              <DialogDescription>
                Bu duyuruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                İptal
              </Button>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={handleDelete}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Siliniyor..." : "Sil"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <AnnouncementsSkeleton />
        ) : announcements.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2 bg-white/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-gray-100 p-4 rounded-full">
                <Bell className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Henüz duyuru bulunmamaktadır</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Öğrencileriniz için yeni bir duyuru ekleyerek onları bilgilendirebilirsiniz.
              </p>
              <Button 
                onClick={() => setIsOpen(true)} 
                variant="outline" 
                className="mt-2 border-2  hover:bg-gray-50 transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2 " />
                Yeni Duyuru Ekle
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6">
            {announcements.map((announcement) => (
              <Card 
                key={announcement.id} 
                className="p-6 hover:shadow-xl transition-all duration-300 bg-white/70 backdrop-blur-sm border-l-4 border-l-indigo-500 group"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                        {announcement.title}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <span className="inline-block w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="block w-1 h-1 rounded-full bg-indigo-500"></span>
                        </span>
                        {format(new Date(announcement.createdAt), "dd.MM.yyyy HH:mm")} -{" "}
                        {announcement.createdBy.firstName} {announcement.createdBy.lastName}
                      </p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 -mt-1"
                        onClick={() => handleEditClick(announcement)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 -mt-1"
                        onClick={() => handleDeleteClick(announcement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {announcement.content}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 