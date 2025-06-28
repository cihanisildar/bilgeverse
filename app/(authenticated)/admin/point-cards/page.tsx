"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Edit2, Trash2, AlertTriangle, ChevronRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface PointCard {
  id: string;
  title: string;
  description: string;
  points: number;
  minPoints?: number;
  maxPoints?: number;
  isActive: boolean;
}

const SkeletonCard = () => (
  <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-r from-indigo-50 to-purple-50 h-[250px]">
    <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse"></div>
    <CardHeader className="p-6 flex-1 flex flex-col items-center justify-center">
      <div className="w-full space-y-4">
        <div className="flex items-center justify-center">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mx-auto"></div>
        </div>
      </div>
    </CardHeader>
  </Card>
);

export default function PointCardsAdmin() {
  const [cards, setCards] = useState<PointCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<PointCard | null>(null);
  const [selectedCard, setSelectedCard] = useState<PointCard | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    points: 0,
    minPoints: 0,
    maxPoints: 0,
    usePointRange: false,
  });

  const fetchCards = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/point-cards");
      if (!response.ok) {
        throw new Error("Kartlar yüklenemedi");
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setCards(data);
      } else {
        setCards([]);
        toast.error("Geçersiz veri formatı");
      }
    } catch (error) {
      setCards([]);
      toast.error("Kartlar yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCard
        ? "/api/admin/point-cards"
        : "/api/admin/point-cards";
      const method = editingCard ? "PUT" : "POST";
      
      // Prepare the body based on whether we're using point range
      const body = {
        ...formData,
        id: editingCard?.id,
        // Only include minPoints and maxPoints if using point range
        minPoints: formData.usePointRange ? formData.minPoints : null,
        maxPoints: formData.usePointRange ? formData.maxPoints : null,
        // Set points to minPoints if using range, otherwise use points
        points: formData.usePointRange ? formData.minPoints : formData.points
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Kart kaydedilemedi");

      toast.success(editingCard ? "Kart güncellendi" : "Kart oluşturuldu");
      setIsOpen(false);
      setEditingCard(null);
      setFormData({
        title: "",
        description: "",
        points: 0,
        minPoints: 0,
        maxPoints: 0,
        usePointRange: false
      });
      fetchCards();
    } catch (error) {
      toast.error("Kart kaydedilemedi");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch("/api/admin/point-cards", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error("Kart silinemedi");

      toast.success("Kart silindi");
      setIsDeleteDialogOpen(false);
      setCardToDelete(null);
      fetchCards();
    } catch (error) {
      toast.error("Kart silinemedi");
    }
  };

  const openDeleteDialog = (id: string) => {
    setCardToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleEdit = (card: PointCard) => {
    setEditingCard(card);
    setFormData({
      title: card.title,
      description: card.description,
      points: card.points,
      minPoints: card.minPoints ?? 0,
      maxPoints: card.maxPoints ?? 0,
      usePointRange: !!card.minPoints && !!card.maxPoints,
    });
    setIsOpen(true);
  };

  const handleCardAction = (card: PointCard, action: 'view' | 'edit' | 'delete') => {
    switch (action) {
      case 'view':
        setSelectedCard(card);
        break;
      case 'edit':
        handleEdit(card);
        break;
      case 'delete':
        openDeleteDialog(card.id);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Puan Kartları Yönetimi
          </h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700">
                <Plus className="mr-2 h-4 w-4" />
                Yeni Kart Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCard ? "Kartı Düzenle" : "Yeni Kart Oluştur"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Başlık</label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    placeholder="Kart başlığı"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Açıklama</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                    placeholder="Kart açıklaması"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Puan</label>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="point-range"
                        checked={formData.usePointRange}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, usePointRange: checked })
                        }
                      />
                      <Label htmlFor="point-range">Puan aralığı kullan</Label>
                    </div>

                    {formData.usePointRange ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Minimum Puan</Label>
                          <Input
                            type="number"
                            value={formData.minPoints}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                minPoints: Number(e.target.value),
                                points: Number(e.target.value), // Set points to minPoints for consistency
                              })
                            }
                            required
                            min={0}
                            max={formData.maxPoints}
                            placeholder="Min puan"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Maximum Puan</Label>
                          <Input
                            type="number"
                            value={formData.maxPoints}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                maxPoints: Number(e.target.value),
                              })
                            }
                            required
                            min={formData.minPoints}
                            placeholder="Max puan"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    ) : (
                      <Input
                        type="number"
                        value={formData.points}
                        onChange={(e) =>
                          setFormData({ ...formData, points: Number(e.target.value) })
                        }
                        required
                        min={0}
                        placeholder="Kazanılacak puan"
                        className="mt-1"
                      />
                    )}
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700">
                  {editingCard ? "Kartı Güncelle" : "Kart Oluştur"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="text-center mb-6">
          <p className="text-sm italic text-indigo-600">
            💡 İpucu: Kartların üzerine gelerek puan detaylarını ve düzenleme seçeneklerini görebilirsiniz
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            cards.map((card) => (
              <motion.div
                key={card.id}
                layoutId={`card-${card.id}`}
                onClick={() => handleCardAction(card, 'view')}
                onHoverStart={() => setHoveredCard(card.id)}
                onHoverEnd={() => setHoveredCard(null)}
                className="relative perspective-1000"
              >
                <motion.div
                  className="w-full relative preserve-3d transition-transform duration-300"
                  animate={{
                    rotateY: hoveredCard === card.id ? 180 : 0,
                  }}
                  transition={{ duration: 0.1 }}
                >
                  {/* Front of card */}
                  <Card
                    className="border-0 shadow-lg overflow-hidden bg-gradient-to-r from-indigo-50 to-purple-50 hover:shadow-xl transition-all duration-300 h-[250px] flex flex-col relative cursor-pointer backface-hidden"
                  >
                    <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                    <CardHeader className="p-4 sm:p-6 flex-1 flex flex-col items-center justify-center text-center">
                      <CardTitle className="flex items-center justify-center gap-3 mb-4">
                        <span className="text-base sm:text-lg">{card.title}</span>
                      </CardTitle>
                      <CardDescription className="text-sm sm:text-base line-clamp-4 overflow-ellipsis">
                        {card.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  {/* Back of card */}
                  <Card
                    className="border-0 shadow-lg overflow-hidden bg-gradient-to-r from-purple-50 to-indigo-50 hover:shadow-xl transition-all duration-300 h-[250px] flex flex-col absolute inset-0 cursor-pointer backface-hidden rotate-y-180"
                  >
                    <div className="h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                    <CardHeader className="p-4 sm:p-6 flex-1 flex flex-col items-center justify-center text-center">
                      <div className="text-4xl font-bold text-purple-600 mb-4">
                        {(card.minPoints !== null && card.maxPoints !== null) ? (
                          <>{card.minPoints} - {card.maxPoints}</>
                        ) : (
                          <>+{card.points}</>
                        )}
                      </div>
                      <div className="text-xl text-purple-700 mb-2">puan</div>
                      <div className="flex items-center text-sm text-indigo-600 mt-4">
                        <span>Detaylar için tıklayın</span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardAction(card, 'edit');
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardAction(card, 'delete');
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              </motion.div>
            ))
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Kartı Sil
              </DialogTitle>
            </DialogHeader>
            <p>Bu kartı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                İptal
              </Button>
              <Button
                variant="destructive"
                onClick={() => cardToDelete && handleDelete(cardToDelete)}
              >
                Sil
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Card Modal */}
        <AnimatePresence>
          {selectedCard && (
            <motion.div
              initial={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
              animate={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
              exit={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
              onClick={() => setSelectedCard(null)}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <motion.div
                layoutId={`card-${selectedCard.id}`}
                className="w-full max-w-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-r from-indigo-50 to-purple-50">
                  <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCard(null);
                        handleEdit(selectedCard);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCard(null);
                        openDeleteDialog(selectedCard.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSelectedCard(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardHeader className="p-6 sm:p-8">
                    <CardTitle className="flex items-center justify-center gap-3 mb-6 text-xl sm:text-2xl">
                      <span>{selectedCard.title}</span>
                      <div className="text-lg font-semibold text-purple-600">
                        {(selectedCard.minPoints !== null && selectedCard.maxPoints !== null) ? (
                          <>{selectedCard.minPoints} - {selectedCard.maxPoints} puan</>
                        ) : (
                          <>+{selectedCard.points} puan</>
                        )}
                      </div>
                    </CardTitle>
                    <CardDescription className="text-base sm:text-lg leading-relaxed">
                      {selectedCard.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 