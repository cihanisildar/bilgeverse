'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Book, Brain, Calendar, CheckCircle2, Clock, Crown, GraduationCap, Heart, Lightbulb, Medal, PartyPopper, Target, Trophy, Users } from "lucide-react";

interface TipCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  tips: string[];
  gradient: string;
  iconColor: string;
}

const tipCards: TipCard[] = [
  {
    icon: <Trophy />,
    title: "Akademik Başarı",
    description: "Derslerinizde başarılı olmak için temel stratejiler",
    tips: [
      "Her gün düzenli çalışma saatleri belirleyin",
      "Aktif dinleme tekniklerini kullanın",
      "Notlarınızı düzenli tutun ve gözden geçirin",
      "Anlamadığınız konuları hemen sorun",
    ],
    gradient: "from-yellow-50 to-amber-50",
    iconColor: "text-yellow-600",
  },
  {
    icon: <Brain />,
    title: "Etkili Öğrenme",
    description: "Öğrenme sürecinizi optimize etmek için ipuçları",
    tips: [
      "Pomodoro tekniğini kullanın (25 dk çalışma, 5 dk mola)",
      "Öğrendiklerinizi başkalarına anlatın",
      "Görsel ve işitsel materyallerden faydalanın",
      "Konuları küçük parçalara bölerek çalışın",
    ],
    gradient: "from-blue-50 to-cyan-50",
    iconColor: "text-blue-600",
  },
  {
    icon: <Clock />,
    title: "Zaman Yönetimi",
    description: "Zamanınızı etkili kullanmanın yolları",
    tips: [
      "Günlük ve haftalık planlar yapın",
      "Önceliklendirme yapın",
      "Dikkat dağıtıcıları minimize edin",
      "Hedefleriniz için son tarihler belirleyin",
    ],
    gradient: "from-purple-50 to-indigo-50",
    iconColor: "text-purple-600",
  },
  {
    icon: <Heart />,
    title: "Motivasyon",
    description: "Motivasyonunuzu yüksek tutmanın yolları",
    tips: [
      "Küçük başarılarınızı kutlayın",
      "Kendinize gerçekçi hedefler koyun",
      "Başarı günlüğü tutun",
      "Pozitif düşünmeyi alışkanlık haline getirin",
    ],
    gradient: "from-red-50 to-pink-50",
    iconColor: "text-red-600",
  },
  {
    icon: <Users />,
    title: "Sosyal Gelişim",
    description: "Sosyal becerilerinizi geliştirmenin yolları",
    tips: [
      "Grup çalışmalarına katılın",
      "Sınıf arkadaşlarınızla iletişim kurun",
      "Okul aktivitelerine katılın",
      "Yardımlaşmayı öğrenin",
    ],
    gradient: "from-green-50 to-emerald-50",
    iconColor: "text-green-600",
  },
  {
    icon: <Target />,
    title: "Hedef Belirleme",
    description: "Başarıya ulaşmak için hedef belirleme stratejileri",
    tips: [
      "SMART hedefler belirleyin",
      "Kısa ve uzun vadeli planlar yapın",
      "İlerlemenizi takip edin",
      "Hedeflerinizi görünür bir yere yazın",
    ],
    gradient: "from-orange-50 to-amber-50",
    iconColor: "text-orange-600",
  },
];

const achievements = [
  {
    icon: <Medal className="h-8 w-8 text-yellow-500" />,
    title: "Düzenli Katılım",
    points: "+5 puan",
    description: "Her derse zamanında katılım",
  },
  {
    icon: <CheckCircle2 className="h-8 w-8 text-green-500" />,
    title: "Görev Tamamlama",
    points: "+10 puan",
    description: "Görevleri zamanında tamamlama",
  },
  {
    icon: <Crown className="h-8 w-8 text-purple-500" />,
    title: "Yüksek Performans",
    points: "+15 puan",
    description: "Sınavlarda yüksek başarı",
  },
  {
    icon: <PartyPopper className="h-8 w-8 text-pink-500" />,
    title: "Ekstra Aktiviteler",
    points: "+8 puan",
    description: "Ek etkinliklere katılım",
  },
];

export default function StudentTipsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Başarı Rehberi
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Akademik yolculuğunuzda size yardımcı olacak ipuçları, stratejiler ve başarıya giden yolda 
            ihtiyacınız olan tüm bilgiler burada!
          </p>
        </div>

        {/* Quick Stats */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-indigo-500" />
              Puan Kazanma Rehberi
            </CardTitle>
            <CardDescription>
              Nasıl daha fazla puan kazanabilirsiniz?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    {achievement.icon}
                    <div>
                      <h3 className="font-medium text-gray-900">{achievement.title}</h3>
                      <p className="text-sm text-gray-500">{achievement.description}</p>
                      <span className="mt-1 inline-block text-sm font-semibold text-indigo-600">
                        {achievement.points}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tipCards.map((card, index) => (
            <Card 
              key={index} 
              className={`border-0 shadow-lg overflow-hidden bg-gradient-to-r ${card.gradient}`}
            >
              <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className={`${card.iconColor}`}>
                    {card.icon}
                  </div>
                  {card.title}
                </CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {card.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="flex items-start gap-2">
                      <div className="mt-1">
                        <div className={`h-2 w-2 rounded-full ${card.iconColor.replace('text-', 'bg-')}`} />
                      </div>
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Motivation Card */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <GraduationCap className="h-12 w-12" />
                <div>
                  <h3 className="text-2xl font-bold">Başarıya Giden Yol</h3>
                  <p className="mt-1 text-indigo-100">
                    Her gün küçük adımlarla büyük hedeflere ulaşabilirsiniz!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-lg">
                <Book className="h-6 w-6" />
                <span>Öğren</span>
                <span className="text-indigo-200">•</span>
                <Calendar className="h-6 w-6" />
                <span>Uygula</span>
                <span className="text-indigo-200">•</span>
                <Trophy className="h-6 w-6" />
                <span>Başar</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 