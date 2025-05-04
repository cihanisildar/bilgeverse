import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Phone, Edit2, BookOpen, Layers, Award } from "lucide-react";

export function ProfileSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
        {/* Left Column - Profile Card */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            {/* Profile Header */}
            <div className="relative">
              <div className="h-24 sm:h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
              <div className="absolute -bottom-12 sm:-bottom-16 left-0 w-full flex justify-center">
                <Skeleton className="ring-4 ring-white rounded-full h-24 w-24 sm:h-32 sm:w-32" />
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="pt-16 sm:pt-20 pb-6 sm:pb-8 px-4 sm:px-6 text-center">
              <Skeleton className="h-6 sm:h-8 w-36 sm:w-48 mx-auto mb-2" />
              <Skeleton className="h-3 sm:h-4 w-28 sm:w-32 mx-auto mb-1" />
              <Skeleton className="h-3 sm:h-4 w-20 sm:w-24 mx-auto mb-4 sm:mb-6" />
              
              <div className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 border border-indigo-300 rounded-md bg-white">
                <Edit2 className="mr-1.5 sm:mr-2 h-3.5 sm:h-4 w-3.5 sm:w-4 text-indigo-700" />
                <Skeleton className="h-3.5 sm:h-4 w-20 sm:w-24" />
              </div>
            </div>
            
            {/* Contact Info */}
            <div className="border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">
                İletişim Bilgileri
              </h2>
              <ul className="space-y-2 sm:space-y-3">
                <li className="flex items-center">
                  <Mail className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400 mr-2 sm:mr-3" />
                  <Skeleton className="h-3.5 sm:h-4 w-32 sm:w-40" />
                </li>
                <li className="flex items-center">
                  <Phone className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400 mr-2 sm:mr-3" />
                  <Skeleton className="h-3.5 sm:h-4 w-28 sm:w-32" />
                </li>
                <li className="flex items-center">
                  <User className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400 mr-2 sm:mr-3" />
                  <Skeleton className="h-3.5 sm:h-4 w-24 sm:w-28" />
                </li>
              </ul>
            </div>
            
            {/* Stats */}
            <div className="border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">
                İstatistikler
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="bg-indigo-50 rounded-lg p-2 sm:p-3 text-center">
                  <Skeleton className="h-6 sm:h-8 w-10 sm:w-12 mx-auto mb-1" />
                  <div className="text-xs text-indigo-500">Öğrenci</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-2 sm:p-3 text-center">
                  <Skeleton className="h-6 sm:h-8 w-10 sm:w-12 mx-auto mb-1" />
                  <div className="text-xs text-purple-500">Etkinlik</div>
                </div>
                <div className="bg-green-50 rounded-lg p-2 sm:p-3 text-center">
                  <Skeleton className="h-6 sm:h-8 w-10 sm:w-12 mx-auto mb-1" />
                  <div className="text-xs text-green-500">Puan</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-2 sm:p-3 text-center">
                  <Skeleton className="h-6 sm:h-8 w-10 sm:w-12 mx-auto mb-1" />
                  <div className="text-xs text-blue-500">Tamamlanan</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Content Tabs */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-gray-100 overflow-x-auto">
              <nav className="flex -mb-px min-w-max">
                {[
                  { icon: User, label: "Hakkımda" },
                  { icon: BookOpen, label: "Dersler" },
                  { icon: Layers, label: "Eğitim" },
                  { icon: Award, label: "Sertifikalar" }
                ].map((tab, index) => (
                  <div
                    key={index}
                    className="py-3 sm:py-4 px-4 sm:px-6 inline-flex items-center text-gray-500"
                  >
                    <tab.icon className="mr-1.5 sm:mr-2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                    <Skeleton className="h-3.5 sm:h-4 w-12 sm:w-16" />
                  </div>
                ))}
              </nav>
            </div>
            
            {/* Tab Content */}
            <div className="p-4 sm:p-6">
              {/* About Tab Content */}
              <div>
                <Skeleton className="h-6 sm:h-8 w-28 sm:w-32 mb-3 sm:mb-4" />
                <div className="space-y-1.5 sm:space-y-2">
                  <Skeleton className="h-3.5 sm:h-4 w-full" />
                  <Skeleton className="h-3.5 sm:h-4 w-5/6" />
                  <Skeleton className="h-3.5 sm:h-4 w-4/6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 