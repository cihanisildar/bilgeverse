import Link from 'next/link';
import { User, Calendar, Trophy, ShoppingBag, UserPlus, Star, FileText, Heart } from "lucide-react";

const quickAccessItems = [
  {
    href: "/dashboard/part7/admin/users",
    icon: User,
    title: "Kullanıcı Yönetimi",
    description: "Kullanıcıları yönet, düzenle ve görüntüle",
    hoverBg: "hover:bg-indigo-50",
    hoverBorder: "group-hover:border-indigo-200",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    iconHover: "group-hover:bg-indigo-200"
  },
  {
    href: "/dashboard/part7/admin/events",
    icon: Calendar,
    title: "Etkinlik Oluştur",
    description: "Yeni etkinlikler ekle ve planla",
    hoverBg: "hover:bg-purple-50",
    hoverBorder: "group-hover:border-purple-200",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    iconHover: "group-hover:bg-purple-200"
  },
  {
    href: "/dashboard/part7/admin/leaderboard",
    icon: Trophy,
    title: "Liderlik Tablosu",
    description: "Öğrenci başarı ve puan sıralamasını görüntüle",
    hoverBg: "hover:bg-blue-50",
    hoverBorder: "group-hover:border-blue-200",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    iconHover: "group-hover:bg-blue-200"
  },
  {
    href: "/dashboard/part7/admin/store",
    icon: ShoppingBag,
    title: "Ürün Ekle",
    description: "Mağazaya yeni ürünler ekle ve düzenle",
    hoverBg: "hover:bg-green-50",
    hoverBorder: "group-hover:border-green-200",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    iconHover: "group-hover:bg-green-200"
  },
  {
    href: "/dashboard/part7/admin/registration-requests",
    icon: UserPlus,
    title: "Kayıt İstekleri",
    description: "Bekleyen kayıt isteklerini onayla veya reddet",
    hoverBg: "hover:bg-amber-50",
    hoverBorder: "group-hover:border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    iconHover: "group-hover:bg-amber-200"
  },
  {
    href: "/dashboard/part7/admin/points",
    icon: Star,
    title: "Puan Yönetimi",
    description: "Öğrenci puanlarını yönet ve görüntüle",
    hoverBg: "hover:bg-yellow-50",
    hoverBorder: "group-hover:border-yellow-200",
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
    iconHover: "group-hover:bg-yellow-200"
  },
  {
    href: "/dashboard/part7/admin/reports",
    icon: FileText,
    title: "Raporlar",
    description: "Sınıf ve öğrenci raporlarını görüntüle",
    hoverBg: "hover:bg-slate-50",
    hoverBorder: "group-hover:border-slate-200",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    iconHover: "group-hover:bg-slate-200"
  },
  {
    href: "/dashboard/part7/admin/wishes",
    icon: Heart,
    title: "Dilekler",
    description: "Öğrenci dileklerini yönet ve incele",
    hoverBg: "hover:bg-pink-50",
    hoverBorder: "group-hover:border-pink-200",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
    iconHover: "group-hover:bg-pink-200"
  }
];

export default function QuickAccessGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {quickAccessItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <Link key={item.href} href={item.href} className="group">
            <div className={`border border-gray-200 rounded-xl p-5 bg-white ${item.hoverBg} transition-all duration-200 hover:shadow-md ${item.hoverBorder} h-full flex flex-col`}>
              <div className={`w-12 h-12 flex items-center justify-center rounded-full ${item.iconBg} ${item.iconColor} mb-4 ${item.iconHover} transition-colors duration-200`}>
                <IconComponent className="h-6 w-6" />
              </div>
              <h3 className="font-medium text-gray-800 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 mt-auto">{item.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
} 