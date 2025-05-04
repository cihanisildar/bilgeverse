import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { GraduationCap, Trophy, CheckCircle } from "lucide-react"

export function StudentListSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border border-blue-100 shadow-sm">
          <CardHeader className="pb-1.5 sm:pb-2">
            <CardTitle className="text-lg sm:text-xl text-gray-700">Toplam Öğrenci</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-gray-300 mr-2 sm:mr-3" />
              <Skeleton className="h-6 sm:h-8 w-14 sm:w-16" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-green-100 shadow-sm">
          <CardHeader className="pb-1.5 sm:pb-2">
            <CardTitle className="text-lg sm:text-xl text-gray-700">Ortalama Puan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-gray-300 mr-2 sm:mr-3" />
              <Skeleton className="h-6 sm:h-8 w-14 sm:w-16" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-purple-100 shadow-sm">
          <CardHeader className="pb-1.5 sm:pb-2">
            <CardTitle className="text-lg sm:text-xl text-gray-700">En Yüksek Puan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-gray-300 mr-2 sm:mr-3" />
              <Skeleton className="h-6 sm:h-8 w-14 sm:w-16" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students list skeleton */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 mr-3 sm:mr-4 border border-gray-200">
                    <Skeleton className="h-full w-full rounded-full" />
                  </Avatar>
                  <div>
                    <Skeleton className="h-3.5 sm:h-4 w-28 sm:w-32 mb-1.5 sm:mb-2" />
                    <Skeleton className="h-2.5 sm:h-3 w-20 sm:w-24" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 sm:gap-4">
                  <div className="text-center">
                    <Skeleton className="h-2.5 sm:h-3 w-6 sm:w-8 mb-1" />
                    <Skeleton className="h-5 sm:h-6 w-10 sm:w-12" />
                  </div>
                  
                  <div className="flex gap-1.5 sm:gap-2">
                    <Skeleton className="h-7 sm:h-8 w-16 sm:w-20" />
                    <Skeleton className="h-7 sm:h-8 w-16 sm:w-20" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 