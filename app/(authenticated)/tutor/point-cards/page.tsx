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
  ChevronRight,
  Sparkles,
  TrendingUp,
  Zap,
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

export default function TutorPointCardsPage() {
  const [selectedCard, setSelectedCard] = useState<PointCard | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [cards, setCards] = useState<PointCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch('/api/tutor/point-cards');
        if (!response.ok) {
          throw new Error('Failed to fetch cards');
        }
        const data = await response.json();
        setCards(data);
      } catch (err) {
        setError('Failed to load point cards. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <motion.div 
          className="relative z-10 text-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-8 w-8 text-purple-400" />
            </motion.div>
            <span className="text-xl font-semibold text-white">Yükleniyor...</span>
          </div>
          <div className="h-2 w-64 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div 
          className="text-center p-8 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-red-400 text-lg">{error}</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/20 to-transparent"></div>
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
          {/* Header */}
          <motion.div 
            className="text-center space-y-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white/90 text-sm font-medium">
              <Star className="h-4 w-4 text-yellow-400" />
              <span>Puan Kartları</span>
              <Star className="h-4 w-4 text-yellow-400" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                Öğrenci Başarısını
              </span>
              <br />
              <span className="text-white">Ödüllendirin</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Öğrencilerinizin başarılarını ve gelişimlerini takdir etmek için hazırlanmış 
              puan kartları ile motivasyonlarını artırın.
            </p>
          </motion.div>

          {/* Point Cards Grid */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {cards.map((card) => (
              <motion.div
                key={card.id}
                variants={cardVariants}
                layoutId={`card-${card.id}`}
                onClick={() => setSelectedCard(card)}
                onHoverStart={() => setHoveredCard(card.id)}
                onHoverEnd={() => setHoveredCard(null)}
                className="relative group cursor-pointer"
              >
                <motion.div
                  className="relative h-80 rounded-2xl overflow-hidden"
                  whileHover={{ 
                    scale: 1.05,
                    rotateY: hoveredCard === card.id ? 5 : 0
                  }}
                  transition={{ 
                    duration: 0.3,
                    ease: "easeOut"
                  }}
                >
                  {/* Glassmorphism card */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl"></div>
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 rounded-2xl"></div>
                  
                  {/* Card Content */}
                  <div className="relative z-10 p-6 h-full flex flex-col">
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                      <motion.div 
                        className="text-5xl mb-4"
                        animate={hoveredCard === card.id ? { 
                          scale: [1, 1.2, 1],
                          rotate: [0, 5, -5, 0]
                        } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        {card.icon}
                      </motion.div>
                      
                      <h3 className="text-xl font-bold text-white mb-2">
                        {card.title}
                      </h3>
                      
                      <p className="text-gray-300 text-sm line-clamp-4 leading-relaxed">
                        {card.description}
                      </p>

                      {/* Points display */}
                      <motion.div
                        className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/30 to-blue-500/30 backdrop-blur-sm border border-purple-500/50 rounded-full"
                        animate={hoveredCard === card.id ? {
                          scale: [1, 1.1, 1],
                          backgroundColor: ["rgba(147, 51, 234, 0.3)", "rgba(147, 51, 234, 0.5)", "rgba(147, 51, 234, 0.3)"]
                        } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="text-white font-semibold">
                          {(card.minPoints !== null && card.maxPoints !== null) ? (
                            <>{card.minPoints} - {card.maxPoints} puan</>
                          ) : (
                            <>+{card.points} puan</>
                          )}
                        </span>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Selected Card Modal */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCard(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              layoutId={`card-${selectedCard.id}`}
              className="relative w-full max-w-2xl bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedCard(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Modal content */}
              <div className="relative z-10 p-8 sm:p-12">
                <div className="text-center space-y-6">
                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-3xl sm:text-4xl font-bold text-white mb-4"
                  >
                    {selectedCard.title}
                  </motion.h2>
                  
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-lg text-gray-300 leading-relaxed max-w-xl mx-auto mb-6"
                  >
                    {selectedCard.description}
                  </motion.p>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500/30 to-blue-500/30 backdrop-blur-sm border border-purple-500/50 rounded-full"
                  >
                    <TrendingUp className="h-5 w-5 text-green-400" />
                    <span className="text-white font-bold text-lg">
                      {(selectedCard.minPoints !== null && selectedCard.maxPoints !== null) ? (
                        <>{selectedCard.minPoints} - {selectedCard.maxPoints} puan</>
                      ) : (
                        <>+{selectedCard.points} puan</>
                      )}
                    </span>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 