"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Award,
  GraduationCap,
  X,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface PointCard {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: string | null;
  isActive: boolean;
}

export default function TipsPage() {
  const [selectedCard, setSelectedCard] = useState<PointCard | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [cards, setCards] = useState<PointCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch('/api/tips');
        if (!response.ok) {
          throw new Error('Failed to fetch cards');
        }
        const data = await response.json();
        setCards(data);
      } catch (err) {
        setError('Failed to load tips. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-indigo-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Başarı Rehberi
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Akademik yolculuğunuzda size yardımcı olacak ipuçları, stratejiler
            ve başarıya giden yolda ihtiyacınız olan tüm bilgiler burada!
          </p>
          <p className="text-sm italic text-indigo-600 mt-2">
            💡 İpucu: Kartların üzerine gelerek kazanacağınız puanları görebilirsiniz
          </p>
        </div>

        {/* Point Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {cards.map((card) => (
            <motion.div
              key={card.id}
              layoutId={`card-${card.id}`}
              onClick={() => setSelectedCard(card)}
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
                      <div className="text-2xl text-indigo-600">{card.icon}</div>
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
                    <div className="text-4xl font-bold text-purple-600 mb-4">+{card.points}</div>
                    <div className="text-xl text-purple-700 mb-2">puan</div>
                    <div className="flex items-center text-sm text-indigo-600 mt-4">
                      <span>Detaylar için tıklayın</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Motivation Card */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <GraduationCap className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12" />
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold">
                    Başarıya Giden Yol
                  </h3>
                  <p className="text-sm sm:text-base text-indigo-100">
                    Her gün küçük adımlarla büyük hedeflere
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Award className="h-6 w-6" />
                <span className="text-sm sm:text-base font-medium">
                  Hedeflerinize ulaşmak için çabalayın!
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal View */}
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
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => setSelectedCard(null)}
                    className="p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
                <CardHeader className="p-6 sm:p-8">
                  <CardTitle className="flex items-center justify-center gap-3 mb-6 text-xl sm:text-2xl">
                    <div className="text-3xl text-indigo-600">{selectedCard.icon}</div>
                    <span>{selectedCard.title}</span>
                    <div className="text-lg font-semibold text-purple-600">
                      +{selectedCard.points} puan
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
  );
} 