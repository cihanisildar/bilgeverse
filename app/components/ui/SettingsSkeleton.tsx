import { Skeleton } from "@/components/ui/skeleton";
import { User, Lock, Bell, Layout, ChevronRight } from "lucide-react";

export function SettingsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-28" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <nav className="space-y-1">
              {[
                { icon: User, label: "Profil Bilgileri" },
                { icon: Lock, label: "Güvenlik" },
                { icon: Bell, label: "Bildirimler" },
                { icon: Layout, label: "Görünüm" }
              ].map((item, index) => (
                <div
                  key={index}
                  className="w-full px-4 py-3 flex items-center justify-between text-gray-700"
                >
                  <div className="flex items-center">
                    <item.icon className="mr-3 h-5 w-5 text-gray-400" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </div>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            {/* Profile Form */}
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6">
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 