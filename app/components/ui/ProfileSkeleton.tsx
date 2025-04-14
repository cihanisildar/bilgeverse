import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Phone, Edit2, BookOpen, Layers, Award } from "lucide-react";

export function ProfileSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Profile Card */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            {/* Profile Header */}
            <div className="relative">
              <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
              <div className="absolute -bottom-16 left-0 w-full flex justify-center">
                <Skeleton className="ring-4 ring-white rounded-full h-32 w-32" />
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="pt-20 pb-8 px-6 text-center">
              <Skeleton className="h-8 w-48 mx-auto mb-2" />
              <Skeleton className="h-4 w-32 mx-auto mb-1" />
              <Skeleton className="h-4 w-24 mx-auto mb-6" />
              
              <div className="inline-flex items-center justify-center px-4 py-2 border border-indigo-300 rounded-md bg-white">
                <Edit2 className="mr-2 h-4 w-4 text-indigo-700" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            
            {/* Contact Info */}
            <div className="border-t border-gray-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                İletişim Bilgileri
              </h2>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <Skeleton className="h-4 w-40" />
                </li>
                <li className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-3" />
                  <Skeleton className="h-4 w-32" />
                </li>
                <li className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <Skeleton className="h-4 w-28" />
                </li>
              </ul>
            </div>
            
            {/* Stats */}
            <div className="border-t border-gray-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                İstatistikler
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <Skeleton className="h-8 w-12 mx-auto mb-1" />
                  <div className="text-xs text-indigo-500">Öğrenci</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <Skeleton className="h-8 w-12 mx-auto mb-1" />
                  <div className="text-xs text-purple-500">Etkinlik</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <Skeleton className="h-8 w-12 mx-auto mb-1" />
                  <div className="text-xs text-green-500">Puan</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <Skeleton className="h-8 w-12 mx-auto mb-1" />
                  <div className="text-xs text-blue-500">Tamamlanan</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Content Tabs */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-gray-100">
              <nav className="flex -mb-px">
                {[
                  { icon: User, label: "Hakkımda" },
                  { icon: BookOpen, label: "Dersler" },
                  { icon: Layers, label: "Eğitim" },
                  { icon: Award, label: "Sertifikalar" }
                ].map((tab, index) => (
                  <div
                    key={index}
                    className="py-4 px-6 inline-flex items-center text-gray-500"
                  >
                    <tab.icon className="mr-2 h-5 w-5 text-gray-400" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </nav>
            </div>
            
            {/* Tab Content */}
            <div className="p-6">
              {/* About Tab Content */}
              <div>
                <Skeleton className="h-8 w-32 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 