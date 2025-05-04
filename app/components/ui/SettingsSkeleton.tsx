import { Skeleton } from "@/components/ui/skeleton";
import { User, Lock, Bell, Layout, ChevronRight } from "lucide-react";

export function SettingsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
        <Skeleton className="h-8 sm:h-10 w-24 sm:w-28" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <nav className="space-y-0.5 sm:space-y-1">
              {[
                { icon: User, label: "Profil Bilgileri" },
                { icon: Lock, label: "Güvenlik" },
                { icon: Bell, label: "Bildirimler" },
                { icon: Layout, label: "Görünüm" }
              ].map((item, index) => (
                <div
                  key={index}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between text-gray-700 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <item.icon className="mr-2 sm:mr-3 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                    <Skeleton className="h-3.5 sm:h-4 w-20 sm:w-24" />
                  </div>
                  <ChevronRight className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-gray-400" />
                </div>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
            {/* Profile Form */}
            <Skeleton className="h-6 sm:h-8 w-36 sm:w-48 mb-4 sm:mb-6" />
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Skeleton className="h-3.5 sm:h-4 w-14 sm:w-16 mb-1" />
                  <Skeleton className="h-9 sm:h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-3.5 sm:h-4 w-14 sm:w-16 mb-1" />
                  <Skeleton className="h-9 sm:h-10 w-full" />
                </div>
              </div>
              
              <div>
                <Skeleton className="h-3.5 sm:h-4 w-28 sm:w-32 mb-1" />
                <Skeleton className="h-9 sm:h-10 w-full" />
              </div>
              
              <div>
                <Skeleton className="h-3.5 sm:h-4 w-28 sm:w-32 mb-1" />
                <Skeleton className="h-9 sm:h-10 w-full" />
              </div>
              
              <div>
                <Skeleton className="h-3.5 sm:h-4 w-28 sm:w-32 mb-1" />
                <Skeleton className="h-9 sm:h-10 w-full" />
              </div>
              
              <div>
                <Skeleton className="h-3.5 sm:h-4 w-28 sm:w-32 mb-1" />
                <Skeleton className="h-20 sm:h-24 w-full" />
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-4 sm:mt-6">
              <Skeleton className="h-9 sm:h-10 w-32 sm:w-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 