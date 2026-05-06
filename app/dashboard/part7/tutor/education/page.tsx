"use client";

import Link from "next/link";
import { BookOpen, Users, ClipboardList, ArrowRight } from "lucide-react";

const educationLinks = [
  {
    title: "Karakter Eğitim Grupları",
    description: "Öğrenci gruplarını görüntüleyin, yoklama alın ve sosyometrik analiz yapın",
    href: "/dashboard/part2",
    icon: Users,
    gradient: "from-blue-500 to-indigo-500",
    bg: "from-blue-50 to-indigo-50",
    border: "border-blue-100",
    text: "text-blue-800",
    desc: "text-blue-700",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    arrowColor: "text-blue-500",
  },
  {
    title: "Buluşma İçeriği",
    description: "Haftalık buluşma içeriklerini planlayın ve müfredatı yönetin",
    href: "/dashboard/part2/syllabus",
    icon: ClipboardList,
    gradient: "from-violet-500 to-purple-500",
    bg: "from-violet-50 to-purple-50",
    border: "border-violet-100",
    text: "text-violet-800",
    desc: "text-violet-700",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    arrowColor: "text-violet-500",
  },
];

export default function EducationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-white p-4 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Eğitim İçerikleri</h1>
          </div>
          <p className="text-gray-500 ml-14">
            Karakter eğitim gruplarınızı ve buluşma içeriklerini yönetin
          </p>
        </div>

        {/* Cards */}
        <div className="space-y-4">
          {educationLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-5 p-6 bg-gradient-to-r ${item.bg} rounded-2xl border ${item.border} hover:shadow-md transition-all group`}
              >
                <div className={`p-3 ${item.iconBg} rounded-xl flex-shrink-0`}>
                  <Icon className={`h-7 w-7 ${item.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h2 className={`text-lg font-bold ${item.text}`}>{item.title}</h2>
                  <p className={`text-sm ${item.desc} mt-0.5`}>{item.description}</p>
                </div>
                <ArrowRight className={`h-5 w-5 ${item.arrowColor} group-hover:translate-x-1 transition-transform flex-shrink-0`} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
