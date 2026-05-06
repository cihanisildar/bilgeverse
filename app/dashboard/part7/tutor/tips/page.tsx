"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, BookOpen, ChevronRight, Info, Star, X } from "lucide-react";
import { useState, useEffect } from "react";

interface PointCard {
  id: string;
  title: string;
  description: string;
  points: number;
  minPoints?: number;
  maxPoints?: number;
  icon: string | null;
  isActive: boolean;
}

export default function TutorTipsPage() {
  const [cards, setCards] = useState<PointCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PointCard | null>(null);

  useEffect(() => {
    fetch("/api/tips")
      .then((r) => r.json())
      .then((data) => setCards(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeCards = cards.filter((c) => c.isActive);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-amber-100 rounded-2xl mb-4">
            <Award className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Nasıl Bilge Para Kazanılır?
            </span>
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Öğrencilerinizin Bilge Para kazanabileceği yolları öğrenin. Bu bilgileri öğrencilerinizle paylaşarak onları motive edebilirsiniz.
          </p>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl mb-8">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            Aşağıdaki kartlar öğrencilerin mağazasında da görünmektedir. Rehber olarak siz de öğrencilerinize puan verebilirsiniz.
          </p>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <Skeleton className="h-10 w-10 rounded-xl mb-3" />
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-1" />
              </div>
            ))}
          </div>
        ) : activeCards.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>Henüz puan kazanım yöntemi tanımlanmamış</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCards.map((card) => (
              <button
                key={card.id}
                onClick={() => setSelected(card)}
                className="text-left bg-white rounded-2xl p-5 shadow-sm border-2 border-gray-100 hover:border-amber-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <Star className="h-5 w-5 text-amber-600" />
                  </div>
                  <span className="text-lg font-bold text-amber-600">
                    {card.minPoints && card.maxPoints
                      ? `${card.minPoints}-${card.maxPoints}`
                      : card.points}{" "}
                    BP
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{card.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{card.description}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-amber-600 group-hover:gap-2 transition-all">
                  <span>Detaylar</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selected && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelected(null)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">{selected.title}</h2>
              <p className="text-gray-600 mb-4">{selected.description}</p>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-sm text-amber-700 mb-1">Kazanılacak Bilge Para</p>
                <p className="text-3xl font-bold text-amber-600">
                  {selected.minPoints && selected.maxPoints
                    ? `${selected.minPoints} – ${selected.maxPoints}`
                    : selected.points}{" "}
                  BP
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
